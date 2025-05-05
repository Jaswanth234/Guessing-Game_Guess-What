# Quiz Master Application

A real-time interactive quiz platform that enables hosts to create and conduct quizzes while participants join and compete in real-time.

## Features

- **Real-time Quiz Hosting**: Create and host live quiz sessions
- **Interactive Participation**: Join quizzes via QR codes or quiz links
- **Multiple Question Types**: Support for single choice, multiple choice, and dropdown questions
- **Live Leaderboard**: Real-time scoring and rankings
- **Result Analytics**: View detailed quiz performance metrics
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Local Development

To set up this project locally, please follow the instructions in [LOCAL_SETUP.md](LOCAL_SETUP.md).

For Windows users, additional configuration may be required. See the Windows-specific instructions in the setup guide.

## Technology Stack

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time Communication**: WebSockets
- **Build Tools**: Vite, esbuild

## Running Locally

1. Set up your environment variables in a `.env` file
2. Install dependencies with `npm install`
3. Initialize the database with `npm run db:push`
4. Start the development server with `npm run dev`

## Building for Production

Build the application with:

```bash
npm run build
```

Or use the build script to create a build folder at the root:

```bash
./build.sh
```