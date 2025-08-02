@echo off
echo ========================================
echo FORCING DOCKER CONTAINER RESTART
echo ========================================

echo Step 1: Stopping all containers...
docker-compose down --remove-orphans

echo Step 2: Removing containers and images...
docker-compose rm -f
docker system prune -f

echo Step 3: Rebuilding and starting services...
docker-compose up --build -d

echo Step 4: Checking container status...
docker-compose ps

echo ========================================
echo Restart complete! 
echo Check the application at http://localhost:3000
echo ========================================
pause
