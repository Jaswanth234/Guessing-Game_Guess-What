# Local Setup Guide for Quiz Application

This guide will help you set up and run the Quiz Application on your local machine.

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- PostgreSQL database (local or remote)

## Setup Steps

### 1. Clone or Download the Project

Download this project to your local machine.

### 2. Install Dependencies

Open a terminal/command prompt in the project directory and run:

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/quiz_app
# Or use the separate connection params:
# PGUSER=your_username
# PGPASSWORD=your_password
# PGDATABASE=quiz_app
# PGHOST=localhost
# PGPORT=5432

# Session Configuration
SESSION_SECRET=your_secure_session_secret

# Server Configuration (Optional)
PORT=5000
HOST=0.0.0.0
NODE_ENV=development
```

Replace the database connection details with your own PostgreSQL credentials.

### 4. Set Up the Database

Create a PostgreSQL database and run:

```bash
npm run db:push
```

This will create the necessary tables in your database.

### 5. Start the Development Server

```bash
npm run dev
```

The application should now be running at [http://localhost:5000](http://localhost:5000)

## Building for Production

To build the application for production:

```bash
npm run build
```

This will create a `dist` directory with the compiled files.

To copy the files to a `build` directory at the root level:

```bash
# On Unix/Linux/macOS
./build.sh

# On Windows using PowerShell
# mkdir -Force build
# Copy-Item -Recurse dist/public/* build/
# Copy-Item dist/index.js build/server.js
```

## Starting in Production Mode

To start the server in production mode:

```bash
npm run start
```

Or directly with node:

```bash
NODE_ENV=production node dist/index.js
```

## Troubleshooting

1. **Database Connection Issues**:
   - Ensure PostgreSQL is running
   - Verify your database credentials
   - Check that the database exists

2. **Port Already in Use**:
   - Change the PORT value in your .env file
   - Or kill the process using the port (e.g., `npx kill-port 5000`)

3. **Node.js Version Mismatch**:
   - Use a compatible Node.js version (v16+)
   - Consider using nvm to manage Node.js versions