@echo off
set "PATH=%~dp0nodejs;%PATH%"
cd /d "%~dp0server"
call npm.cmd %*
