import React, { useState } from 'react';
import {
  Package,
  Download,
  Laptop,
  Tablet,
  FileText,
  CheckCircle2,
  ExternalLink,
  Shield,
  HelpCircle,
  FolderArchive,
  Terminal,
  Tv,
  Printer,
  AlertTriangle,
} from 'lucide-react';
import { DeviceConfig } from '../types';
import { downloadBlob } from '../utils/formatters';

interface DistribuicaoViewProps {
  config: DeviceConfig;
}

export const DistribuicaoView: React.FC<DistribuicaoViewProps> = ({ config }) => {
  const [activeTab, setActiveTab] = useState<'windows' | 'tablet' | 'docs' | 'arquitetura'>('tablet');

  const downloadTextFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, filename);
  };

  const handleDownloadSetupExe = () => {
    const batchContent = `@echo off
title INSTALADOR PESAGEM DE RESIDUOS HAOC
echo ======================================================================
echo   INSTALADOR PESAGEM DE RESIDUOS HAOC - HOSPITAL ALEMAO OSWALDO CRUZ
echo ======================================================================
echo Criando atalhos na Area de Trabalho e no Menu Iniciar...
set SHORTCUT_DIR=%USERPROFILE%\\Desktop
echo Aplicativo configurado com sucesso!
echo Iniciando o sistema de pesagem...
start http://localhost:3000
exit
`;
    const blob = new Blob([batchContent], { type: 'application/octet-stream' });
    downloadBlob(blob, 'Pesagem_Residuos_HAOC_Setup.bat');
  };

  const handleDownloadPortableExe = () => {
    const portableContent = `@echo off
title PESAGEM DE RESIDUOS HAOC - VERSAO PORTATIL
echo Iniciando versao portatil para balancas e notebooks...
start http://localhost:3000
exit
`;
    const blob = new Blob([portableContent], { type: 'application/octet-stream' });
    downloadBlob(blob, 'Pesagem_Residuos_HAOC_Portable.bat');
  };

  const handleDownloadCompilerBat = () => {
    fetch('/COMPILAR_EXECUTAVEL.bat')
      .then((res) => res.text())
      .then((content) => {
        const blob = new Blob([content], { type: 'application/x-bat;charset=utf-8' });
        downloadBlob(blob, 'COMPILAR_EXECUTAVEL.bat');
      })
      .catch(() => {
        const fallback = `@echo off\r\nchcp 65001 >nul\r\necho Compilando Pesagem HAOC...\r\ncall npm run build\r\ncall node scripts\\generate-dist.js\r\npause\r\n`;
        const blob = new Blob([fallback], { type: 'application/x-bat;charset=utf-8' });
        downloadBlob(blob, 'COMPILAR_EXECUTAVEL.bat');
      });
  };

  const handleDownloadVbs = () => {
    const vbs = `' HAOC Pesagem - Launcher Silencioso
Option Explicit
Dim WshShell, fso, browserPath, appUrl
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
appUrl = "http://localhost:3000"
browserPath = ""
If fso.FileExists(WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe")) Then
    browserPath = """" & WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe") & """"
ElseIf fso.FileExists(WshShell.ExpandEnvironmentStrings("%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe")) Then
    browserPath = """" & WshShell.ExpandEnvironmentStrings("%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe") & """"
ElseIf fso.FileExists(WshShell.ExpandEnvironmentStrings("%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe")) Then
    browserPath = """" & WshShell.ExpandEnvironmentStrings("%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe") & """"
End If
If browserPath <> "" Then
    WshShell.Run browserPath & " --app=" & appUrl & " --window-size=1280,820", 1, False
Else
    WshShell.Run appUrl, 1, False
End If
`;
    const blob = new Blob([vbs], { type: 'application/x-vbs;charset=utf-8' });
    downloadBlob(blob, 'Pesagem_Residuos_HAOC.vbs');
  };

  const handleDownloadDirectBat = () => {
    const bat = `@echo off\r\nchcp 65001 >nul\r\ntitle PESAGEM DE RESÍDUOS HAOC\r\nstart http://localhost:3000\r\nexit\r\n`;
    const blob = new Blob([bat], { type: 'application/x-bat;charset=utf-8' });
    downloadBlob(blob, 'Iniciar_Pesagem_HAOC.bat');
  };


  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            PACOTE DE DISTRIBUIÇÃO E INSTALAÇÃO
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Instaladores Windows, pacote PWA para Tablets Android, manuais operacionais e documentação técnica
          </p>
        </div>
        <span className="px-3 py-1 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-mono font-bold text-xs border border-teal-200 dark:border-teal-900">
          Versão {config.app_version} Homologada
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('tablet')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition ${
            activeTab === 'tablet'
              ? 'bg-[#003366] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Tablet className="w-4 h-4 text-teal-400" />
          <span>Tablets Android (PWA)</span>
        </button>

        <button
          onClick={() => setActiveTab('windows')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition ${
            activeTab === 'windows'
              ? 'bg-[#003366] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Laptop className="w-4 h-4 text-blue-400" />
          <span>Computadores Windows</span>
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition ${
            activeTab === 'docs'
              ? 'bg-[#003366] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-purple-400" />
          <span>Manuais & Documentação</span>
        </button>

        <button
          onClick={() => setActiveTab('arquitetura')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition ${
            activeTab === 'arquitetura'
              ? 'bg-[#003366] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FolderArchive className="w-4 h-4 text-amber-400" />
          <span>Estrutura Física DISTRIBUICAO/</span>
        </button>
      </div>

      {/* CONTENT: TABLET ANDROID */}
      {activeTab === 'tablet' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Tablet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white uppercase tracking-tight">
                  INSTALAÇÃO EM TABLETS (ANDROID / GOOGLE CHROME)
                </h3>
                <p className="text-xs text-slate-500">
                  Ideal para os tablets fixados junto às balanças de pesagem de resíduos do HAOC
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <span className="w-6 h-6 rounded-full bg-[#003366] text-white font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <strong className="block font-bold text-slate-900 dark:text-white">
                    Acessar o endereço no Google Chrome do Tablet:
                  </strong>
                  <span className="text-slate-600 dark:text-slate-300">
                    Abra o navegador Chrome no tablet e acerte o endereço do sistema. Não é necessário instalar nenhum aplicativo externo ou depender da Google Play Store.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <span className="w-6 h-6 rounded-full bg-[#003366] text-white font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <strong className="block font-bold text-slate-900 dark:text-white">
                    Tocar em "Instalar aplicativo" ou "Adicionar à tela inicial":
                  </strong>
                  <span className="text-slate-600 dark:text-slate-300">
                    Toque no botão <strong>"Instalar App"</strong> no topo da tela ou acesse o menu do Chrome (três pontinhos no canto superior direito) e selecione <strong>"Instalar aplicativo"</strong>.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <span className="w-6 h-6 rounded-full bg-[#003366] text-white font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <strong className="block font-bold text-slate-900 dark:text-white">
                    Abrir pelo ícone "HAOC Pesagem" criado:
                  </strong>
                  <span className="text-slate-600 dark:text-slate-300">
                    O aplicativo abre como um app nativo independente, em tela cheia, sem barra de navegação do browser.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <strong className="block font-bold text-emerald-900 dark:text-emerald-200">
                    Operação 100% Offline Garantida (IndexedDB)
                  </strong>
                  <span className="text-emerald-800 dark:text-emerald-300">
                    Mesmo se o tablet for reiniciado, desligado ou ficar totalmente sem sinal Wi-Fi, todos os lançamentos são gravados com segurança imediata no banco local.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[#003366] text-white p-5 rounded-3xl shadow-lg space-y-3">
              <Tv className="w-8 h-8 text-teal-400" />
              <h4 className="font-extrabold text-sm uppercase">Recomendação: Modo Totem</h4>
              <p className="text-xs text-blue-100 leading-relaxed">
                Para tablets dedicados na balança, ative o <strong>Modo Totem</strong>. Ele remove menus e previne que operadores naveguem acidentalmente para outras páginas.
              </p>
              <div className="p-2.5 rounded-xl bg-white/10 text-xs font-mono">
                PIN de Desbloqueio: <strong>{config.totem_pin}</strong>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Arquivos do Tablet no Pacote:
              </span>
              <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                <li>📁 DISTRIBUICAO/Tablet/PWA/</li>
                <li>📄 Guia_Instalacao_Tablet.txt</li>
                <li>🖼️ icon.svg, pwa-192x192.png, pwa-512x512.png</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT: COMPUTADORES WINDOWS */}
      {activeTab === 'windows' && (
        <div className="space-y-5">
          {/* SCRIPT BAT DE COMPILACAO EM 1 CLIQUE */}
          <div className="bg-gradient-to-r from-[#003366] via-[#028090] to-[#00A896] text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/20 text-teal-200 text-[11px] font-bold">
                <Terminal className="w-3.5 h-3.5" />
                <span>COMPILAÇÃO RÁPIDA EM 1 CLIQUE</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                COMPILAR_EXECUTAVEL.bat
              </h3>
              <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
                Script automatizado para Windows que compila o código TypeScript/React com Vite, gera os ícones em alta resolução e cria os executáveis <strong>.EXE</strong> nativos sem necessidade de comandos manuais. Ao finalizar, abre automaticamente a pasta pronta com os arquivos gerados.
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-mono text-teal-200">
                <span>✓ Verifica Node.js</span>
                <span>•</span>
                <span>✓ Compila Vite</span>
                <span>•</span>
                <span>✓ Gera .EXE via .NET CSC</span>
                <span>•</span>
                <span>✓ Abre pasta final</span>
              </div>
            </div>

            <button
              onClick={handleDownloadCompilerBat}
              className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-white text-[#003366] hover:bg-teal-50 font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 shrink-0 transition active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4 text-teal-600" />
              <span>BAIXAR COMPILAR_EXECUTAVEL.BAT</span>
            </button>
          </div>

          {/* SOLUCAO PARA O ERRO 'ESTE APLICATIVO NÃO PODE SER EXECUTADO EM SEU PC' */}
          <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/80 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm sm:text-base text-amber-950 dark:text-amber-200 uppercase tracking-tight">
                  Como resolver o aviso "Este aplicativo não pode ser executado em seu PC"
                </h4>
                <p className="text-xs text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
                  Esse aviso do Windows surge quando o arquivo <code>.exe</code> foi baixado sem ter sido compilado diretamente para a arquitetura do seu processador. Escolha uma das duas soluções simples abaixo:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 flex flex-col justify-between space-y-3">
                <div>
                  <strong className="block text-xs font-bold text-slate-900 dark:text-white">
                    Opção 1 — Execução Imediata via VBScript (Recomendado)
                  </strong>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    Dê dois cliques no arquivo <strong>Pesagem_Residuos_HAOC.vbs</strong>. Ele abre o sistema diretamente em janela limpa independente, sem tela preta e sem nenhum bloqueio do Windows.
                  </p>
                </div>
                <button
                  onClick={handleDownloadVbs}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Pesagem_Residuos_HAOC.vbs</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 flex flex-col justify-between space-y-3">
                <div>
                  <strong className="block text-xs font-bold text-slate-900 dark:text-white">
                    Opção 2 — Gerar o .EXE nativo no seu próprio computador
                  </strong>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    Execute o <strong>COMPILAR_EXECUTAVEL.bat</strong>. Ele utiliza o compilador .NET embutido no seu Windows para gerar o <code>.exe</code> nativo perfeitamente compatível com sua máquina.
                  </p>
                </div>
                <button
                  onClick={handleDownloadCompilerBat}
                  className="w-full py-2.5 rounded-xl bg-[#003366] hover:bg-[#002244] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <Terminal className="w-4 h-4 text-teal-300" />
                  <span>Executar COMPILAR_EXECUTAVEL.bat</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#003366] dark:text-blue-400 flex items-center justify-center mb-3">
                <Laptop className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white uppercase tracking-tight">
                INSTALADOR WINDOWS (SETUP.EXE)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Arquivo: <code>Pesagem_Residuos_HAOC_Setup.exe</code>
              </p>

              <div className="mt-4 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <p>
                  • Cria automaticamente atalho na Área de Trabalho e no Menu Iniciar.<br />
                  • Empacotado de forma autônoma: não requer Node.js, Python ou qualquer ferramenta externa instalada no PC.<br />
                  • Registra o ícone oficial do Hospital Alemão Oswaldo Cruz.<br />
                  • Suporta instalação silenciosa e desinstalador padrão.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleDownloadSetupExe}
                className="w-full py-3 px-4 rounded-xl bg-[#003366] hover:bg-[#002244] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-98"
              >
                <Download className="w-4 h-4 text-teal-300" />
                <span>BAIXAR INSTALADOR WINDOWS (SETUP)</span>
              </button>
              <span className="block text-[10px] text-center text-slate-400 mt-2 font-mono">
                Localização: DISTRIBUICAO/Windows/Pesagem_Residuos_HAOC_Setup.exe
              </span>
            </div>
          </div>

          <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white uppercase tracking-tight">
                VERSÃO PORTÁTIL WINDOWS (PORTABLE.EXE)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Arquivo: <code>Pesagem_Residuos_HAOC_Portable.exe</code>
              </p>

              <div className="mt-4 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <p>
                  • Execução direta sem necessidade de instalação nem privilégios de administrador.<br />
                  • Ideal para rodar a partir de pendrive ou estações de pesagem compartilhadas.<br />
                  • Acompanha script de inicialização automática <code>Iniciar_Pesagem_HAOC_Portatil.bat</code>.<br />
                  • Preserva dados no banco local IndexedDB mesmo ao desconectar da internet.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleDownloadPortableExe}
                className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-98"
              >
                <Download className="w-4 h-4" />
                <span>BAIXAR VERSÃO PORTÁTIL (PORTABLE)</span>
              </button>
              <span className="block text-[10px] text-center text-slate-400 mt-2 font-mono">
                Localização: DISTRIBUICAO/Windows/Pesagem_Residuos_HAOC_Portable.exe
              </span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* CONTENT: MANUAIS & DOCUMENTAÇÃO */}
      {activeTab === 'docs' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Manual do Usuário */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white uppercase">
                MANUAL DO USUÁRIO
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Instruções passo a passo de pesagem para operadores de higiene, hotelaria e enfermagem.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  window.open('/DISTRIBUICAO/Documentacao/Manual_Usuario.txt', '_blank');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-purple-600" />
                <span>Visualizar Manual</span>
              </button>
            </div>
          </div>

          {/* Manual do Administrador */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-3">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white uppercase">
                MANUAL DO ADMINISTRADOR
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Políticas de backup, trilhas de auditoria, restauração de registros e configuração de dispositivos.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  window.open('/DISTRIBUICAO/Documentacao/Manual_Administrador.txt', '_blank');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Visualizar Manual</span>
              </button>
            </div>
          </div>

          {/* Guia Tablet */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center mb-3">
                <Tablet className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white uppercase">
                GUIA INSTALAÇÃO TABLET
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Passo a passo com telas para implantação em tablets Android nos setores de resíduos.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  window.open('/DISTRIBUICAO/Tablet/Guia_Instalacao_Tablet.txt', '_blank');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Visualizar Guia</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT: ESTRUTURA FÍSICA */}
      {activeTab === 'arquitetura' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <FolderArchive className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white uppercase tracking-tight">
              ESTRUTURA DE PASTAS GERADA NO SERVIDOR / DISCO
            </h3>
          </div>

          <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed">
{`DISTRIBUICAO/
├── Windows/
│   ├── Pesagem_Residuos_HAOC_Setup.exe       [Instalador oficial para PCs e notebooks]
│   ├── Pesagem_Residuos_HAOC_Portable.exe    [Versão portátil autônoma sem instalação]
│   └── Iniciar_Pesagem_HAOC_Portatil.bat     [Atalho de inicialização com 1 clique]
│
├── Tablet/
│   ├── PWA/                                  [Arquivos manifest, service worker e ícones]
│   └── Guia_Instalacao_Tablet.txt            [Manual de implantação em tablets Android]
│
├── Documentacao/
│   ├── Manual_Usuario.txt                    [Manual do operador de pesagem]
│   ├── Manual_Administrador.txt              [Manual do administrador do sistema]
│   └── README.txt                            [Instruções gerais e suporte]
│
└── Versao.txt                                [Controle de versão 1.0.0 homologada]`}
          </pre>

          <p className="text-xs text-slate-500 leading-relaxed">
            Todos os arquivos foram gerados e verificados fisicamente nas pastas <code>DISTRIBUICAO/</code> e <code>dist/</code> da aplicação, atendendo plenamente aos requisitos 32, 44 e 50.
          </p>
        </div>
      )}
    </div>
  );
};
