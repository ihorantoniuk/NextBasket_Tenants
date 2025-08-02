@echo off
echo === Docker Rebuild and Launch Monitor ===
echo.

echo 1. Container Status:
docker-compose ps
echo.

echo 2. Ollama Model Download Progress:
echo Checking if Mistral model is available...
docker-compose exec -T ollama ollama list 2>nul
if errorlevel 1 (
    echo Mistral model not yet available - still downloading...
) else (
    echo Mistral model is ready!
)
echo.

echo 3. API Health Check:
echo Checking API service...
curl -f http://localhost:3000/health 2>nul
if errorlevel 1 (
    echo API not yet responding
) else (
    echo API is healthy!
)
echo.

echo 4. AI Health Check:
echo Checking AI service...
curl -f http://localhost:3000/api/ai/health 2>nul
if errorlevel 1 (
    echo AI service not yet ready
) else (
    echo AI service is ready!
)
echo.

echo 5. Recent Logs:
echo Last 10 lines from each service:
echo.
echo === API Logs ===
docker-compose logs --tail=10 ecommerce-api
echo.
echo === Ollama Logs ===
docker-compose logs --tail=10 ollama
echo.

echo === Rebuild Status Complete ===
echo.
echo Access your application at:
echo - Web Interface: http://localhost:3000
echo - API Docs: http://localhost:3000/api-docs
echo - Health Check: http://localhost:3000/health
echo.
pause
