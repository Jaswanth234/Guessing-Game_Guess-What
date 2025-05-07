// Script to create PostgreSQL tables for Windows users
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Use the DATABASE_URL from environment or default
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/quiz-game';

const pool = new Pool({ connectionString });

const createTables = async () => {
  try {
    console.log('Connecting to PostgreSQL database...');
    const client = await pool.connect();
    
    console.log('Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT,
        email TEXT,
        phone TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Creating quizzes table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id SERIAL PRIMARY KEY,
        host_id INTEGER NOT NULL,
        host_name TEXT,
        subject TEXT NOT NULL,
        section TEXT NOT NULL,
        game_mode TEXT NOT NULL,
        num_prizes INTEGER NOT NULL DEFAULT 3,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        status TEXT NOT NULL DEFAULT 'Scheduled',
        short_code TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        questions JSONB NOT NULL
      );
    `);
    
    console.log('Creating participants table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS participants (
        id SERIAL PRIMARY KEY,
        quiz_id INTEGER NOT NULL,
        player_name TEXT NOT NULL,
        answers JSONB NOT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Creating session table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP NOT NULL
      );
    `);
    
    console.log('Creating session index...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_session_expire ON session (expire);
    `);
    
    console.log('All tables created successfully!');
    client.release();
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await pool.end();
  }
};

createTables();