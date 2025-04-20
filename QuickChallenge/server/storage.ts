import { 
  Host, InsertHost, 
  Quiz, InsertQuiz, 
  Question, InsertQuestion, 
  Participant, InsertParticipant, 
  Answer, InsertAnswer, 
  Result, InsertResult,
  hosts, quizzes, questions, participants, answers, results
} from "@shared/schema";
import { nanoid } from "nanoid";
import createMemoryStore from "memorystore";
import session from "express-session";
import { db } from "./db";
import { eq } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);
const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Host Methods
  getHost(id: number): Promise<Host | undefined>;
  getHostByUsername(username: string): Promise<Host | undefined>;
  createHost(host: InsertHost): Promise<Host>;

  // Quiz Methods
  getQuiz(id: number): Promise<Quiz | undefined>;
  getQuizByAccessCode(accessCode: string): Promise<Quiz | undefined>;
  getQuizzesByHostId(hostId: number): Promise<Quiz[]>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  updateQuiz(id: number, quiz: Partial<Quiz>): Promise<Quiz | undefined>;
  deactivateQuiz(id: number): Promise<boolean>;

  // Question Methods
  getQuestion(id: number): Promise<Question | undefined>;
  getQuestionsByQuizId(quizId: number): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;

  // Participant Methods
  getParticipant(id: number): Promise<Participant | undefined>;
  getParticipantsByQuizId(quizId: number): Promise<Participant[]>;
  createParticipant(participant: InsertParticipant): Promise<Participant>;

  // Answer Methods
  getAnswer(id: number): Promise<Answer | undefined>;
  getAnswersByParticipantId(participantId: number): Promise<Answer[]>;
  getAnswersByQuizId(quizId: number): Promise<Answer[]>;
  createAnswer(answer: InsertAnswer): Promise<Answer>;

  // Result Methods
  getResult(id: number): Promise<Result | undefined>;
  getResultsByQuizId(quizId: number): Promise<Result[]>;
  createResult(result: InsertResult): Promise<Result>;
  updateResult(id: number, result: Partial<Result>): Promise<Result | undefined>;

  // Session Store
  sessionStore: session.Store;
}

// Database Storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getHost(id: number): Promise<Host | undefined> {
    const [host] = await db.select().from(hosts).where(eq(hosts.id, id));
    return host;
  }

  async getHostByUsername(username: string): Promise<Host | undefined> {
    const [host] = await db.select().from(hosts).where(eq(hosts.username, username));
    return host;
  }

  async createHost(insertHost: InsertHost): Promise<Host> {
    const [host] = await db.insert(hosts).values(insertHost).returning();
    return host;
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }

  async getQuizByAccessCode(accessCode: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.accessCode, accessCode));
    return quiz;
  }

  async getQuizzesByHostId(hostId: number): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.hostId, hostId));
  }

  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    // Generate a random 6-character uppercase access code
    const accessCode = nanoid(6).toUpperCase();
    
    const [quiz] = await db.insert(quizzes).values({
      ...insertQuiz,
      accessCode,
      isActive: true
    }).returning();
    
    return quiz;
  }

  async updateQuiz(id: number, quizUpdate: Partial<Quiz>): Promise<Quiz | undefined> {
    const [updatedQuiz] = await db.update(quizzes)
      .set(quizUpdate)
      .where(eq(quizzes.id, id))
      .returning();
    
    return updatedQuiz;
  }

  async deactivateQuiz(id: number): Promise<boolean> {
    const [quiz] = await db.update(quizzes)
      .set({ isActive: false })
      .where(eq(quizzes.id, id))
      .returning();
    
    return !!quiz;
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  async getQuestionsByQuizId(quizId: number): Promise<Question[]> {
    return await db.select().from(questions).where(eq(questions.quizId, quizId));
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const [question] = await db.insert(questions).values(insertQuestion).returning();
    return question;
  }

  async getParticipant(id: number): Promise<Participant | undefined> {
    const [participant] = await db.select().from(participants).where(eq(participants.id, id));
    return participant;
  }

  async getParticipantsByQuizId(quizId: number): Promise<Participant[]> {
    return await db.select().from(participants).where(eq(participants.quizId, quizId));
  }

  async createParticipant(insertParticipant: InsertParticipant): Promise<Participant> {
    const [participant] = await db.insert(participants).values(insertParticipant).returning();
    return participant;
  }

  async getAnswer(id: number): Promise<Answer | undefined> {
    const [answer] = await db.select().from(answers).where(eq(answers.id, id));
    return answer;
  }

  async getAnswersByParticipantId(participantId: number): Promise<Answer[]> {
    return await db.select().from(answers).where(eq(answers.participantId, participantId));
  }

  async getAnswersByQuizId(quizId: number): Promise<Answer[]> {
    return await db.select().from(answers).where(eq(answers.quizId, quizId));
  }

  async createAnswer(insertAnswer: InsertAnswer): Promise<Answer> {
    const [answer] = await db.insert(answers).values(insertAnswer).returning();
    return answer;
  }

  async getResult(id: number): Promise<Result | undefined> {
    const [result] = await db.select().from(results).where(eq(results.id, id));
    return result;
  }

  async getResultsByQuizId(quizId: number): Promise<Result[]> {
    return await db.select().from(results)
      .where(eq(results.quizId, quizId));
  }

  async createResult(insertResult: InsertResult): Promise<Result> {
    const [result] = await db.insert(results).values(insertResult).returning();
    return result;
  }

  async updateResult(id: number, resultUpdate: Partial<Result>): Promise<Result | undefined> {
    const [updatedResult] = await db.update(results)
      .set(resultUpdate)
      .where(eq(results.id, id))
      .returning();
    
    return updatedResult;
  }
}

// For development, we'll use the database storage implementation
export const storage = new DatabaseStorage();