import fs from 'fs';
import path from 'path';

// Create directories
const distDirs = [
  'dist',
  'dist/tablet',
  'dist/tablet/PWA',
  'DISTRIBUICAO',
  'DISTRIBUICAO/Windows',
  'DISTRIBUICAO/Tablet',
  'DISTRIBUICAO/Tablet/PWA',
  'DISTRIBUICAO/Documentacao',
];

distDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 1. Windows VBScript Launcher (Runs in background, no black console, borderless Edge/Chrome App Mode)
const vbsLauncher = `' =====================================================================
' PESAGEM DE RESIDUOS HAOC - LAUNCHER SILENCIOSO (SEM JANELA DE COMANDO)
' Hospital Alemao Oswaldo Cruz
' =====================================================================
Option Explicit
Dim WshShell, fso, browserPath, appUrl

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

appUrl = "http://localhost:3000"

' Localiza Microsoft Edge ou Google Chrome para rodar como Aplicativo Nativo
browserPath = ""
If fso.FileExists(WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe")) Then
    browserPath = """" & WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe") & """"
ElseIf fso.FileExists(WshShell.ExpandEnvironmentStrings("%ProgramFiles%\Microsoft\Edge\Application\msedge.exe")) Then
    browserPath = """" & WshShell.ExpandEnvironmentStrings("%ProgramFiles%\Microsoft\Edge\Application\msedge.exe") & """"
ElseIf fso.FileExists(WshShell.ExpandEnvironmentStrings("%ProgramFiles%\Google\Chrome\Application\chrome.exe")) Then
    browserPath = """" & WshShell.ExpandEnvironmentStrings("%ProgramFiles%\Google\Chrome\Application\chrome.exe") & """"
ElseIf fso.FileExists(WshShell.ExpandEnvironmentStrings("%LocalAppData%\Google\Chrome\Application\chrome.exe")) Then
    browserPath = """" & WshShell.ExpandEnvironmentStrings("%LocalAppData%\Google\Chrome\Application\chrome.exe") & """"
End If

If browserPath <> "" Then
    WshShell.Run browserPath & " --app=" & appUrl & " --window-size=1280,820", 1, False
Else
    WshShell.Run appUrl, 1, False
End If
`;
fs.writeFileSync('dist/Pesagem_Residuos_HAOC.vbs', vbsLauncher);
fs.writeFileSync('DISTRIBUICAO/Windows/Pesagem_Residuos_HAOC.vbs', vbsLauncher);

// 2. Direct 1-Click BAT Launcher
const batLauncher = `@echo off
chcp 65001 >nul
title PESAGEM DE RESÍDUOS HAOC - Hospital Alemão Oswaldo Cruz
echo ==============================================================================
echo   PESAGEM DE RESÍDUOS HAOC - HOSPITAL ALEMÃO OSWALDO CRUZ
echo ==============================================================================
echo.
echo Iniciando aplicativo em janela independente (Modo App)...

set BROWSER=""
if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (
    set BROWSER="%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe"
) else if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" (
    set BROWSER="%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe"
) else if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (
    set BROWSER="%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"
) else if exist "%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe" (
    set BROWSER="%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe"
)

if %BROWSER%=="" (
    start http://localhost:3000
) else (
    start "" %BROWSER% --app=http://localhost:3000 --window-size=1280,820
)
exit
`;
fs.writeFileSync('dist/Iniciar_Pesagem_HAOC.bat', batLauncher);
fs.writeFileSync('DISTRIBUICAO/Windows/Iniciar_Pesagem_HAOC.bat', batLauncher);

// 3. Desktop Shortcut Creator BAT
const createShortcutBat = `@echo off
chcp 65001 >nul
title CRIAR ATALHO NA ÁREA DE TRABALHO - HAOC
echo ==============================================================================
echo       CRIANDO ATALHO NA ÁREA DE TRABALHO PARA PESAGEM DE RESÍDUOS HAOC
echo ==============================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws = New-Object -ComObject WScript.Shell;" ^
  "$desktop = [Environment]::GetFolderPath('Desktop');" ^
  "$sc = $ws.CreateShortcut(\"$desktop\\Pesagem de Residuos HAOC.lnk\");" ^
  "$targetBat = Join-Path (Get-Location) 'Iniciar_Pesagem_HAOC.bat';" ^
  "$sc.TargetPath = $targetBat;" ^
  "$sc.WorkingDirectory = (Get-Location).Path;" ^
  "$sc.Description = 'Sistema de Pesagem de Residuos - Hospital Alemao Oswaldo Cruz';" ^
  "$sc.Save();"

echo [SUCESSO] Atalho 'Pesagem de Resíduos HAOC' criado na sua Área de Trabalho!
echo.
pause
exit /b 0
`;
fs.writeFileSync('dist/Criar_Atalho_Desktop.bat', createShortcutBat);
fs.writeFileSync('DISTRIBUICAO/Windows/Criar_Atalho_Desktop.bat', createShortcutBat);

// 4. Copy COMPILAR_EXECUTAVEL.bat
if (fs.existsSync('COMPILAR_EXECUTAVEL.bat')) {
  fs.copyFileSync('COMPILAR_EXECUTAVEL.bat', 'dist/COMPILAR_EXECUTAVEL.bat');
  fs.copyFileSync('COMPILAR_EXECUTAVEL.bat', 'DISTRIBUICAO/COMPILAR_EXECUTAVEL.bat');
}

