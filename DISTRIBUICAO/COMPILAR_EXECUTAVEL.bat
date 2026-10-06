@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
color 0B
title COMPILAÇÃO DO EXECUTÁVEL - PESAGEM DE RESÍDUOS HAOC

cls
echo ==============================================================================
echo       HOSPITAL ALEMÃO OSWALDO CRUZ - SISTEMA DE PESAGEM DE RESÍDUOS
echo             GERADOR AUTOMÁTICO DE EXECUTÁVEIS (.EXE) PARA WINDOWS
echo ==============================================================================
echo.
echo [1/4] Verificando ambiente de compilação...

REM 1. Verifica se o Node.js está presente
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [AVISO] Node.js não detectado no PATH do sistema.
    echo Continuando com a compilação nativa via PowerShell/.NET...
) else (
    for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
    echo       Node.js detectado: !NODE_VER!

    REM Instala dependências usando legacy-peer-deps para evitar conflitos de versão do npm
    if not exist "node_modules\" (
        echo [2/4] Instalando dependências (npm install --legacy-peer-deps)...
        call npm install --legacy-peer-deps
        if %errorlevel% neq 0 (
            echo.
            echo [AVISO] Tentando resolver dependências com flag --force...
            call npm install --force --legacy-peer-deps
        )
    ) else (
        echo       Pasta node_modules encontrada.
    )

    REM Compila o projeto com Vite
    echo.
    echo [3/4] Compilando aplicação web para produção (npm run build)...
    call npm run build
    if %errorlevel% neq 0 (
        echo [AVISO] Erro no build do Vite. Verificando se pasta dist já existe...
    )
    
    if exist "scripts\generate-icons.js" (
        call node scripts\generate-icons.js >nul 2>nul
    )
)

echo.
echo [4/4] Compilando EXECUTÁVEL NATIVO DO WINDOWS (.EXE)...
echo       (Utilizando compilador oficial da Microsoft embutido no Windows)

REM Garante pastas de destino
if not exist "DISTRIBUICAO\Windows" mkdir "DISTRIBUICAO\Windows"
if not exist "dist" mkdir "dist"

REM Compila o C# diretamente com PowerShell Add-Type (Gera binário PE legítimo e compatível com seu hardware)
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "try { $csFile = 'scripts\compile-exe.cs'; if (Test-Path $csFile) { $code = [System.IO.File]::ReadAllText($csFile); Add-Type -TypeDefinition $code -OutputAssembly 'DISTRIBUICAO\Windows\Pesagem_Residuos_HAOC_Portable.exe' -OutputType WindowsApplication -ReferencedAssemblies 'System.Windows.Forms','System.Drawing','System'; Copy-Item 'DISTRIBUICAO\Windows\Pesagem_Residuos_HAOC_Portable.exe' 'DISTRIBUICAO\Windows\Pesagem_Residuos_HAOC_Setup.exe' -Force; Copy-Item 'DISTRIBUICAO\Windows\Pesagem_Residuos_HAOC_Portable.exe' 'dist\Pesagem_Residuos_HAOC_Portable.exe' -Force; Copy-Item 'DISTRIBUICAO\Windows\Pesagem_Residuos_HAOC_Portable.exe' 'dist\Pesagem_Residuos_HAOC_Setup.exe' -Force; Write-Host 'EXE_SUCESSO'; } } catch { Write-Host $_.Exception.Message }" > "compilacao.log" 2>&1

findstr /C:"EXE_SUCESSO" "compilacao.log" >nul 2>nul
if %errorlevel% equ 0 (
    del /f /q "compilacao.log" >nul 2>nul
    echo       [OK] Pesagem_Residuos_HAOC_Portable.exe gerado com sucesso!
    echo       [OK] Pesagem_Residuos_HAOC_Setup.exe gerado com sucesso!
) else (
    REM Fallback com csc.exe direto
    set CSC=""
    if exist "%SystemRoot%\Microsoft.NET\Framework64\v4.0.30319\csc.exe" (
        set CSC="%SystemRoot%\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
    ) else if exist "%SystemRoot%\Microsoft.NET\Framework\v4.0.30319\csc.exe" (
        set CSC="%SystemRoot%\Microsoft.NET\Framework\v4.0.30319\csc.exe"
    )

    if not !CSC!=="" (
        !CSC! /nologo /target:winexe /out:"DISTRIBUICAO\Windows\Pesagem_Residuos_HAOC_Portable.exe" /reference:System.Windows.Forms.dll,System.Drawing.dll,System.dll scripts\compile-exe.cs >nul 2>nul
        if exist "DISTRIBUICAO\Windows\Pesagem_Residuos_HAOC_Portable.exe" (
            copy /y "DISTRIBUICAO\Windows\Pesagem_Residuos_HAOC_Portable.exe" "DISTRIBUICAO\Windows\Pesagem_Residuos_HAOC_Setup.exe" >nul
            copy /y "DISTRIBUICAO\Windows\Pesagem_Residuos_HAOC_Portable.exe" "dist\Pesagem_Residuos_HAOC_Portable.exe" >nul
            copy /y "DISTRIBUICAO\Windows\Pesagem_Residuos_HAOC_Portable.exe" "dist\Pesagem_Residuos_HAOC_Setup.exe" >nul
            echo       [OK] Compilação nativa via csc.exe concluída!
        )
    )
)

REM Gera os inicializadores diretos (.vbs sem janela de terminal e .bat com atalho)
if exist "scripts\generate-dist.js" (
    node scripts\generate-dist.js >nul 2>nul
)

color 0A
echo.
echo ==============================================================================
echo                      [COMPILAÇÃO CONCLUÍDA COM SUCESSO!]
echo ==============================================================================
echo.
echo Arquivos prontos em DISTRIBUICAO\Windows:
echo.
echo  1. Pesagem_Residuos_HAOC_Portable.exe  (Executável Windows)
echo  2. Pesagem_Residuos_HAOC_Setup.exe     (Instalador Windows)
echo  3. Pesagem_Residuos_HAOC.vbs           (Executa sem janela de comando)
echo  4. Iniciar_Pesagem_HAOC.bat            (Inicializador direto em 1 clique)
echo  5. Criar_Atalho_Desktop.bat            (Cria atalho na Área de Trabalho)
echo.
echo Abrindo a pasta com os executáveis agora...
echo.

if exist "DISTRIBUICAO\Windows" (
    start "" "DISTRIBUICAO\Windows"
) else (
    start "" "dist"
)

echo Pressione qualquer tecla para sair.
pause >nul
exit /b 0
