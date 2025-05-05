import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create .env file if it doesn't exist
const envFile = path.join(__dirname, '.env');
const envExampleFile = path.join(__dirname, '.env.example');

if (!fs.existsSync(envFile) && fs.existsSync(envExampleFile)) {
  console.log('Creating .env file from .env.example');
  fs.copyFileSync(envExampleFile, envFile);
}

// Function to check command line availability
function isCommandAvailable(command) {
  try {
    const childProcess = await import('child_process');
    const { execSync } = childProcess;
    execSync(`${command} --version`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Main check function
async function checkEnvironment() {
  console.log('Checking local environment...');
  
  try {
    // Check Node.js version
    const nodeVersion = process.version;
    console.log(`Node.js version: ${nodeVersion}`);
    
    // Check npm version
    const npmAvailable = await isCommandAvailable('npm');
    if (npmAvailable) {
      console.log('npm is available');
    } else {
      console.error('WARNING: npm is not available or not in PATH');
    }
    
    // Check PostgreSQL
    const pgAvailable = await isCommandAvailable('psql');
    if (pgAvailable) {
      console.log('PostgreSQL client is available');
    } else {
      console.log('NOTE: PostgreSQL client not found. You\'ll need a PostgreSQL server for this app.');
    }
    
    console.log('\nSetup complete! Follow these steps:');
    console.log('1. Update your .env file with your database credentials');
    console.log('2. Run: npm install');
    console.log('3. Run: npm run db:push');
    console.log('4. Run: npm run dev');
    console.log('\nFor more details, see LOCAL_SETUP.md');
    
  } catch (error) {
    console.error('Error checking environment:', error);
  }
}

checkEnvironment().catch(console.error);