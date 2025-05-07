@echo off
ECHO Starting Quiz application with Windows-specific settings...
ECHO.

SET HOST=localhost
SET PORT=3000
SET NODE_ENV=development
SET NODE_OPTIONS=--dns-result-order=ipv4first

REM Set this to your PostgreSQL connection string  
SET DATABASE_URL=postgresql://postgres:postgres@localhost:5433/quiz-game

REM This can be anything for development
SET SESSION_SECRET=dev_session_secret

ECHO Using port 3000 instead of 5000
ECHO.
ECHO Starting server...
npx cross-env NODE_ENV=development tsx server/index.ts
ECHO.
ECHO Server stopped. Press any key to exit.
pause