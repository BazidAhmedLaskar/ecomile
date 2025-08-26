#!/bin/bash

# EcoMiles Deployment Script
# This script builds and starts the EcoMiles application for deployment

echo "🚀 Starting EcoMiles deployment..."

# Step 1: Build the TypeScript application
echo "📦 Building TypeScript application..."
npx tsc

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Step 2: Start the server
    echo "🌱 Starting EcoMiles server..."
    exec node dist/server/index.js
else
    echo "❌ TypeScript build failed! Using fallback JavaScript server..."
    exec node server.js
fi