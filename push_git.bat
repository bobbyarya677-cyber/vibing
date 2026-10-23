@echo off
title Push to GitHub - VibeShift AI
echo ========================================================
echo   Pushing VibeShift AI to GitHub
echo   Target: https://github.com/bobbyarya677-cyber/vibethon.git
echo ========================================================
cd /d "%~dp0"

git init
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/bobbyarya677-cyber/vibethon.git
git add .
git commit -m "feat: complete VibeShift AI project for Vibeathon 2026"
git push -u origin main

pause
