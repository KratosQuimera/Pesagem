@echo off
title PESAGEM DE RESIDUOS HAOC - Hospital Alemao Oswaldo Cruz
echo ========================================================
echo   PESAGEM DE RESIDUOS HAOC - MODO PORTATIL
echo   Hospital Alemao Oswaldo Cruz
echo ========================================================
echo Iniciando aplicativo em modo terminal independente...

REM Localiza o Microsoft Edge ou Google Chrome para executar como App PWA
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
    start "" %BROWSER% --app=http://localhost:3000 --window-size=1280,800
)
exit
