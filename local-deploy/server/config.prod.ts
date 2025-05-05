// Production Configuration Settings
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load production environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.production') });

// Server configuration
export const SERVER_CONFIG = {
  port: process.env.PORT || 5000,
  host: process.env.HOST || '0.0.0.0',
  sessionSecret: process.env.SESSION_SECRET || 'default_secret_replace_in_production',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  databaseUrl: process.env.DATABASE_URL || '',
};

// Database configuration
export const DB_CONFIG = {
  connectionString: SERVER_CONFIG.databaseUrl,
  ssl: { rejectUnauthorized: false }, // Needed for some production PostgreSQL services
};

// Session configuration for production (PostgreSQL backed)
export const SESSION_CONFIG = {
  secret: SERVER_CONFIG.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // Use secure cookies in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
  // Store will be configured in the main server file
};

// WebSocket configuration
export const WS_CONFIG = {
  path: '/ws',
  // Additional WebSocket options for production
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 10,
    concurrencyLimit: 10,
    threshold: 1024
  }
};