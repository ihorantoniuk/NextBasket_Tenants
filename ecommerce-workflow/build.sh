#!/bin/bash
# Simple build script for the application

echo "Installing dependencies..."
npm install

echo "Running TypeScript compilation..."
npx tsc --noEmit --skipLibCheck

echo "Building the application..."
npm run build

echo "Done!"
