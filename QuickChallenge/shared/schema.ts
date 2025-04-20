import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Host schema
export const hosts = pgTable("hosts", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertHostSchema = createInsertSchema(hosts).omit({
  id: true,
  createdAt: true,
});

// Quiz schema
export enum GameMode {
  SINGLE_ENTRY = "single_entry",
  MULTI_CHOICE = "multi_choice",
}

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  hostId: integer("host_id").notNull(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  section: text("section").notNull(),
  gameMode: text("game_mode").notNull(), // "single_entry" or "multi_choice"
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  prizesCount: integer("prizes_count").notNull(),
  accessCode: text("access_code").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
  accessCode: true,
});

// Question schema
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  text: text("text").notNull(),
  options: jsonb("options").notNull(), // For multi-choice, array of options; for single entry, array of correct answers
  correctAnswers: jsonb("correct_answers").notNull(), // Array of indices or strings
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

// Participant schema
export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertParticipantSchema = createInsertSchema(participants).omit({
  id: true, 
  createdAt: true,
});

// Answer schema
export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  participantId: integer("participant_id").notNull(),
  questionId: integer("question_id").notNull(),
  quizId: integer("quiz_id").notNull(),
  answer: jsonb("answer").notNull(), // Answer content (string or array of indices)
  isCorrect: boolean("is_correct").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const insertAnswerSchema = createInsertSchema(answers).omit({
  id: true,
  submittedAt: true,
});

// Results schema
export const results = pgTable("results", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  participantId: integer("participant_id").notNull(),
  score: integer("score").notNull(),
  timeTaken: integer("time_taken").notNull(), // in seconds
  rank: integer("rank"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertResultSchema = createInsertSchema(results).omit({
  id: true,
  createdAt: true,
});

// Type definitions
export type Host = typeof hosts.$inferSelect;
export type InsertHost = z.infer<typeof insertHostSchema>;

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type Participant = typeof participants.$inferSelect;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;

export type Answer = typeof answers.$inferSelect;
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;

export type Result = typeof results.$inferSelect;
export type InsertResult = z.infer<typeof insertResultSchema>;

// Authentication type
export type LoginData = {
  username: string;
  password: string;
};
