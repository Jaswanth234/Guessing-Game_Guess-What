import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Check for DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set in your environment variables");
  console.error("Please create a .env file with DATABASE_URL=postgresql://postgres:yourpassword@localhost:5000/quiz-game");
  process.exit(1);
}

// Create pool with explicit config to work around Windows IPv6 issues
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Set explicit host to avoid IPv6 issues on Windows
  host: process.env.DATABASE_URL.includes('localhost') ? 'localhost' : undefined,
  // Force IPv4
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : undefined
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
});

export const db = drizzle(pool, { schema });

// Export pool for potential direct usage
export { pool };