# 🛑 Service Management Guide

## Quick Stop Commands

### Windows (PowerShell/CMD)
```bash
# Run the automated script
.\stop-all-services.bat

# Or manually:
# Stop Node.js processes
taskkill /F /IM node.exe /T

# Stop Ollama processes  
taskkill /F /IM ollama.exe /T

# Stop Docker containers
docker-compose down

# Kill specific port users
netstat -ano | findstr ":3000"  # Find PID
taskkill /F /PID <PID_NUMBER>   # Kill process
```

### Check Port Status
```bash
# Check if ports are free
.\check-ports.bat

# Or manually check specific ports
netstat -ano | findstr ":3000"   # API port
netstat -ano | findstr ":11434"  # Ollama port
```

## Creating New Similar Application

### Option 1: Copy Current Project
```bash
# Navigate to parent directory
cd c:\Users\Dina\source\repos\Next_Busket

# Copy entire project
xcopy ecommerce-workflow ecommerce-workflow-v2 /E /I

# Enter new project
cd ecommerce-workflow-v2
```

### Option 2: Use Different Ports
Update `.env` file in new project:
```env
PORT=5000              # Instead of 3000
OLLAMA_BASE_URL=http://localhost:11435  # Instead of 11434
DATABASE_PATH=./database-v2.sqlite      # Different DB file
```

### Option 3: Docker with Different Ports
Update `docker-compose.yml`:
```yaml
services:
  api:
    ports:
      - "5000:3000"    # External:Internal
  ollama:
    ports:
      - "11435:11434"  # External:Internal
```

## Port Recommendations for Multiple Apps

| App Version | API Port | Ollama Port | Database |
|-------------|----------|-------------|----------|
| Original    | 3000     | 11434       | database.sqlite |
| Version 2   | 5000     | 11435       | database-v2.sqlite |
| Version 3   | 8000     | 11436       | database-v3.sqlite |

## Troubleshooting

### If Ports Won't Free Up
```bash
# Nuclear option - restart network stack
netsh winsock reset
netsh int ip reset
# Restart computer
```

### Docker Issues
```bash
# Stop all Docker containers
docker stop $(docker ps -q)

# Remove all containers
docker rm $(docker ps -aq)

# Restart Docker Desktop
```

### Process Still Running
```bash
# Find process using port
netstat -ano | findstr ":3000"

# Kill by PID (replace XXXX with actual PID)
taskkill /F /PID XXXX
```

## Quick Start New Instance

1. **Stop everything**: `.\stop-all-services.bat`
2. **Check ports**: `.\check-ports.bat`
3. **Copy project**: Copy folder or change ports
4. **Start new instance**: `npm run dev` or `docker-compose up`

All ports should now be free for your new application! 🎯