// 5. Write Versao.txt
const versaoTxt = `====================================================
SISTEMA DE PESAGEM DE RESÍDUOS HAOC
HOSPITAL ALEMÃO OSWALDO CRUZ
====================================================
Versão: 1.0.0
Data de Compilação: 2026-10-02
Tecnologia: PWA + Offline IndexedDB + Standalone Desktop
Padrão Regulatório: ANVISA RDC 222/2018 | CONAMA 358/2005

Categorias Homologadas:
1. COMUM (Grupo D)
2. MIX (Recicláveis)
3. COMPOSTAGEM (Orgânico)
4. QUÍMICO (Grupo B)
5. INFECTANTE (Grupo A)
6. PERFUROCORTANTE (Grupo E)
7. CNPH - LOGÍSTICA REVERSA (Especial)
8. TAMPINHAS (Socioambiental)
9. PEÇAS ANATÔMICAS (Grupo A)
10. SUCATA ELETRÔNICA (Especial)
`;
fs.writeFileSync('DISTRIBUICAO/Versao.txt', versaoTxt);

// 6. Write README-INSTALACAO.txt
const readmeTxt = `======================================================================
GUIA DE EXECUÇÃO E INSTALAÇÃO - PESAGEM DE RESÍDUOS HAOC
Hospital Alemão Oswaldo Cruz
======================================================================

COMO EXECUTAR NO WINDOWS (3 OPÇÕES SIMPLES):

OPÇÃO 1 - Execução Imediata Silenciosa (Recomendado):
- Dê dois cliques em: Pesagem_Residuos_HAOC.vbs
- O sistema abre diretamente em janela independente do hospital,
  sem tela preta de terminal.

OPÇÃO 2 - Execução em 1 Clique (.bat):
- Dê dois cliques em: Iniciar_Pesagem_HAOC.bat

OPÇÃO 3 - Gerar os Executáveis Nativos (.EXE):
- Dê dois cliques em: COMPILAR_EXECUTAVEL.bat
- O script compila os executáveis nativos com o compilador Microsoft .NET
  da sua própria máquina, gerando Pesagem_Residuos_HAOC_Portable.exe.

CRIAR ATALHO NA ÁREA DE TRABALHO:
- Dê dois cliques em: Criar_Atalho_Desktop.bat
- Um atalho oficial será criado na sua Área de Trabalho.
`;
fs.writeFileSync('dist/README-INSTALACAO.txt', readmeTxt);
fs.writeFileSync('DISTRIBUICAO/Documentacao/README.txt', readmeTxt);

// 7. Write Guia_Instalacao_Tablet.txt
const guiaTablet = `======================================================================
GUIA DE INSTALAÇÃO EM TABLETS ANDROID E TOTENS
Hospital Alemão Oswaldo Cruz - Gestão de Resíduos
======================================================================

1. REQUISITOS DO DISPOSITIVO:
- Tablet com tela touchscreen de 8 a 12 polegadas (ou smartphone).
- Navegador Google Chrome atualizado.
- Conexão Wi-Fi apenas para o primeiro acesso (depois roda 100% offline).

2. PASSO A PASSO DA INSTALAÇÃO:
Passo 1: Conecte o tablet à rede Wi-Fi do hospital e abra o Chrome.
Passo 2: Digite o endereço URL do sistema.
Passo 3: Clique no botão azul "Instalar App" no cabeçalho ou abra o menu
         do Chrome (três pontos verticais) e toque em "Instalar aplicativo".
Passo 4: Toque em "Instalar" na janela de confirmação.
Passo 5: Retorne à tela inicial do Android e localize o ícone "HAOC Pesagem".

3. CONFIGURAÇÃO INICIAL DO TABLET:
Na primeira inicialização, preencha:
- Nome do Dispositivo: Ex. "Tablet Pesagem 01"
- Local: Ex. "Área Central de Resíduos - Subsolo"
- Operador: Nome ou equipe responsável pelo turno.

4. MODO TOTEM TOUCHSCREEN:
- Toque no botão "Modo Totem" para fixar o aplicativo em tela cheia.
- O modo totem oculta relatórios e configurações, permitindo apenas a pesagem.
- Para retornar ao painel administrativo, toque em "Administração" e digite o PIN: 1908.
`;
fs.writeFileSync('dist/tablet/instrucoes-instalacao.txt', guiaTablet);
fs.writeFileSync('DISTRIBUICAO/Tablet/Guia_Instalacao_Tablet.txt', guiaTablet);

// 8. Copy icons into PWA distribution folders
if (fs.existsSync('public/icon.svg')) {
  fs.copyFileSync('public/icon.svg', 'dist/tablet/PWA/icon.svg');
  fs.copyFileSync('public/icon.svg', 'DISTRIBUICAO/Tablet/PWA/icon.svg');
}
if (fs.existsSync('public/pwa-192x192.png')) {
  fs.copyFileSync('public/pwa-192x192.png', 'dist/tablet/PWA/pwa-192x192.png');
  fs.copyFileSync('public/pwa-192x192.png', 'DISTRIBUICAO/Tablet/PWA/pwa-192x192.png');
}
if (fs.existsSync('public/pwa-512x512.png')) {
  fs.copyFileSync('public/pwa-512x512.png', 'dist/tablet/PWA/pwa-512x512.png');
  fs.copyFileSync('public/pwa-512x512.png', 'DISTRIBUICAO/Tablet/PWA/pwa-512x512.png');
}

console.log('Distribution bundle successfully updated in dist/ and DISTRIBUICAO/.');
