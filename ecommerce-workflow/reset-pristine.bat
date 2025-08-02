@echo off
echo ========================================
echo RESETTING DATABASE TO PRISTINE STATE
echo ========================================

echo Running pristine database reset...
npx ts-node src/scripts/reset-pristine-database.ts

echo.
echo ========================================
echo Database reset complete!
echo ========================================
echo.
echo Your database now contains:
echo - 10 carefully curated products
echo - Perfect for AI upsell testing
echo - iPhone + accessories ecosystem
echo - MacBook + accessories ecosystem
echo - AirPods + accessories ecosystem
echo.
echo Refresh your browser to see the new products!
echo ========================================
pause
