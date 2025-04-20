import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { storage } from "./storage";

// Define message types
type ClientMessage = {
  type: string;
  payload: any;
};

type ServerMessage = {
  type: string;
  payload: any;
};

export function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  // Map to track active quiz rooms
  const quizRooms = new Map<string, Set<WebSocket>>();
  
  // Map to track which quiz a client is connected to
  const clientQuizMap = new Map<WebSocket, string>();

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');
    
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message) as ClientMessage;
        
        switch (data.type) {
          case 'JOIN_QUIZ': {
            const { accessCode, participantId } = data.payload;
            const quiz = await storage.getQuizByAccessCode(accessCode);
            
            if (!quiz) {
              sendToClient(ws, {
                type: 'ERROR',
                payload: { message: 'Quiz not found' }
              });
              return;
            }
            
            // Add client to quiz room
            if (!quizRooms.has(accessCode)) {
              quizRooms.set(accessCode, new Set<WebSocket>());
            }
            
            quizRooms.get(accessCode)?.add(ws);
            clientQuizMap.set(ws, accessCode);
            
            // Send quiz details to client
            const questions = await storage.getQuestionsByQuizId(quiz.id);
            
            sendToClient(ws, {
              type: 'QUIZ_JOINED',
              payload: {
                quiz,
                questions,
                participantId
              }
            });
            
            // Notify others that a new participant joined
            broadcastToQuiz(accessCode, {
              type: 'PARTICIPANT_JOINED',
              payload: { participantId }
            }, ws);
            
            break;
          }
          
          case 'SUBMIT_ANSWER': {
            const { answer, questionId, quizId, participantId } = data.payload;
            
            // Validate quiz is active
            const quiz = await storage.getQuiz(quizId);
            if (!quiz || !quiz.isActive) {
              sendToClient(ws, {
                type: 'ERROR',
                payload: { message: 'Quiz is not active' }
              });
              return;
            }
            
            // Check if question exists
            const question = await storage.getQuestion(questionId);
            if (!question) {
              sendToClient(ws, {
                type: 'ERROR',
                payload: { message: 'Question not found' }
              });
              return;
            }
            
            // Check if answer is correct
            let isCorrect = false;
            if (quiz.gameMode === 'single_entry') {
              // For single entry, check if the answer is in the list of correct answers
              const correctAnswers = question.correctAnswers as string[];
              isCorrect = correctAnswers.some(
                correctAns => correctAns.toLowerCase() === answer.toLowerCase()
              );
            } else if (quiz.gameMode === 'multi_choice') {
              // For multi-choice, compare with correct indices
              const correctIndices = question.correctAnswers as number[];
              if (Array.isArray(answer)) {
                isCorrect = JSON.stringify(answer.sort()) === JSON.stringify(correctIndices.sort());
              } else {
                isCorrect = correctIndices.includes(answer);
              }
            }
            
            // Save the answer
            const savedAnswer = await storage.createAnswer({
              participantId,
              questionId,
              quizId,
              answer,
              isCorrect
            });
            
            // Send confirmation to client
            sendToClient(ws, {
              type: 'ANSWER_SUBMITTED',
              payload: {
                answerId: savedAnswer.id,
                isCorrect
              }
            });
            
            break;
          }
          
          case 'END_QUIZ': {
            const { quizId } = data.payload;
            
            // Check if quiz exists
            const quiz = await storage.getQuiz(quizId);
            if (!quiz) {
              sendToClient(ws, {
                type: 'ERROR',
                payload: { message: 'Quiz not found' }
              });
              return;
            }
            
            // Deactivate the quiz
            await storage.deactivateQuiz(quizId);
            
            // Get all answers for this quiz
            const answers = await storage.getAnswersByQuizId(quizId);
            
            // Get participants
            const participants = await storage.getParticipantsByQuizId(quizId);
            
            // Calculate scores for each participant
            for (const participant of participants) {
              const participantAnswers = answers.filter(answer => answer.participantId === participant.id);
              
              const score = participantAnswers.filter(answer => answer.isCorrect).length;
              
              // Calculate time taken (difference between first and last answer)
              const sortedAnswers = participantAnswers.sort(
                (a, b) => a.submittedAt.getTime() - b.submittedAt.getTime()
              );
              
              let timeTaken = 0;
              if (sortedAnswers.length > 0) {
                const firstAnswerTime = sortedAnswers[0].submittedAt.getTime();
                const lastAnswerTime = sortedAnswers[sortedAnswers.length - 1].submittedAt.getTime();
                timeTaken = Math.floor((lastAnswerTime - firstAnswerTime) / 1000); // in seconds
              }
              
              // Create result
              await storage.createResult({
                quizId,
                participantId: participant.id,
                score,
                timeTaken,
                rank: 0 // Will be updated after all results are calculated
              });
            }
            
            // Get all results and assign ranks
            const results = await storage.getResultsByQuizId(quizId);
            
            // Assign ranks
            for (let i = 0; i < results.length; i++) {
              await storage.updateResult(results[i].id, { rank: i + 1 });
            }
            
            // Send results to all clients in the quiz room
            const updatedResults = await storage.getResultsByQuizId(quizId);
            const participantMap = new Map(participants.map(p => [p.id, p]));
            
            const resultsWithParticipants = updatedResults.map(result => ({
              ...result,
              participant: participantMap.get(result.participantId)
            }));
            
            broadcastToQuiz(quiz.accessCode, {
              type: 'QUIZ_ENDED',
              payload: {
                results: resultsWithParticipants.slice(0, quiz.prizesCount)
              }
            });
            
            break;
          }
          
          case 'PING':
            sendToClient(ws, { type: 'PONG', payload: {} });
            break;
        }
      } catch (error) {
        console.error('Error processing message:', error);
        sendToClient(ws, {
          type: 'ERROR',
          payload: { message: 'Invalid message format' }
        });
      }
    });
    
    ws.on('close', () => {
      // Remove client from quiz room
      const accessCode = clientQuizMap.get(ws);
      if (accessCode) {
        const room = quizRooms.get(accessCode);
        room?.delete(ws);
        
        if (room?.size === 0) {
          quizRooms.delete(accessCode);
        }
        
        clientQuizMap.delete(ws);
      }
      
      console.log('Client disconnected');
    });
  });
  
  // Helper function to send message to a client
  function sendToClient(client: WebSocket, message: ServerMessage) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }
  
  // Helper function to broadcast message to all clients in a quiz room
  function broadcastToQuiz(accessCode: string, message: ServerMessage, exclude?: WebSocket) {
    const room = quizRooms.get(accessCode);
    if (room) {
      room.forEach(client => {
        if (client !== exclude && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    }
  }
  
  return wss;
}
