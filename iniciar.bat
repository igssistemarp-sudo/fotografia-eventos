@echo off
title IGS FotoPro - Studio Manager
cd /d "%~dp0"

cls
echo ============================================
echo   IGS FotoPro - Studio Manager
echo   Sistema desenvolvido por IGS AUTOMACAO COMERCIAL
echo ============================================
echo.
echo   Instalando dependencias...
call npm install >nul 2>&1

echo   Iniciando servidores...
echo.
start "IGS API" cmd /c "npx tsx server/index.ts"
timeout /t 4 /nobreak >nul
start "IGS Frontend" cmd /c "npx vite --host"

echo.
echo   Frontend: http://localhost:5173
echo   API:      http://localhost:3333
echo   Login:    admin / 123
echo.
echo   Feche as janelas abertas para parar os servidores.
echo.
pause
