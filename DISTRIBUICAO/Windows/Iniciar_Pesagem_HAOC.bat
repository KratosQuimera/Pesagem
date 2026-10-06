@echo off
chcp 65001 >nul
title PESAGEM DE RESÍDUOS HAOC - Hospital Alemão Oswaldo Cruz
echo ==============================================================================
echo   PESAGEM DE RESÍDUOS HAOC - HOSPITAL ALEMÃO OSWALDO CRUZ
echo ==============================================================================
echo.
echo Iniciando aplicativo em janela independente (Modo App)...

set BROWSER=""
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    set BROWSER="%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    set BROWSER="%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
) else if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set BROWSER="%ProgramFiles%\Google\Chrome\Application\chrome.exe"
) else if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    set BROWSER="%LocalAppData%\Google\Chrome\Application\chrome.exe"
)

if %BROWSER%=="" (
    start http://localhost:3000
) else (
    start "" %BROWSER% --app=http://localhost:3000 --window-size=1280,820
)
exit
