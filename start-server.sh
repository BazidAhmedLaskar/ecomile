#!/bin/bash

# Build the TypeScript application
echo "Building TypeScript application..."
npx tsc

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo "Build successful! Starting server..."
    # Start the compiled server
    node dist/server/index.js
else
    echo "Build failed! Starting fallback JavaScript server..."
    # Fallback to the working JavaScript server
    node server.js
fi