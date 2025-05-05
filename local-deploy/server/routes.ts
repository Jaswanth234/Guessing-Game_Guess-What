import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupWebSockets } from "./websocket";
import { storage } from "./storage";
import { QuizStatus } from "@shared/schema";
import crypto from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSockets
  setupWebSockets(httpServer);

  // API Routes
  
  // Get all quizzes for the logged-in host
  app.get("/api/quizzes", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const quizzes = await storage.getQuizzesByHost(req.user.id);
      
      // Update status of quizzes based on current time
      const now = new Date();
      const updatedQuizzes = await Promise.all(
        quizzes.map(async (quiz) => {
          const startTime = new Date(quiz.startTime);
          const endTime = new Date(quiz.endTime);
          
          let newStatus = quiz.status;
          
          if (quiz.status === QuizStatus.SCHEDULED && now >= startTime && now < endTime) {
            newStatus = QuizStatus.ACTIVE;
            await storage.updateQuizStatus(quiz.id, QuizStatus.ACTIVE);
          } else if ((quiz.status === QuizStatus.SCHEDULED || quiz.status === QuizStatus.ACTIVE) && now >= endTime) {
            newStatus = QuizStatus.COMPLETED;
            await storage.updateQuizStatus(quiz.id, QuizStatus.COMPLETED);
          }
          
          return { ...quiz, status: newStatus };
        })
      );
      
      res.json(updatedQuizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  // Create a new quiz
  app.post("/api/quizzes", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { subject, section, gameMode, numPrizes, startTime, endTime, questions } = req.body;
      
      // Validate input
      if (!subject || !section || !gameMode || !startTime || !endTime || !questions) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Process and validate questions based on game mode
      const processedQuestions = questions.map((q: any) => {
        // Default question structure
        const question: any = {
          text: q.text,
          answers: q.answers,
          correctAnswers: q.correctAnswers || [],
          selectionType: q.selectionType || "single" // default to single selection
        };
        
        // Handle decoy options
        if (q.isDecoy && Array.isArray(q.isDecoy)) {
          question.isDecoy = q.isDecoy;
        }
        
        // Special handling for different question types
        if (gameMode === "single" && question.selectionType === "single") {
          // For single entry mode, ensure answers are comma-separated for backward compatibility
          if (q.answers.length === 1 && typeof q.answers[0] === 'string' && q.answers[0].includes(',')) {
            question.correctAnswers = q.answers[0].split(',').map((a: string) => a.trim());
          }
        }
        
        return question;
      });
      
      // Create the quiz
      const quiz = await storage.createQuiz({
        hostId: req.user.id,
        hostName: req.user.username,
        subject,
        section,
        gameMode,
        numPrizes: numPrizes || 3,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      }, processedQuestions);
      
      res.status(201).json(quiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(500).json({ message: "Failed to create quiz" });
    }
  });

  // Get a specific quiz by ID
  app.get("/api/quizzes/:id", async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      if (isNaN(quizId)) {
        return res.status(400).json({ message: "Invalid quiz ID" });
      }
      
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      // Update quiz status based on current time
      const now = new Date();
      const startTime = new Date(quiz.startTime);
      const endTime = new Date(quiz.endTime);
      
      let updatedQuiz = quiz;
      
      if (quiz.status === QuizStatus.SCHEDULED && now >= startTime && now < endTime) {
        updatedQuiz = await storage.updateQuizStatus(quiz.id, QuizStatus.ACTIVE);
      } else if ((quiz.status === QuizStatus.SCHEDULED || quiz.status === QuizStatus.ACTIVE) && now >= endTime) {
        updatedQuiz = await storage.updateQuizStatus(quiz.id, QuizStatus.COMPLETED);
      }
      
      // If not authenticated or not the owner, return limited info
      if (!req.isAuthenticated() || req.user.id !== quiz.hostId) {
        // For non-owners, don't expose correct answers for active quizzes
        if (updatedQuiz.status !== QuizStatus.COMPLETED) {
          const sanitizedQuestions = updatedQuiz.questions.map((q) => ({
            text: q.text,
            answers: q.answers,
            correctAnswers: [], // Hide correct answers
            selectionType: q.selectionType || 'single',
            isDecoy: q.isDecoy // Keep decoy information to display UI correctly
          }));
          
          updatedQuiz = {
            ...updatedQuiz,
            questions: sanitizedQuestions
          };
        }
      }
      
      res.json(updatedQuiz);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });

  // Submit answers for a quiz
  app.post("/api/quizzes/:id/submit", async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      if (isNaN(quizId)) {
        return res.status(400).json({ message: "Invalid quiz ID" });
      }
      
      const { playerName, answers } = req.body;
      if (!playerName || !answers) {
        return res.status(400).json({ message: "Missing player name or answers" });
      }
      
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      // Ensure quiz is active
      const now = new Date();
      const startTime = new Date(quiz.startTime);
      const endTime = new Date(quiz.endTime);
      
      if (now < startTime) {
        return res.status(400).json({ message: "Quiz has not started yet" });
      }
      
      if (now > endTime) {
        return res.status(400).json({ message: "Quiz has already ended" });
      }
      
      // Save participant's answers
      // Ensure answers are in the correct format for storage
      const formattedAnswers = Array.isArray(answers) 
        ? answers 
        : [answers];
        
      const participant = await storage.addParticipant({
        quizId,
        playerName,
        answers: formattedAnswers
      });
      
      res.status(201).json(participant);
    } catch (error) {
      console.error("Error submitting answers:", error);
      res.status(500).json({ message: "Failed to submit answers" });
    }
  });

  // Delete a quiz
  app.delete("/api/quizzes/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const quizId = parseInt(req.params.id);
      if (isNaN(quizId)) {
        return res.status(400).json({ message: "Invalid quiz ID" });
      }

      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Only allow host to delete their own quizzes
      if (quiz.hostId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      await storage.deleteQuiz(quizId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting quiz:", error);
      res.status(500).json({ message: "Failed to delete quiz" });
    }
  });

  // Get quiz results (only available after quiz has ended)
  app.get("/api/quizzes/:id/results", async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      if (isNaN(quizId)) {
        return res.status(400).json({ message: "Invalid quiz ID" });
      }
      
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      // Update quiz status if needed
      const now = new Date();
      const endTime = new Date(quiz.endTime);
      
      if (now >= endTime && quiz.status !== QuizStatus.COMPLETED) {
        await storage.updateQuizStatus(quiz.id, QuizStatus.COMPLETED);
        quiz.status = QuizStatus.COMPLETED;
      }
      
      // Only show results if quiz is completed
      if (quiz.status !== QuizStatus.COMPLETED) {
        return res.status(400).json({ message: "Quiz is still in progress" });
      }
      
      res.json(quiz);
    } catch (error) {
      console.error("Error fetching quiz results:", error);
      res.status(500).json({ message: "Failed to fetch quiz results" });
    }
  });

  return httpServer;
}
