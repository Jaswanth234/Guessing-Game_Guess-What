import { WebSocketServer, WebSocket } from "ws";
import { Server as HttpServer } from "http";
import { storage } from "./storage";
import { QuizStatus } from "@shared/schema";

interface ClientConnection {
  ws: WebSocket;
  quizId?: number;
  isHost?: boolean;
  userId?: number;
}

interface WebSocketMessage {
  type: string;
  payload: any;
}

export function setupWebSockets(server: HttpServer): void {
  // Use a specific path for our WebSocket server to avoid conflicts with Vite
  const wss = new WebSocketServer({ 
    server,
    path: "/api/ws"
  });
  
  console.log("WebSocket server is running");
  
  // Map to store client connections
  const clients: Map<WebSocket, ClientConnection> = new Map();
  
  // Set up interval to check for quiz status updates
  setInterval(async () => {
    try {
      // Get all active quizzes
      const activeQuizzes = Array.from(clients.values())
        .filter(client => client.quizId !== undefined)
        .map(client => client.quizId);
      
      // Remove duplicates
      const uniqueQuizIds = Array.from(new Set(activeQuizzes));
      
      // For each active quiz, check if status needs to be updated
      const now = new Date();
      
      for (const quizId of uniqueQuizIds) {
        if (!quizId) continue;
        
        const quiz = await storage.getQuiz(quizId);
        if (!quiz) continue;
        
        const startTime = new Date(quiz.startTime);
        const endTime = new Date(quiz.endTime);
        
        let statusUpdated = false;
        
        // Check if status needs to be updated
        if (quiz.status === QuizStatus.SCHEDULED && now >= startTime && now < endTime) {
          await storage.updateQuizStatus(quiz.id, QuizStatus.ACTIVE);
          statusUpdated = true;
        } else if ((quiz.status === QuizStatus.SCHEDULED || quiz.status === QuizStatus.ACTIVE) && now >= endTime) {
          await storage.updateQuizStatus(quiz.id, QuizStatus.COMPLETED);
          statusUpdated = true;
        }
        
        // If status was updated, notify all clients connected to this quiz
        if (statusUpdated) {
          const updatedQuiz = await storage.getQuiz(quizId);
          
          // Iterate through clients
          clients.forEach((client, ws) => {
            if (client.quizId === quizId && ws.readyState === WebSocket.OPEN) {
              // For non-host clients, don't expose correct answers for active quizzes
              if (!client.isHost && updatedQuiz && updatedQuiz.status !== QuizStatus.COMPLETED) {
                const sanitizedQuestions = updatedQuiz.questions.map((q) => ({
                  text: q.text,
                  answers: q.answers,
                  correctAnswers: [] // Hide correct answers
                }));
                
                const sanitizedQuiz = {
                  ...updatedQuiz,
                  questions: sanitizedQuestions
                };
                
                ws.send(JSON.stringify({
                  type: "quiz-updated",
                  payload: sanitizedQuiz
                }));
              } else {
                ws.send(JSON.stringify({
                  type: "quiz-updated",
                  payload: updatedQuiz
                }));
              }
            }
          })
        }
        
        // If the quiz is active, send time updates
        if (quiz.status === QuizStatus.ACTIVE) {
          const timeLeft = Math.max(0, endTime.getTime() - now.getTime());
          
          // Iterate through clients
          clients.forEach((client, ws) => {
            if (client.quizId === quizId && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: "time-update",
                payload: {
                  quizId,
                  timeLeft
                }
              }));
            }
          });
        }
      }
    } catch (error) {
      console.error("Error in WebSocket interval:", error);
    }
  }, 1000); // Check every second
  
  wss.on("connection", (ws) => {
    // Add new client to the map
    clients.set(ws, { ws });
    
    ws.on("message", async (message) => {
      try {
        const data: WebSocketMessage = JSON.parse(message.toString());
        const client = clients.get(ws);
        
        if (!client) return;
        
        switch (data.type) {
          case "join-quiz":
            // User wants to join a quiz
            const { quizId, isHost, userId } = data.payload;
            
            // Update client information
            clients.set(ws, {
              ...client,
              quizId,
              isHost: isHost || false,
              userId
            });
            
            // Send initial quiz data
            const quiz = await storage.getQuiz(quizId);
            if (quiz) {
              // For non-host clients, don't expose correct answers for active quizzes
              if (!isHost && quiz.status !== QuizStatus.COMPLETED) {
                const sanitizedQuestions = quiz.questions.map((q) => ({
                  text: q.text,
                  answers: q.answers,
                  correctAnswers: [] // Hide correct answers
                }));
                
                const sanitizedQuiz = {
                  ...quiz,
                  questions: sanitizedQuestions
                };
                
                ws.send(JSON.stringify({
                  type: "quiz-data",
                  payload: sanitizedQuiz
                }));
              } else {
                ws.send(JSON.stringify({
                  type: "quiz-data",
                  payload: quiz
                }));
              }
            }
            break;
            
          case "submit-answer":
            // User submitted an answer
            const { quizId: submitQuizId, playerName, answers } = data.payload;
            
            // Save the answer in the database
            const participant = await storage.addParticipant({
              quizId: submitQuizId,
              playerName,
              answers
            });
            
            // Notify the host about the new participant
            clients.forEach((hostClient, hostWs) => {
              if (hostClient.quizId === submitQuizId && hostClient.isHost && hostWs.readyState === WebSocket.OPEN) {
                hostWs.send(JSON.stringify({
                  type: "new-participant",
                  payload: participant
                }));
              }
            });
            
            // Confirm submission to the client
            ws.send(JSON.stringify({
              type: "answer-submitted",
              payload: { success: true }
            }));
            break;
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
        ws.send(JSON.stringify({
          type: "error",
          payload: { message: "Failed to process message" }
        }));
      }
    });
    
    ws.on("close", () => {
      // Remove client when connection is closed
      clients.delete(ws);
    });
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: "connected",
      payload: { message: "Connected to QuizMaster WebSocket server" }
    }));
  });
  
  console.log("WebSocket server is running");
}
