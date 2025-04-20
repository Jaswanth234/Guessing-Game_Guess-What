import { 
  User, 
  InsertUser, 
  Quiz, 
  InsertQuiz, 
  Participant, 
  InsertParticipant, 
  QuizStatus 
} from "@shared/schema";
import { users, quizzes, participants } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import crypto from "crypto";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Quiz methods
  createQuiz(quiz: InsertQuiz, questions: any[]): Promise<Quiz>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  getQuizByShortCode(shortCode: string): Promise<Quiz | undefined>;
  getQuizzesByHost(hostId: number): Promise<Quiz[]>;
  updateQuizStatus(id: number, status: QuizStatus): Promise<Quiz>;
  
  // Participant methods
  addParticipant(participant: InsertParticipant): Promise<Participant>;
  getParticipantsByQuiz(quizId: number): Promise<Participant[]>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private quizzes: Map<number, Quiz>;
  private participants: Map<number, Participant>;
  public sessionStore: session.SessionStore;

  private userIdCounter: number;
  private quizIdCounter: number;
  private participantIdCounter: number;

  constructor() {
    this.users = new Map();
    this.quizzes = new Map();
    this.participants = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24h
    });
    
    this.userIdCounter = 1;
    this.quizIdCounter = 1;
    this.participantIdCounter = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }

  // Quiz methods
  async createQuiz(insertQuiz: InsertQuiz, questions: any[]): Promise<Quiz> {
    const id = this.quizIdCounter++;
    const createdAt = new Date();
    // Generate a unique short code (6 characters)
    const shortCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    
    // Determine initial status based on start time
    const now = new Date();
    const startTime = new Date(insertQuiz.startTime);
    const endTime = new Date(insertQuiz.endTime);
    
    let status = QuizStatus.SCHEDULED;
    if (now >= startTime && now < endTime) {
      status = QuizStatus.ACTIVE;
    } else if (now >= endTime) {
      status = QuizStatus.COMPLETED;
    }
    
    const quiz: Quiz = { 
      ...insertQuiz, 
      id, 
      createdAt, 
      shortCode, 
      status,
      questions,
      participants: []
    };
    
    this.quizzes.set(id, quiz);
    return quiz;
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    return this.quizzes.get(id);
  }

  async getQuizByShortCode(shortCode: string): Promise<Quiz | undefined> {
    return Array.from(this.quizzes.values()).find(
      (quiz) => quiz.shortCode === shortCode
    );
  }

  async getQuizzesByHost(hostId: number): Promise<Quiz[]> {
    return Array.from(this.quizzes.values()).filter(
      (quiz) => quiz.hostId === hostId
    );
  }

  async updateQuizStatus(id: number, status: QuizStatus): Promise<Quiz> {
    const quiz = this.quizzes.get(id);
    if (!quiz) {
      throw new Error(`Quiz with ID ${id} not found`);
    }
    
    const updatedQuiz = { ...quiz, status };
    this.quizzes.set(id, updatedQuiz);
    return updatedQuiz;
  }

  // Participant methods
  async addParticipant(insertParticipant: InsertParticipant): Promise<Participant> {
    const id = this.participantIdCounter++;
    const submittedAt = new Date();
    
    const participant: Participant = { 
      ...insertParticipant, 
      id, 
      submittedAt 
    };
    
    this.participants.set(id, participant);
    
    // Update quiz with new participant
    const quiz = this.quizzes.get(insertParticipant.quizId);
    if (quiz) {
      const updatedQuiz = { 
        ...quiz, 
        participants: [...(quiz.participants || []), participant] 
      };
      this.quizzes.set(quiz.id, updatedQuiz);
    }
    
    return participant;
  }

  async getParticipantsByQuiz(quizId: number): Promise<Participant[]> {
    return Array.from(this.participants.values()).filter(
      (participant) => participant.quizId === quizId
    );
  }
}

export const storage = new MemStorage();
