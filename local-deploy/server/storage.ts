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
import connectPg from "connect-pg-simple";
import crypto from "crypto";
import { pool, db } from "./db";
import { eq, and } from "drizzle-orm";

// Create PostgreSQL session store
const PostgresSessionStore = connectPg(session);

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
  sessionStore: any; // session store type
}

export class DatabaseStorage implements IStorage {
  public sessionStore: any; // Using any for session store

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Quiz methods
  async createQuiz(insertQuiz: InsertQuiz, questions: any[]): Promise<Quiz> {
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
    
    const [quiz] = await db.insert(quizzes).values({
      ...insertQuiz,
      status,
      shortCode,
      questions
    }).returning();
    
    return quiz;
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    
    if (quiz) {
      // Fetch participants for this quiz
      const quizParticipants = await this.getParticipantsByQuiz(id);
      
      // Attach participants to the quiz
      return {
        ...quiz,
        participants: quizParticipants
      };
    }
    
    return quiz;
  }

  async getQuizByShortCode(shortCode: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.shortCode, shortCode));
    
    if (quiz) {
      // Fetch participants for this quiz
      const quizParticipants = await this.getParticipantsByQuiz(quiz.id);
      
      // Attach participants to the quiz
      return {
        ...quiz,
        participants: quizParticipants
      };
    }
    
    return quiz;
  }

  async deleteQuiz(id: number): Promise<void> {
    // Delete participants first due to foreign key constraint
    await db.delete(participants).where(eq(participants.quizId, id));
    await db.delete(quizzes).where(eq(quizzes.id, id));
  }

  async getQuizzesByHost(hostId: number): Promise<Quiz[]> {
    const hostQuizzes = await db.select().from(quizzes).where(eq(quizzes.hostId, hostId));
    
    // Fetch participants for each quiz
    const quizzesWithParticipants = await Promise.all(
      hostQuizzes.map(async (quiz) => {
        const quizParticipants = await this.getParticipantsByQuiz(quiz.id);
        return {
          ...quiz,
          participants: quizParticipants
        };
      })
    );
    
    return quizzesWithParticipants;
  }

  async updateQuizStatus(id: number, status: QuizStatus): Promise<Quiz> {
    const [updatedQuiz] = await db
      .update(quizzes)
      .set({ status })
      .where(eq(quizzes.id, id))
      .returning();
    
    if (!updatedQuiz) {
      throw new Error(`Quiz with ID ${id} not found`);
    }
    
    // Fetch participants for this quiz
    const quizParticipants = await this.getParticipantsByQuiz(id);
    
    // Return the updated quiz with participants
    return {
      ...updatedQuiz,
      participants: quizParticipants
    };
  }

  // Participant methods
  async addParticipant(insertParticipant: InsertParticipant): Promise<Participant> {
    // Ensure answers is properly formatted as an array for Drizzle
    const formattedParticipant = {
      ...insertParticipant,
      answers: Array.isArray(insertParticipant.answers) ? insertParticipant.answers : []
    };
    
    const [participant] = await db
      .insert(participants)
      .values(formattedParticipant)
      .returning();
    
    return participant;
  }

  async getParticipantsByQuiz(quizId: number): Promise<Participant[]> {
    return await db
      .select()
      .from(participants)
      .where(eq(participants.quizId, quizId));
  }
}

export const storage = new DatabaseStorage();
