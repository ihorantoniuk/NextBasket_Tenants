@echo off
echo Stopping Docker services...
docker-compose down
echo.
echo Starting Docker services...
docker-compose up -d
echo.
echo Services restarted. Check the logs with: docker-compose logs -f
