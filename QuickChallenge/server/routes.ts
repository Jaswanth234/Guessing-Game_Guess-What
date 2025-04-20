import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupWebSocketServer } from "./websocket";
import { z } from "zod";
import { 
  insertQuizSchema, 
  insertQuestionSchema, 
  insertParticipantSchema
} from "@shared/schema";

// Authentication middleware
function isAuthenticated(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup auth routes
  setupAuth(app);

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  setupWebSocketServer(httpServer);

  // Quiz Routes
  app.post("/api/quizzes", isAuthenticated, async (req, res, next) => {
    try {
      const hostId = req.user!.id;
      
      // Validate request body
      const quizData = insertQuizSchema.parse({ ...req.body, hostId });
      
      // Create quiz
      const quiz = await storage.createQuiz(quizData);
      
      res.status(201).json(quiz);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/quizzes", isAuthenticated, async (req, res, next) => {
    try {
      const hostId = req.user!.id;
      
      // Get quizzes for the host
      const quizzes = await storage.getQuizzesByHostId(hostId);
      
      res.status(200).json(quizzes);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/quizzes/:id", isAuthenticated, async (req, res, next) => {
    try {
      const quizId = parseInt(req.params.id);
      const hostId = req.user!.id;
      
      // Get quiz
      const quiz = await storage.getQuiz(quizId);
      
      // Check if quiz exists and belongs to host
      if (!quiz || quiz.hostId !== hostId) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      res.status(200).json(quiz);
    } catch (err) {
      next(err);
    }
  });

  app.patch("/api/quizzes/:id", isAuthenticated, async (req, res, next) => {
    try {
      const quizId = parseInt(req.params.id);
      const hostId = req.user!.id;
      
      // Get quiz
      const quiz = await storage.getQuiz(quizId);
      
      // Check if quiz exists and belongs to host
      if (!quiz || quiz.hostId !== hostId) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      // Update quiz
      const updatedQuiz = await storage.updateQuiz(quizId, req.body);
      
      res.status(200).json(updatedQuiz);
    } catch (err) {
      next(err);
    }
  });

  app.delete("/api/quizzes/:id", isAuthenticated, async (req, res, next) => {
    try {
      const quizId = parseInt(req.params.id);
      const hostId = req.user!.id;
      
      // Get quiz
      const quiz = await storage.getQuiz(quizId);
      
      // Check if quiz exists and belongs to host
      if (!quiz || quiz.hostId !== hostId) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      // Deactivate quiz
      await storage.deactivateQuiz(quizId);
      
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  // Question Routes
  app.post("/api/quizzes/:quizId/questions", isAuthenticated, async (req, res, next) => {
    try {
      const quizId = parseInt(req.params.quizId);
      const hostId = req.user!.id;
      
      // Get quiz
      const quiz = await storage.getQuiz(quizId);
      
      // Check if quiz exists and belongs to host
      if (!quiz || quiz.hostId !== hostId) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      // Validate request body
      const questionData = insertQuestionSchema.parse({ ...req.body, quizId });
      
      // Create question
      const question = await storage.createQuestion(questionData);
      
      res.status(201).json(question);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/quizzes/:quizId/questions", isAuthenticated, async (req, res, next) => {
    try {
      const quizId = parseInt(req.params.quizId);
      const hostId = req.user!.id;
      
      // Get quiz
      const quiz = await storage.getQuiz(quizId);
      
      // Check if quiz exists and belongs to host
      if (!quiz || quiz.hostId !== hostId) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      // Get questions
      const questions = await storage.getQuestionsByQuizId(quizId);
      
      res.status(200).json(questions);
    } catch (err) {
      next(err);
    }
  });

  // Participant Routes
  app.post("/api/quizzes/:accessCode/join", async (req, res, next) => {
    try {
      const { accessCode } = req.params;
      
      // Get quiz
      const quiz = await storage.getQuizByAccessCode(accessCode);
      
      // Check if quiz exists and is active
      if (!quiz || !quiz.isActive) {
        return res.status(404).json({ message: "Quiz not found or inactive" });
      }
      
      // Validate request body
      const participantData = insertParticipantSchema.parse({ 
        ...req.body, 
        quizId: quiz.id 
      });
      
      // Create participant
      const participant = await storage.createParticipant(participantData);
      
      res.status(201).json({ participant, quiz });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/quizzes/:accessCode", async (req, res, next) => {
    try {
      const { accessCode } = req.params;
      
      // Get quiz
      const quiz = await storage.getQuizByAccessCode(accessCode);
      
      // Check if quiz exists
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      res.status(200).json(quiz);
    } catch (err) {
      next(err);
    }
  });

  // Results Routes
  app.get("/api/quizzes/:id/results", isAuthenticated, async (req, res, next) => {
    try {
      const quizId = parseInt(req.params.id);
      const hostId = req.user!.id;
      
      // Get quiz
      const quiz = await storage.getQuiz(quizId);
      
      // Check if quiz exists and belongs to host
      if (!quiz || quiz.hostId !== hostId) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      // Get results
      const results = await storage.getResultsByQuizId(quizId);
      
      // Get participants
      const participants = await storage.getParticipantsByQuizId(quizId);
      const participantMap = new Map(participants.map(p => [p.id, p]));
      
      const resultsWithParticipants = results.map(result => ({
        ...result,
        participant: participantMap.get(result.participantId)
      }));
      
      res.status(200).json(resultsWithParticipants);
    } catch (err) {
      next(err);
    }
  });

  return httpServer;
}
