@echo off
title AuraMed Ground Station - Houston Flight Surgeon Dashboard
echo =====================================================================
echo    AuraMed - Ground Station Mission Control Telemetry Gateway
echo    NASA STD-3001 Compliant Flight Surgeon Dashboard & Rescue AI
echo =====================================================================
echo.
echo Starting FastAPI & WebSocket Server on http://localhost:8000 ...
python server.py
pause
