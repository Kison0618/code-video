@echo off
cd /d "%~dp0"
echo Open http://127.0.0.1:5191/
python -m http.server 5191 --bind 127.0.0.1
pause
