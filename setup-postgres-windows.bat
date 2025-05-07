@echo off
ECHO Setting up PostgreSQL Database for Quiz Application
ECHO ===================================================
ECHO.

SET HOST=localhost
SET PORT=5000
SET NODE_ENV=development
SET SESSION_SECRET=dev_secret_key
SET DATABASE_URL=postgresql://postgres:postgres@localhost:5433/quiz-game

ECHO Using PostgreSQL at: %DATABASE_URL%
ECHO.
ECHO Creating database tables...

:: Use Node.js script to create tables instead of PostgreSQL command-line tools
npx tsx create-tables.js

ECHO.
ECHO Database setup complete! You can now run the application with:
ECHO run-postgres.bat
ECHO.
ECHO Press any key to exit.
pause