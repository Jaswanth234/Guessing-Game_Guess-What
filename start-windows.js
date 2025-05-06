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

// Override the socket binding to ensure it works on Windows
process.env.NODE_OPTIONS = '--dns-result-order=ipv4first';

console.log('Starting application with Windows-specific configuration');
console.log('Host:', process.env.HOST);
console.log('Database URL:', process.env.DATABASE_URL ? 'Set (hidden for security)' : 'Not set');

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