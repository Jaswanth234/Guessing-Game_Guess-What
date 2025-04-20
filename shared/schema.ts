import { pgTable, text, serial, timestamp, integer, boolean, primaryKey, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  phone: true,
});

// Quiz status enum
export enum QuizStatus {
  SCHEDULED = "Scheduled",
  ACTIVE = "Active",
  COMPLETED = "Completed",
}

// Quiz schema
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  hostId: integer("host_id").notNull().references(() => users.id),
  hostName: text("host_name"),
  subject: text("subject").notNull(),
  section: text("section").notNull(),
  gameMode: text("game_mode").notNull(), // "single" or "multi"
  numPrizes: integer("num_prizes").notNull().default(3),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").notNull().default("Scheduled"),
  shortCode: text("short_code").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  questions: json("questions").$type<{
    text: string;
    answers: string[];
    correctAnswers: (string | number)[];
  }[]>().notNull(),
});

export const insertQuizSchema = createInsertSchema(quizzes).pick({
  hostId: true,
  hostName: true,
  subject: true,
  section: true,
  gameMode: true,
  numPrizes: true,
  startTime: true,
  endTime: true,
});

// Participant schema
export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id),
  playerName: text("player_name").notNull(),
  answers: json("answers").$type<(string | number)[]>().notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const insertParticipantSchema = createInsertSchema(participants).pick({
  quizId: true,
  playerName: true,
  answers: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;

export type Participant = typeof participants.$inferSelect;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
