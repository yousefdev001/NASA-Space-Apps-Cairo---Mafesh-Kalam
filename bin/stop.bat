@echo off
title AuraMed - Stop All Services & Free GPU
cd /d "%~dp0\.."
echo ======================================================================
echo    Stopping AuraMed Services, Cloudflare Tunnel & Freeing GPU...
echo ======================================================================
.\.venv\Scripts\python.exe scripts\stop_all_services.py
pause
