import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create build directory if it doesn't exist
const buildDir = path.join(__dirname, 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Function to copy directory recursively
function copyDirectory(source, destination) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  // Get all files/folders in the source directory
  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      copyDirectory(sourcePath, destinationPath);
    } else {
      // Copy files
      fs.copyFileSync(sourcePath, destinationPath);
    }
  }
}

// Copy from dist/public to build folder
const publicDir = path.join(__dirname, 'dist', 'public');
copyDirectory(publicDir, buildDir);

// Copy server files if needed
const serverFile = path.join(__dirname, 'dist', 'index.js');
if (fs.existsSync(serverFile)) {
  fs.copyFileSync(serverFile, path.join(buildDir, 'server.js'));
}

console.log('Build files copied to the build folder successfully!');