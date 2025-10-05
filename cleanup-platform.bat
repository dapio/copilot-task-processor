@echo off
title ThinkCode AI Platform - System Cleanup
color 0D

echo ================================================================================
echo                    🧹 THINKCODE AI PLATFORM - SYSTEM CLEANUP 🧹
echo ================================================================================
echo.

echo 🎯 Czyszczenie plików tymczasowych, cache i artefaktów build...
echo    Zostanie zwolnione miejsce na dysku i zoptymalizowana wydajność
echo.

REM Run the TypeScript cleanup system
call npx tsx scripts/cleanup-system.ts

echo.
echo ================================================================================
echo                        ✅ CLEANUP COMPLETED SUCCESSFULLY!
echo ================================================================================
echo.
echo 🎯 System został wyczyszczony i zoptymalizowany.
echo    Wszystkie niepotrzebne pliki tymczasowe zostały usunięte.
echo    Miejsce na dysku zostało zwolnione.
echo.
pause