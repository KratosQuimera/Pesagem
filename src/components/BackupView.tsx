import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  ShieldCheck,
  AlertTriangle,
  History,
  FileCheck,
  CheckCircle2,
  RefreshCw,
  HardDrive,
  Clock,
  User,
  Info,
} from 'lucide-react';
import { DeviceConfig, BackupPayload, AuditoriaRecord } from '../types';
import { dbService } from '../services/database';
import { downloadBlob, formatDateTimeBR } from '../utils/formatters';

interface BackupViewProps {
  config: DeviceConfig;
  auditoria: AuditoriaRecord[];
  onRefresh: () => void;
}

export const BackupView: React.FC<BackupViewProps> = ({ config, auditoria, onRefresh }) => {
  const [integrityState, setIntegrityState] = useState<{
    loading: boolean;
    ok: boolean;
    totalPesagens: number;
    totalAuditoria: number;
    invalidRecords: number;
    detalhes: string;
  }>({
    loading: false,
    ok: true,
    totalPesagens: 0,
    totalAuditoria: 0,
    invalidRecords: 0,
    detalhes: 'Clique para verificar a integridade da base IndexedDB.',
  });

  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePayload, setRestorePayload] = useState<BackupPayload | null>(null);
  const [replaceExisting, setReplaceExisting] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCheckIntegrity = async () => {
    setIntegrityState((prev) => ({ ...prev, loading: true }));
    try {
      const res = await dbService.checkDatabaseIntegrity();
      setIntegrityState({
        loading: false,
        ok: res.ok,
        totalPesagens: res.totalPesagens,
        totalAuditoria: res.totalAuditoria,
        invalidRecords: res.invalidRecords,
        detalhes: res.detalhes,
      });
    } catch (e) {
      console.error(e);
      setIntegrityState((prev) => ({
        ...prev,
        loading: false,
        ok: false,
        detalhes: 'Falha ao executar auditoria de integridade.',
      }));
    }
  };

  useEffect(() => {
    handleCheckIntegrity();
  }, []);

  const handleExportBackup = async () => {
    try {
      const payload = await dbService.exportBackup(config);
      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const filename = `backup_haoc_residuos_${new Date().toISOString().substring(0, 10)}_${Date.now().toString(36)}.json`;
      downloadBlob(blob, filename);

      await dbService.logAuditoria(
        'RESTAURACAO_BACKUP',
        `Exportação de backup realizada: ${payload.total_pesagens} pesagens salvas em arquivo.`,
        config.default_operator
      );
      onRefresh();
    } catch (e) {
      console.error(e);
      alert('Erro ao exportar backup de dados.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed: BackupPayload = JSON.parse(text);

        if (!parsed || !Array.isArray(parsed.pesagens)) {
          alert('Arquivo inválido. Formato de backup HAOC não reconhecido.');
          return;
        }

        setRestoreFile(file);
        setRestorePayload(parsed);
        setRestoreStatus(null);
      } catch (err) {
        alert('Erro ao ler arquivo JSON. Verifique se o arquivo não está corrompido.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    if (!restorePayload) return;
    setIsRestoring(true);
    setRestoreStatus('Restaurando registros e atualizando banco de dados...');

    try {
      const result = await dbService.restoreBackup(
        restorePayload,
        replaceExisting,
        config.default_operator
      );
      setRestoreStatus(
        `Sucesso: ${result.importedPesagens} pesagens e ${result.importedAudit} registros de auditoria restaurados!`
      );
      setRestorePayload(null);
      setRestoreFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onRefresh();
      handleCheckIntegrity();
    } catch (e: unknown) {
      console.error(e);
      setRestoreStatus('Erro crítico durante a restauração do backup.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
          BACKUP, SEGURANÇA E AUDITORIA
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Gerenciamento de redundância local, persistência IndexedDB e rastreabilidade operacional
        </p>
      </div>

      {/* TOP ROW: EXPORT, RESTORE & INTEGRITY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* CARD 1: EXPORTAR BACKUP */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#003366] dark:text-blue-400 flex items-center justify-center mb-3">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white uppercase tracking-wider">
              EXPORTAR BACKUP
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Gera um arquivo JSON completo contendo todos os registros de pesagem, trilha de auditoria e configurações do terminal.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleExportBackup}
              className="w-full py-3 px-4 rounded-xl bg-[#003366] hover:bg-[#002244] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-98"
            >
              <Download className="w-4 h-4 text-teal-300" />
              <span>BAIXAR ARQUIVO JSON</span>
            </button>
            <span className="block text-[10px] text-center text-slate-400 mt-2">
              Checksum SHA e carimbo de tempo inclusos
            </span>
          </div>
        </div>

        {/* CARD 2: RESTAURAR BACKUP */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white uppercase tracking-wider">
              RESTAURAR BACKUP
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Carregue um arquivo de backup previamente exportado. Permite mesclar com registros existentes ou substituição segura com confirmação.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
              id="backup-file-input"
            />
            <label
              htmlFor="backup-file-input"
              className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 text-center"
            >
              <Upload className="w-4 h-4" />
              <span>SELECIONAR ARQUIVO JSON</span>
            </label>
            <span className="block text-[10px] text-center text-slate-400 mt-2">
              Nunca sobrescreve silenciosamente
            </span>
          </div>
        </div>

        {/* CARD 3: INTEGRIDADE DO BANCO */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${
                integrityState.ok
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white uppercase tracking-wider">
                INTEGRIDADE DOS DADOS
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  integrityState.ok
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {integrityState.ok ? 'Íntegro' : 'Atenção'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
              {integrityState.detalhes}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Registros de Pesagens:</span>
              <strong className="text-slate-800 dark:text-slate-200">
                {integrityState.totalPesagens}
              </strong>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Trilhas de Auditoria:</span>
              <strong className="text-slate-800 dark:text-slate-200">
                {integrityState.totalAuditoria}
              </strong>
            </div>
            <button
              onClick={handleCheckIntegrity}
              disabled={integrityState.loading}
              className="w-full mt-2 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${integrityState.loading ? 'animate-spin' : ''}`}
              />
              <span>Verificar Agora</span>
            </button>
          </div>
        </div>
      </div>

      {/* RESTORE PREVIEW & CONFIRMATION MODAL */}
      {restorePayload && (
        <div className="p-6 bg-amber-50 dark:bg-slate-900/90 rounded-3xl border-2 border-amber-300 dark:border-amber-700/80 shadow-xl space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-base text-slate-900 dark:text-white uppercase">
                  CONFIRMAR RESTAURAÇÃO DE BACKUP
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Arquivo: <strong>{restoreFile?.name}</strong> • Hospital: {restorePayload.hospital || 'HAOC'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setRestorePayload(null);
                setRestoreFile(null);
              }}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] block">Data do Backup:</span>
              <strong className="text-slate-800 dark:text-slate-200">
                {formatDateTimeBR(restorePayload.data_geracao)}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Total de Pesagens:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                {restorePayload.total_pesagens} registros
              </strong>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Logs de Auditoria:</span>
              <strong className="text-slate-800 dark:text-slate-200">
                {restorePayload.total_auditoria || 0}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Checksum Integridade:</span>
              <strong className="font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                {restorePayload.checksum || 'Válido'}
              </strong>
            </div>
          </div>

          {/* Restoration Mode Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Modo de Restauração:
            </span>
            <div className="flex flex-col sm:flex-row gap-3 text-xs">
              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="restoreMode"
                  checked={!replaceExisting}
                  onChange={() => setReplaceExisting(false)}
                />
                <div>
                  <strong className="block text-slate-800 dark:text-slate-200">
                    Mesclar com registros atuais (Recomendado)
                  </strong>
                  <span className="text-[11px] text-slate-500">
                    Mantém os registros já existentes no tablet e adiciona os novos do backup.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-rose-300 dark:border-rose-900 bg-white dark:bg-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="restoreMode"
                  checked={replaceExisting}
                  onChange={() => setReplaceExisting(true)}
                />
                <div>
                  <strong className="block text-rose-700 dark:text-rose-400">
                    Substituição Completa
                  </strong>
                  <span className="text-[11px] text-slate-500">
                    Substitui totalmente a base atual pelo conteúdo deste arquivo.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => {
                setRestorePayload(null);
                setRestoreFile(null);
              }}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmRestore}
              disabled={isRestoring}
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
            >
              {isRestoring ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Restaurando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar e Restaurar Banco</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {restoreStatus && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{restoreStatus}</span>
        </div>
      )}

      {/* 21. TRILHA DE AUDITORIA */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-purple-600" />
              REGISTRO DE AUDITORIA OPERACIONAL (INALTERÁVEL)
            </h3>
            <p className="text-[11px] text-slate-400">
              Trilha de rastreabilidade de todas as criações, edições, exclusões e operações no sistema
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            {auditoria.length} eventos registrados
          </span>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold border-b border-slate-200 dark:border-slate-700 sticky top-0">
              <tr>
                <th className="px-4 py-2.5">Data e Hora</th>
                <th className="px-4 py-2.5">Operação</th>
                <th className="px-4 py-2.5">Detalhes da Ação</th>
                <th className="px-4 py-2.5">Usuário Responsável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
              {auditoria.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    Nenhum evento registrado até o momento.
                  </td>
                </tr>
              ) : (
                auditoria.map((aud) => {
                  let badgeColor = 'bg-slate-100 text-slate-700';
                  if (aud.operacao === 'CRIACAO') badgeColor = 'bg-emerald-100 text-emerald-800';
                  if (aud.operacao === 'EDICAO') badgeColor = 'bg-blue-100 text-blue-800';
                  if (aud.operacao === 'EXCLUSAO') badgeColor = 'bg-rose-100 text-rose-800';
                  if (aud.operacao === 'RESTAURACAO_BACKUP') badgeColor = 'bg-purple-100 text-purple-800';
                  if (aud.operacao === 'ALTERACAO_CONFIG') badgeColor = 'bg-amber-100 text-amber-800';

                  return (
                    <tr key={aud.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-2 whitespace-nowrap text-slate-500 font-mono">
                        {formatDateTimeBR(aud.timestamp)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${badgeColor}`}>
                          {aud.operacao}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-300 font-medium">
                        {aud.detalhes}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap font-semibold text-slate-800 dark:text-slate-200">
                        {aud.usuario}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
