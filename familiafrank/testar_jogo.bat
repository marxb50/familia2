@echo off
cd /d "%~dp0"
echo Franklandia disponivel em http://localhost:8090/
python -m http.server 8090
