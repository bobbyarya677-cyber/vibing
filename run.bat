@echo off
title VibeShift AI
echo ========================================================
echo   Launching VibeShift AI (Vibeathon 2026 Edition)
echo ========================================================
cd /d "%~dp0"
start http://127.0.0.1:5000
python app.py
pause
