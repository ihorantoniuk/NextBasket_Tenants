#!/bin/sh

echo "Starting AI-Powered E-commerce API..."

# Check if compiled dist folder exists
if [ -d "dist" ] && [ -f "dist/server.js" ]; then
    echo "Found compiled code, starting production build..."
    node dist/server.js
else
    echo "Compiled code not found, installing ts-node and starting with source..."
    # Install ts-node if not available
    npm install ts-node
    # Start with source files
    npx ts-node src/server.ts
fi
