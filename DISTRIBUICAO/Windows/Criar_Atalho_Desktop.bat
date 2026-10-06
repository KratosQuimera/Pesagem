@echo off
chcp 65001 >nul
title CRIAR ATALHO NA ÁREA DE TRABALHO - HAOC
echo ==============================================================================
echo       CRIANDO ATALHO NA ÁREA DE TRABALHO PARA PESAGEM DE RESÍDUOS HAOC
echo ==============================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws = New-Object -ComObject WScript.Shell;" ^
  "$desktop = [Environment]::GetFolderPath('Desktop');" ^
  "$sc = $ws.CreateShortcut("$desktop\Pesagem de Residuos HAOC.lnk");" ^
  "$targetBat = Join-Path (Get-Location) 'Iniciar_Pesagem_HAOC.bat';" ^
  "$sc.TargetPath = $targetBat;" ^
  "$sc.WorkingDirectory = (Get-Location).Path;" ^
  "$sc.Description = 'Sistema de Pesagem de Residuos - Hospital Alemao Oswaldo Cruz';" ^
  "$sc.Save();"

echo [SUCESSO] Atalho 'Pesagem de Resíduos HAOC' criado na sua Área de Trabalho!
echo.
pause
exit /b 0
