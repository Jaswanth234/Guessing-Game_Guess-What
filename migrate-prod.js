/**
 * Production Database Migration Script
 * 
 * Run this script after setting up your RDS database
 * to create the necessary tables and schema.
 * 
 * Usage: node migrate-prod.js
 */

import { drizzle } from 'drizzle-orm/pg-core';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load production environment variables
dotenv.config({ path: path.join(__dirname, '.env.production') });

async function main() {
  console.log('Starting database migration...');

  try {
    // Validate database URL
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set in the environment variables');
    }

    // Create Postgres client
    const client = postgres(process.env.DATABASE_URL, {
      ssl: { rejectUnauthorized: false }
    });
    
    // Initialize Drizzle with the client
    const db = drizzle(client);
    
    // Run migrations
    console.log('Running migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });
    
    console.log('Migrations completed successfully!');
    
    // Close the database connection
    await client.end();
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();