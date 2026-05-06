@echo off
chcp 65001 >nul
echo.
echo  ========================================
echo   Excel Dashboard - DataPulse
echo  ========================================
echo.

cd /d "%~dp0"

echo  [1/2] 패키지 설치 중...
call npm install
if errorlevel 1 (
    echo  [오류] npm install 실패. Node.js가 설치되어 있는지 확인하세요.
    pause
    exit /b 1
)

echo.
echo  [2/2] 개발 서버 시작 중...
echo.
echo  브라우저에서 http://localhost:5173 으로 접속하세요.
echo  종료하려면 Ctrl+C 를 누르세요.
echo.

call npm run dev
pause
