@echo off
cd /d "%~dp0"
py launcher.py
if errorlevel 1 python launcher.py
pause
