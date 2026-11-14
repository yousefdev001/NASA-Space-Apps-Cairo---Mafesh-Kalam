@echo off
title AuraMed AI Server (Direct Connection for Flutter)
cd /d "%~dp0\.."
echo ======================================================================
echo    Starting AuraMed AI Services (Direct Connection - Port 8000)...
echo ======================================================================
.\.venv\Scripts\python.exe scripts\start_all_services.py
pause
