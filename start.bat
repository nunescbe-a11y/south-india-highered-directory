@echo off
title South India HigherEd Directory & AI Sales Agent Studio
cd /d "%~dp0"
echo ====================================================================
echo Starting South India HigherEd Directory & AI Sales Agent Studio...
echo Opening: http://localhost:3005
echo ====================================================================
start "" "http://localhost:3005"
node server.js
pause
