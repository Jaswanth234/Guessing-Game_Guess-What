# Windows Local Setup Guide

This document provides instructions for setting up and running the Quiz application on Windows environments, which requires a slightly different configuration than macOS/Linux.

## Prerequisites

1. Node.js v16+ and npm
2. PostgreSQL installed locally or a remote PostgreSQL instance
3. Basic understanding of command line operations

## Setup Steps

### 1. Install Required Packages

```bash
npm install cross-env pg dotenv better-sqlite3
```

### 2. Create a .env File

Create a `.env` file in the project root with the following content:

```
HOST=localhost
PORT=5000
DATABASE_URL=postgresql://postgres:YourPassword@localhost:5432/quiz-game
SESSION_SECRET=some_random_string
```

Replace `YourPassword` with your actual PostgreSQL password.

### 3. Create a Windows-Specific Entry Point

Create a file named `start-windows.js` in the project root:

```javascript
// start-windows.js
require('dotenv').config();
const { spawn } = require('child_process');
const { platform } = require('os');

// Verify we're on Windows
if (platform() !== 'win32') {
  console.warn('This script is intended for Windows environments');
}

// Set specific host for Windows
process.env.HOST = 'localhost';

// Start the application
const child = spawn('npx', ['cross-env', 'NODE_ENV=development', 'tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    HOST: 'localhost'
  }
});

child.on('error', (error) => {
  console.error('Failed to start application:', error);
});
```

### 4. Create a Batch File Launcher

Create a file named `run-windows.bat` in the project root:

```batch
@echo off
echo Starting the Quiz Application (Windows Configuration)...
node start-windows.js
pause
```

### 5. Launch the Application

Double-click `run-windows.bat` or run it from the command line.

## Troubleshooting

### Socket Binding Issues

If you get an error like `listen ENOTSUP: operation not supported on socket ::1:5000`, it means Windows is having trouble binding to IPv6. Our `start-windows.js` script should fix this by using 'localhost' instead.

### Database Connection Issues

1. **Verify PostgreSQL is running:** Make sure your PostgreSQL service is running.
2. **Check credentials:** Ensure the username and password in your .env file are correct.
3. **Create the database:** Make sure you've created a database named 'quiz-game'.

### Module Not Found Errors

If you encounter module not found errors, try:

```bash
npm install
```

to ensure all dependencies are installed.

## Alternative SQLite Setup

If you prefer to use SQLite instead of PostgreSQL for local development, update your `.env` file:

```
DATABASE_URL=sqlite:./local.db
```

And install the SQLite driver:

```bash
npm install better-sqlite3
```

You'll also need to modify the database setup code, but that requires more complex changes to the application.