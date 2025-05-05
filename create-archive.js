import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// These folders and files will be included in the archive
const foldersToInclude = ['client', 'server', 'shared'];
const filesToInclude = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'tailwind.config.ts',
  'postcss.config.js',
  'vite.config.ts',
  'drizzle.config.ts',
  '.env.example',
  'LOCAL_SETUP.md',
  'build.sh',
  'fix-windows.js',
  'prepare-local.js'
];

// Function to create directory if it doesn't exist
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Function to copy a file
function copyFile(source, destination) {
  ensureDirectoryExists(path.dirname(destination));
  fs.copyFileSync(source, destination);
}

// Function to copy a directory recursively
function copyDirectory(source, destination) {
  // Create destination directory if it doesn't exist
  ensureDirectoryExists(destination);

  // Read the source directory
  const entries = fs.readdirSync(source, { withFileTypes: true });

  // Process each entry
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    // Skip node_modules and .git directories
    if (entry.name === 'node_modules' || entry.name === '.git') {
      continue;
    }

    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      copyDirectory(sourcePath, destinationPath);
    } else {
      // Copy files
      copyFile(sourcePath, destinationPath);
    }
  }
}

// Main function to create the archive
async function createArchive() {
  console.log('Creating project archive for local deployment...');
  
  try {
    // Create a temporary directory for the archive
    const archiveDir = path.join(__dirname, 'local-deploy');
    ensureDirectoryExists(archiveDir);
    
    // Copy specified folders
    for (const folder of foldersToInclude) {
      const source = path.join(__dirname, folder);
      const destination = path.join(archiveDir, folder);
      
      if (fs.existsSync(source)) {
        console.log(`Copying folder: ${folder}`);
        copyDirectory(source, destination);
      } else {
        console.warn(`Warning: Folder not found: ${folder}`);
      }
    }
    
    // Copy specified files
    for (const file of filesToInclude) {
      const source = path.join(__dirname, file);
      const destination = path.join(archiveDir, file);
      
      if (fs.existsSync(source)) {
        console.log(`Copying file: ${file}`);
        copyFile(source, destination);
      } else {
        console.warn(`Warning: File not found: ${file}`);
      }
    }
    
    console.log('\nArchive created successfully in the local-deploy folder!');
    console.log('Download this folder to run the application locally');
    console.log('Follow the instructions in LOCAL_SETUP.md to get started');
    
  } catch (error) {
    console.error('Error creating archive:', error);
  }
}

createArchive().catch(console.error);