@echo off
title AuraMed System & GPU Status
cd /d "%~dp0\.."
.\.venv\Scripts\python.exe scripts\status_services.py
pause
