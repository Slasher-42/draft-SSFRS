@echo off
echo Installing dependencies...
Scripts\pip install -r requirements.txt

echo.
echo Starting SSFRS AI Engine Service on port 8083...
Scripts\uvicorn main:app --host 0.0.0.0 --port 8083 --reload
