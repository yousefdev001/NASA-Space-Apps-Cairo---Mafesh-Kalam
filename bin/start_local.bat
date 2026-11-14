@echo off
title AuraMed AI Server (Local Only)
cd /d "%~dp0\.."
echo ======================================================================
echo    Starting AuraMed AI Services (Local Only - Port 8000/8001/8002)...
echo ======================================================================
.\.venv\Scripts\python.exe scripts\start_all_services.py
pause
