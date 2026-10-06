import React, { useState } from 'react';
import {
  Scale,
  History,
  LayoutDashboard,
  FileSpreadsheet,
  Database,
  Settings,
  Sun,
  Moon,
  Tv,
  Wifi,
  WifiOff,
  Download,
  Package,
  User,
  MapPin,
  Laptop,
} from 'lucide-react';
import { DeviceConfig } from '../types';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWA';

interface HeaderProps {
  activeTab: 'pesagem' | 'historico' | 'dashboard' | 'relatorios' | 'backup' | 'configuracoes' | 'distribuicao';
  setActiveTab: (tab: 'pesagem' | 'historico' | 'dashboard' | 'relatorios' | 'backup' | 'configuracoes' | 'distribuicao') => void;
  config: DeviceConfig;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onEnterTotem: () => void;
  recordCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  config,
  isDarkMode,
  onToggleTheme,
  onEnterTotem,
  recordCount,
}) => {
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIosGuide, setShowIosGuide] = useState(false);

  return (
    <header className="no-print sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
      {/* Top hospital branding bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-2 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Brand Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#003366] to-[#001d3d] flex items-center justify-center text-white shadow-md shadow-blue-900/20 ring-1 ring-white/10 shrink-0">
              <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                  PESAGEM DE RESÍDUOS HAOC
                </h1>
                <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300">
                  {config.app_version}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Registro de pesagem de resíduos •{' '}
                <span className="text-teal-700 dark:text-teal-400 font-semibold">
                  Hospital Alemão Oswaldo Cruz
                </span>
              </p>
            </div>
          </div>

          {/* Quick status & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
            {/* Operator & Device badge */}
            <div className="hidden lg:flex items-center gap-2.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span className="font-semibold truncate max-w-[130px]">{config.default_operator}</span>
              </span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <Laptop className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="truncate max-w-[110px]">{config.device_name}</span>
              </span>
            </div>

            {/* Online / Offline status */}
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 animate-pulse'
              }`}
              title={isOnline ? 'Conexão ativa' : 'Operando em modo offline local (IndexedDB)'}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {/* PWA Install Button */}
            {!isInstalled && isInstallable && (
              <button
                onClick={install}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs transition"
                title="Instalar aplicativo no computador ou tablet"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Instalar App</span>
              </button>
            )}

            {!isInstalled && isIOS && (
              <button
                onClick={() => setShowIosGuide(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar iOS</span>
              </button>
            )}

            {/* Totem mode */}
            <button
              onClick={onEnterTotem}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#003366] hover:bg-[#002244] text-white font-medium text-xs shadow-xs transition"
              title="Ativar Modo Totem Touchscreen para pesagens em tela cheia"
            >
              <Tv className="w-3.5 h-3.5 text-teal-300" />
              <span className="hidden md:inline">Modo Totem</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={isDarkMode ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
              aria-label="Alternar tema"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto pt-2 pb-0.5 no-scrollbar text-xs font-semibold text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 mt-1">
          <button
            onClick={() => setActiveTab('pesagem')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all shrink-0 ${
              activeTab === 'pesagem'
                ? 'bg-[#003366] text-white shadow-xs'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Nova Pesagem</span>
          </button>

          <button
            onClick={() => setActiveTab('historico')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all shrink-0 ${
              activeTab === 'historico'
                ? 'bg-[#003366] text-white shadow-xs'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Histórico</span>
            {recordCount > 0 && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'historico'
                    ? 'bg-teal-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {recordCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all shrink-0 ${
              activeTab === 'dashboard'
                ? 'bg-[#003366] text-white shadow-xs'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('relatorios')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all shrink-0 ${
              activeTab === 'relatorios'
                ? 'bg-[#003366] text-white shadow-xs'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Relatórios</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all shrink-0 ${
              activeTab === 'backup'
                ? 'bg-[#003366] text-white shadow-xs'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Backup & Auditoria</span>
          </button>

          <button
            onClick={() => setActiveTab('distribuicao')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all shrink-0 ${
              activeTab === 'distribuicao'
                ? 'bg-[#003366] text-white shadow-xs'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Instalação & Dist</span>
          </button>

          <button
            onClick={() => setActiveTab('configuracoes')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all shrink-0 ${
              activeTab === 'configuracoes'
                ? 'bg-[#003366] text-white shadow-xs'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configurações</span>
          </button>
        </nav>
      </div>

      {/* iOS Safari Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Instalar no iPad / iPhone
            </h3>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              1. Toque no botão <strong>Compartilhar</strong> (ícone de quadrado com seta para cima) na barra do Safari.<br />
              2. Role para baixo e toque em <strong>Adicionar à Tela de Início</strong>.<br />
              3. O aplicativo funcionará em tela cheia mesmo sem internet.
            </p>
            <button
              onClick={() => setShowIosGuide(false)}
              className="mt-4 w-full rounded-xl bg-slate-900 dark:bg-slate-700 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
