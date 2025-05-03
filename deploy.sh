#!/bin/bash
# Deployment script for the Quiz Application

# Exit on error
set -e

echo "Starting deployment process..."

# Step 1: Build the application
echo "Building application..."
npm run build

# Step 2: Check build status
if [ $? -ne 0 ]; then
  echo "Build failed. Exiting."
  exit 1
fi
echo "Build completed successfully."

# Step 3: Create production directory structure
echo "Creating production directory structure..."
mkdir -p dist/logs

# Step 4: Copy necessary files
echo "Copying configuration files..."
cp .env.production dist/.env
cp package.json dist/
cp deploy.sh dist/

# Step 5: Compress the distribution
echo "Creating deployment archive..."
tar -czvf quiz-app-deploy.tar.gz dist/

echo "Deployment preparation complete."
echo "Archive created: quiz-app-deploy.tar.gz"
echo ""
echo "Next steps for AWS deployment:"
echo "1. Upload quiz-app-deploy.tar.gz to your EC2 instance"
echo "2. Extract the archive on the server"
echo "3. Install dependencies: npm install --production"
echo "4. Start the application: npm start"
echo ""
echo "For detailed AWS deployment steps, refer to the deployment guide."