import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fix package.json to be Windows-compatible
const packageJsonPath = path.join(__dirname, 'package.json');

if (fs.existsSync(packageJsonPath)) {
  console.log('Fixing package.json for Windows compatibility...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Fix dev script for Windows
    if (packageJson.scripts && packageJson.scripts.dev) {
      packageJson.scripts.dev = 'cross-env NODE_ENV=development tsx server/index.ts';
    }
    
    // Fix start script for Windows
    if (packageJson.scripts && packageJson.scripts.start) {
      packageJson.scripts.start = 'cross-env NODE_ENV=production node dist/index.js';
    }
    
    // Add a windows-dev script
    if (packageJson.scripts) {
      packageJson.scripts['windows-dev'] = 'set NODE_ENV=development&& tsx server/index.ts';
      packageJson.scripts['windows-start'] = 'set NODE_ENV=production&& node dist/index.js';
    }
    
    // Create a new package.json.windows file
    const outputPath = path.join(__dirname, 'package.json.windows');
    fs.writeFileSync(outputPath, JSON.stringify(packageJson, null, 2), 'utf8');
    
    console.log(`Windows-compatible package.json has been created at ${outputPath}`);
    console.log('To use it, rename it to package.json after downloading the project');
    console.log('You\'ll also need to install cross-env: npm install --save-dev cross-env');
    
  } catch (error) {
    console.error('Error fixing package.json:', error);
  }
} else {
  console.error('package.json not found');
}