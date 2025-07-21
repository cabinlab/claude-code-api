#!/bin/bash

echo "=== Debugging Docker Build Issue ==="
echo

echo "1. Local src/services directory:"
ls -la src/services/
echo

echo "2. Building Docker image..."
docker build -t claude-code-api-debug . 2>&1 | tail -20
echo

echo "3. Starting debug container..."
docker run -d --name debug-container claude-code-api-debug sleep 3600
echo

echo "4. Checking src/services in container:"
docker exec debug-container ls -la /app/src/services/
echo

echo "5. Cleaning up..."
docker stop debug-container > /dev/null 2>&1
docker rm debug-container > /dev/null 2>&1
echo "Done!"