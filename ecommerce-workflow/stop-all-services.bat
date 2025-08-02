@echo off
echo === Stopping All E-commerce Services ===

echo.
echo 1. Checking for Node.js processes...
tasklist /FI "IMAGENAME eq node.exe" /FO TABLE
if not errorlevel 1 (
    echo Killing Node.js processes...
    taskkill /F /IM node.exe /T 2>nul
    if not errorlevel 1 echo Node.js processes stopped.
)

echo.
echo 2. Checking for Ollama processes...
tasklist /FI "IMAGENAME eq ollama.exe" /FO TABLE
if not errorlevel 1 (
    echo Killing Ollama processes...
    taskkill /F /IM ollama.exe /T 2>nul
    if not errorlevel 1 echo Ollama processes stopped.
)

echo.
echo 3. Checking processes using port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
    echo Killing process ID %%a on port 3000...
    taskkill /F /PID %%a 2>nul
)

echo.
echo 4. Checking processes using port 11434 (Ollama)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":11434"') do (
    echo Killing process ID %%a on port 11434...
    taskkill /F /PID %%a 2>nul
)

echo.
echo 5. Stopping Docker containers (if Docker is running)...
docker-compose down 2>nul
if not errorlevel 1 echo Docker containers stopped.

echo.
echo 6. Checking if ports are now free...
echo Checking port 3000:
netstat -ano | findstr ":3000" && echo Port 3000 is still in use || echo Port 3000 is FREE
echo Checking port 11434:
netstat -ano | findstr ":11434" && echo Port 11434 is still in use || echo Port 11434 is FREE

echo.
echo === All services stopped! Ports should be free now ===
pause
