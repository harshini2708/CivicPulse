@echo off
set "PATH=%~dp0nodejs;%PATH%"
cd /d "%~dp0civicpulse_frontend"
call npm.cmd %*
