import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Trash2,
  Edit2,
  Eye,
  FileSpreadsheet,
  X,
  AlertTriangle,
  Calendar,
  Layers,
  ChevronDown,
  Check,
  RotateCcw,
} from 'lucide-react';
import { PesagemRecord, FiltrosPesagem, TipoResiduoId, DeviceConfig } from '../types';
import { RESIDUO_CATEGORIAS, RESIDUO_MAP } from '../services/config';
import {
  formatPeso,
  formatDateBR,
  filtrarPesagens,
  exportToCSV,
  exportToExcel,
} from '../utils/formatters';

interface HistoricoViewProps {
  pesagens: PesagemRecord[];
  config: DeviceConfig;
  onUpdatePesagem: (pesagem: PesagemRecord, usuario: string) => Promise<PesagemRecord>;
  onDeletePesagem: (id: string, usuario: string, motivo: string) => Promise<boolean>;
  onRefresh: () => void;
}

export const HistoricoView: React.FC<HistoricoViewProps> = ({
  pesagens,
  config,
  onUpdatePesagem,
  onDeletePesagem,
  onRefresh,
}) => {
  const [filtros, setFiltros] = useState<FiltrosPesagem>({
    periodo: 'este_mes',
    tipoResiduo: 'TODOS',
    termoBusca: '',
  });

  const [sortField, setSortField] = useState<'timestamp' | 'peso' | 'tipo_residuo'>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [viewRecord, setViewRecord] = useState<PesagemRecord | null>(null);
  const [editRecord, setEditRecord] = useState<PesagemRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteMotivo, setDeleteMotivo] = useState<string>('');
  const [editPeso, setEditPeso] = useState<string>('');
  const [editTipo, setEditTipo] = useState<TipoResiduoId>('COMUM');
  const [editObs, setEditObs] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // Filtered & sorted records
  const filteredRecords = useMemo(() => {
    const list = filtrarPesagens(pesagens, filtros);
    return list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'timestamp') {
        comparison = a.timestamp - b.timestamp;
      } else if (sortField === 'peso') {
        comparison = a.peso - b.peso;
      } else if (sortField === 'tipo_residuo') {
        comparison = a.tipo_residuo.localeCompare(b.tipo_residuo);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [pesagens, filtros, sortField, sortDirection]);

  const totalFilteredWeight = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + r.peso, 0);
  }, [filteredRecords]);

  const handleSort = (field: 'timestamp' | 'peso' | 'tipo_residuo') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const openEditModal = (rec: PesagemRecord) => {
    setEditRecord(rec);
    setEditTipo(rec.tipo_residuo);
    setEditPeso(rec.peso.toFixed(2).replace('.', ','));
    setEditObs(rec.observacao || '');
  };

  const handleSaveEdit = async () => {
    if (!editRecord) return;
    const cleanNum = parseFloat(editPeso.replace(',', '.'));
    if (isNaN(cleanNum) || cleanNum <= 0) {
      alert('Informe um peso válido maior que zero.');
      return;
    }

    setIsSavingEdit(true);
    try {
      const updated: PesagemRecord = {
        ...editRecord,
        tipo_residuo: editTipo,
        peso: cleanNum,
        observacao: editObs.trim() || undefined,
      };
      await onUpdatePesagem(updated, config.default_operator);
      setEditRecord(null);
      onRefresh();
    } catch (e) {
      console.error(e);
      alert('Erro ao atualizar registro.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    try {
      await onDeletePesagem(deleteConfirmId, config.default_operator, deleteMotivo);
      setDeleteConfirmId(null);
      setDeleteMotivo('');
      onRefresh();
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir registro.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
      {/* Title & Stats Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            HISTÓRICO DE PESAGENS
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Consultas, edição, auditoria e exportação de pesagens registradas
          </p>
        </div>

        {/* Action buttons (Export) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportToExcel(filteredRecords, `pesagens_haoc_${Date.now()}.xls`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs active:scale-95 transition"
            title="Exportar para Microsoft Excel (.xls)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>EXPORTAR EXCEL</span>
          </button>

          <button
            onClick={() => exportToCSV(filteredRecords, `pesagens_haoc_${Date.now()}.csv`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold shadow-xs active:scale-95 transition"
            title="Exportar formato CSV compatível"
          >
            <Download className="w-4 h-4" />
            <span>EXPORTAR CSV</span>
          </button>
        </div>
      </div>

      {/* FILTERS PANEL */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs mb-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Período */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Período
            </label>
            <select
              value={filtros.periodo}
              onChange={(e) =>
                setFiltros((prev) => ({
                  ...prev,
                  periodo: e.target.value as FiltrosPesagem['periodo'],
                }))
              }
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-hidden"
            >
              <option value="hoje">Hoje</option>
              <option value="ontem">Ontem</option>
              <option value="ultimos_7_dias">Últimos 7 dias</option>
              <option value="ultimos_30_dias">Últimos 30 dias</option>
              <option value="este_mes">Este mês</option>
              <option value="personalizado">Personalizado</option>
            </select>
          </div>

          {/* Custom Date Range if 'personalizado' */}
          {filtros.periodo === 'personalizado' && (
            <div className="sm:col-span-2 flex items-center gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                  De:
                </label>
                <input
                  type="date"
                  value={filtros.dataInicio || ''}
                  onChange={(e) =>
                    setFiltros((prev) => ({ ...prev, dataInicio: e.target.value }))
                  }
                  className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                  Até:
                </label>
                <input
                  type="date"
                  value={filtros.dataFim || ''}
                  onChange={(e) =>
                    setFiltros((prev) => ({ ...prev, dataFim: e.target.value }))
                  }
                  className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Tipo de Resíduo */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Tipo de Resíduo
            </label>
            <select
              value={filtros.tipoResiduo}
              onChange={(e) =>
                setFiltros((prev) => ({
                  ...prev,
                  tipoResiduo: e.target.value as FiltrosPesagem['tipoResiduo'],
                }))
              }
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-hidden"
            >
              <option value="TODOS">Todos os tipos ({RESIDUO_CATEGORIAS.length})</option>
              {RESIDUO_CATEGORIAS.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome} ({cat.grupoAnvisa})
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Pesquisar
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por operador, setor, código ID ou tipo..."
                value={filtros.termoBusca || ''}
                onChange={(e) =>
                  setFiltros((prev) => ({ ...prev, termoBusca: e.target.value }))
                }
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-hidden focus:border-teal-500"
              />
              {filtros.termoBusca && (
                <button
                  onClick={() => setFiltros((prev) => ({ ...prev, termoBusca: '' }))}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Summary Pill */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            Exibindo <strong className="text-slate-900 dark:text-white">{filteredRecords.length}</strong> de{' '}
            {pesagens.length} lançamentos
          </span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Peso Total no Filtro:{' '}
            <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
              {formatPeso(totalFilteredWeight)}
            </strong>
          </span>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700/80 select-none">
              <tr>
                <th
                  onClick={() => handleSort('timestamp')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Data & Hora</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('tipo_residuo')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Tipo de Resíduo</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('peso')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700 transition text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Peso</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3 text-center">Unidade</th>
                <th className="px-4 py-3">Operador / Setor</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    Nenhum registro encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const cat = RESIDUO_MAP[r.tipo_residuo];
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Data / Hora */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {formatDateBR(r.data)}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">{r.hora}</div>
                      </td>

                      {/* Tipo Resíduo */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat ? cat.corHex : '#003366' }}
                          />
                          <span className="font-bold text-slate-900 dark:text-white">
                            {cat ? cat.nome : r.tipo_residuo}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {cat?.grupoAnvisa || '-'}
                        </span>
                      </td>

                      {/* Peso */}
                      <td className="px-4 py-3 text-right whitespace-nowrap font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400">
                        {r.peso.toFixed(2).replace('.', ',')}
                      </td>

                      {/* Unidade */}
                      <td className="px-4 py-3 text-center text-slate-500 font-semibold">
                        {r.unidade}
                      </td>

                      {/* Operador / Obs */}
                      <td className="px-4 py-3 max-w-[220px]">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {r.usuario}
                        </div>
                        {r.observacao && (
                          <div className="text-[11px] text-slate-500 truncate" title={r.observacao}>
                            {r.observacao}
                          </div>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setViewRecord(r)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Visualizar detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(r)}
                            className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                            title="Editar lançamento"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(r.id)}
                            className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                            title="Excluir lançamento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW MODAL */}
      {viewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Detalhes da Pesagem
              </h3>
              <button
                onClick={() => setViewRecord(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">ID Único:</span>
                  <span className="font-mono font-semibold">{viewRecord.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tipo de Resíduo:</span>
                  <span className="font-bold">{RESIDUO_MAP[viewRecord.tipo_residuo]?.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Grupo ANVISA:</span>
                  <span>{RESIDUO_MAP[viewRecord.tipo_residuo]?.grupoAnvisa}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Peso Aferido:</span>
                  <span className="font-mono font-black text-lg text-emerald-600 dark:text-emerald-400">
                    {formatPeso(viewRecord.peso)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Data e Hora:</span>
                  <span>
                    {formatDateBR(viewRecord.data)} às {viewRecord.hora}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Operador:</span>
                  <span className="font-medium">{viewRecord.usuario}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Dispositivo:</span>
                  <span>{viewRecord.device_name || config.device_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Local de Pesagem:</span>
                  <span>{viewRecord.location || config.location}</span>
                </div>
                {viewRecord.observacao && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block mb-0.5">Observação:</span>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      {viewRecord.observacao}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setViewRecord(null)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Editar Registro de Pesagem
              </h3>
              <button
                onClick={() => setEditRecord(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Tipo de Resíduo:
                </label>
                <select
                  value={editTipo}
                  onChange={(e) => setEditTipo(e.target.value as TipoResiduoId)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold"
                >
                  {RESIDUO_CATEGORIAS.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nome} ({cat.grupoAnvisa})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Peso (kg):
                </label>
                <input
                  type="text"
                  value={editPeso}
                  onChange={(e) => setEditPeso(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono font-bold text-base"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Observação / Setor:
                </label>
                <textarea
                  value={editObs}
                  onChange={(e) => setEditObs(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                A alteração será gravada permanentemente no log de auditoria do sistema.
              </p>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setEditRecord(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
              >
                {isSavingEdit ? 'Salvando...' : 'Salvar Alteração'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-rose-200 dark:border-rose-900/60">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-black text-base text-slate-900 dark:text-white">
              Confirmar Exclusão do Lançamento?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Esta ação removerá o registro do histórico ativo. Uma entrada de auditoria será registrada com o operador responsável.
            </p>

            <div className="mt-4">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Motivo da exclusão (obrigatório para auditoria):
              </label>
              <input
                type="text"
                placeholder="Ex: Erro de digitação na balança, peso duplicado..."
                value={deleteMotivo}
                onChange={(e) => setDeleteMotivo(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-hidden"
              />
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md"
              >
                {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
