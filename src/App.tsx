/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { dbService } from './services/database';
import { DeviceConfig, PesagemRecord, AuditoriaRecord } from './types';
import { DEFAULT_CONFIG } from './services/config';
import { Header } from './components/Header';
import { PesagemForm } from './components/PesagemForm';
import { HistoricoView } from './components/HistoricoView';
import { DashboardView } from './components/DashboardView';
import { RelatoriosView } from './components/RelatoriosView';
import { BackupView } from './components/BackupView';
import { ConfiguracoesView } from './components/ConfiguracoesView';
import { DistribuicaoView } from './components/DistribuicaoView';
import { TotemView } from './components/TotemView';
import { InitialSetupModal } from './components/InitialSetupModal';
import { useOnlineStatus } from './hooks/usePWA';
import { WifiOff, Scale } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<DeviceConfig>(DEFAULT_CONFIG);
  const [pesagens, setPesagens] = useState<PesagemRecord[]>([]);
  const [auditoria, setAuditoria] = useState<AuditoriaRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<
    'pesagem' | 'historico' | 'dashboard' | 'relatorios' | 'backup' | 'configuracoes' | 'distribuicao'
  >('pesagem');
  const [totemMode, setTotemMode] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('haoc_theme') === 'dark';
  });
  const isOnline = useOnlineStatus();

  // Apply dark mode to document HTML element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('haoc_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('haoc_theme', 'light');
    }
  }, [isDarkMode]);

  // Initial database hydration
  const loadData = async () => {
    try {
      const cfg = await dbService.getConfig();
      setConfig(cfg);

      let list = await dbService.getAllPesagens();
      // If completely empty on first launch, seed demonstration data so the dashboard is immediately demonstrable
      if (list.length === 0) {
        await dbService.seedDemoData('Sistema Inicial');
        list = await dbService.getAllPesagens();
      }
      setPesagens(list);

      const auditList = await dbService.getAuditoria();
      setAuditoria(auditList);
    } catch (e) {
      console.error('Error loading IndexedDB:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSavePesagem = async (newRecord: PesagemRecord): Promise<PesagemRecord> => {
    const saved = await dbService.addPesagem(newRecord);
    const updatedList = await dbService.getAllPesagens();
    setPesagens(updatedList);
    const updatedAudit = await dbService.getAuditoria();
    setAuditoria(updatedAudit);
    return saved;
  };

  const handleUpdatePesagem = async (
    rec: PesagemRecord,
    usuario: string
  ): Promise<PesagemRecord> => {
    const saved = await dbService.updatePesagem(rec, usuario);
    const updatedList = await dbService.getAllPesagens();
    setPesagens(updatedList);
    const updatedAudit = await dbService.getAuditoria();
    setAuditoria(updatedAudit);
    return saved;
  };

  const handleDeletePesagem = async (
    id: string,
    usuario: string,
    motivo: string
  ): Promise<boolean> => {
    const ok = await dbService.deletePesagem(id, usuario, motivo);
    const updatedList = await dbService.getAllPesagens();
    setPesagens(updatedList);
    const updatedAudit = await dbService.getAuditoria();
    setAuditoria(updatedAudit);
    return ok;
  };

  const handleSaveConfig = async (newConfig: DeviceConfig): Promise<DeviceConfig> => {
    const saved = await dbService.saveConfig(newConfig, config.default_operator);
    setConfig(saved);
    const updatedAudit = await dbService.getAuditoria();
    setAuditoria(updatedAudit);
    return saved;
  };

  const handleClearDemoData = async (): Promise<number> => {
    const removed = await dbService.clearDemoPesagens(config.default_operator);
    const updatedList = await dbService.getAllPesagens();
    setPesagens(updatedList);
    const updatedAudit = await dbService.getAuditoria();
    setAuditoria(updatedAudit);
    return removed;
  };

  const handleSeedDemoData = async (): Promise<number> => {
    const added = await dbService.seedDemoData(config.default_operator);
    const updatedList = await dbService.getAllPesagens();
    setPesagens(updatedList);
    const updatedAudit = await dbService.getAuditoria();
    setAuditoria(updatedAudit);
    return added;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-[#003366] text-white flex items-center justify-center mb-4 shadow-xl ring-4 ring-blue-500/20 animate-pulse">
          <Scale className="w-8 h-8 text-teal-400" />
        </div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight">
          PESAGEM DE RESÍDUOS HAOC
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Carregando base de dados local IndexedDB...
        </p>
      </div>
    );
  }

  // TOTEM FULLSCREEN MODE
  if (totemMode) {
    return (
      <TotemView
        config={config}
        onSavePesagem={handleSavePesagem}
        onExitTotem={() => setTotemMode(false)}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* First-run Device Identification Modal */}
      {!config.setup_completed && (
        <InitialSetupModal
          config={config}
          onComplete={async (updated) => {
            await handleSaveConfig(updated);
          }}
        />
      )}

      {/* Main Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode((prev) => !prev)}
        onEnterTotem={() => setTotemMode(true)}
        recordCount={pesagens.length}
      />

      {/* Body Views */}
      <main className="flex-1 pb-10">
        {activeTab === 'pesagem' && (
          <div className="animate-in fade-in duration-200">
            <PesagemForm config={config} onSavePesagem={handleSavePesagem} />
          </div>
        )}

        {activeTab === 'historico' && (
          <div className="animate-in fade-in duration-200">
            <HistoricoView
              pesagens={pesagens}
              config={config}
              onUpdatePesagem={handleUpdatePesagem}
              onDeletePesagem={handleDeletePesagem}
              onRefresh={loadData}
            />
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in duration-200">
            <DashboardView
              pesagens={pesagens}
              config={config}
              onClearDemoData={handleClearDemoData}
              onSeedDemoData={handleSeedDemoData}
              onRefresh={loadData}
            />
          </div>
        )}

        {activeTab === 'relatorios' && (
          <div className="animate-in fade-in duration-200">
            <RelatoriosView pesagens={pesagens} config={config} />
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="animate-in fade-in duration-200">
            <BackupView config={config} auditoria={auditoria} onRefresh={loadData} />
          </div>
        )}

        {activeTab === 'distribuicao' && (
          <div className="animate-in fade-in duration-200">
            <DistribuicaoView config={config} />
          </div>
        )}

        {activeTab === 'configuracoes' && (
          <div className="animate-in fade-in duration-200">
            <ConfiguracoesView config={config} onSaveConfig={handleSaveConfig} />
          </div>
        )}
      </main>

      {/* Offline Toast */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xl">
          <WifiOff className="w-4 h-4 animate-bounce" />
          <span>Modo Offline — Todos os lançamentos estão sendo salvos no banco local.</span>
        </div>
      )}

      {/* Footer */}
      <footer className="no-print border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 py-3 px-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1">
          <p>
            <strong>Hospital Alemão Oswaldo Cruz</strong> • Sistema de Pesagem de Resíduos v{config.app_version}
          </p>
          <p className="text-[11px] text-slate-400">
            Gestão de Hotelaria e Sustentabilidade Ambiental • RDC 222/2018
          </p>
        </div>
      </footer>
    </div>
  );
}
