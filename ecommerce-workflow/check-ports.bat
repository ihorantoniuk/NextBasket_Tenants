@echo off
echo === Port Status Checker ===
echo.

echo Checking common ports used by the application:
echo.

echo Port 3000 (Main API):
netstat -ano | findstr ":3000" && (
    echo   ❌ Port 3000 is OCCUPIED
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
        echo   Process ID: %%a
        tasklist /FI "PID eq %%a" /FO TABLE | findstr /V "="
    )
) || echo   ✅ Port 3000 is FREE

echo.
echo Port 11434 (Ollama):
netstat -ano | findstr ":11434" && (
    echo   ❌ Port 11434 is OCCUPIED
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":11434"') do (
        echo   Process ID: %%a
        tasklist /FI "PID eq %%a" /FO TABLE | findstr /V "="
    )
) || echo   ✅ Port 11434 is FREE

echo.
echo Port 5000 (Alternative):
netstat -ano | findstr ":5000" && (
    echo   ❌ Port 5000 is OCCUPIED
) || echo   ✅ Port 5000 is FREE

echo.
echo Port 8080 (Alternative):
netstat -ano | findstr ":8080" && (
    echo   ❌ Port 8080 is OCCUPIED
) || echo   ✅ Port 8080 is FREE

echo.
echo === Port Check Complete ===
pause
