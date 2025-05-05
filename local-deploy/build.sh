#!/bin/bash

# Run the npm build command first
npm run build

# Create build directory if it doesn't exist
mkdir -p build

# Copy all files from dist/public to build
cp -r dist/public/* build/

# Copy server file if needed
cp dist/index.js build/server.js

echo "Build files copied to the build folder successfully!"