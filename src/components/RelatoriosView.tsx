import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Layers,
  TrendingUp,
  User,
  Building,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { PesagemRecord, DeviceConfig, TipoResiduoId, FiltrosPesagem } from '../types';
import { RESIDUO_CATEGORIAS, RESIDUO_MAP } from '../services/config';
import {
  formatPeso,
  formatDateBR,
  formatTimeBR,
  formatDateTimeBR,
  filtrarPesagens,
  exportToCSV,
  exportToExcel,
} from '../utils/formatters';

interface RelatoriosViewProps {
  pesagens: PesagemRecord[];
  config: DeviceConfig;
}

export const RelatoriosView: React.FC<RelatoriosViewProps> = ({ pesagens, config }) => {
  const [tipoPeriodo, setTipoPeriodo] = useState<'dia' | 'semana' | 'mes' | 'personalizado'>('mes');
  const [dataSelecionada, setDataSelecionada] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [dataInicio, setDataInicio] = useState<string>(
    new Date(Date.now() - 30 * 86400000).toISOString().substring(0, 10)
  );
  const [dataFim, setDataFim] = useState<string>(new Date().toISOString().substring(0, 10));
  const [filtroResiduo, setFiltroResiduo] = useState<'TODOS' | TipoResiduoId>('TODOS');
  const [operadorFiltro, setOperadorFiltro] = useState<string>('TODOS');

  // Available unique operators from database
  const uniqueOperators = useMemo(() => {
    const set = new Set<string>();
    pesagens.forEach((p) => {
      if (p.usuario) set.add(p.usuario);
    });
    return Array.from(set);
  }, [pesagens]);

  // Date boundary calculation for the selected period
  const { startDate, endDate, periodoLabel } = useMemo(() => {
    const now = new Date(dataSelecionada + 'T12:00:00');

    if (tipoPeriodo === 'dia') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      return {
        startDate: start,
        endDate: end,
        periodoLabel: `Dia ${formatDateBR(start)}`,
      };
    }

    if (tipoPeriodo === 'semana') {
      const dayOfWeek = now.getDay(); // 0 is Sunday
      const start = new Date(now);
      start.setDate(now.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      return {
        startDate: start,
        endDate: end,
        periodoLabel: `Semana de ${formatDateBR(start)} a ${formatDateBR(end)}`,
      };
    }

    if (tipoPeriodo === 'mes') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const mesNome = start.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      return {
        startDate: start,
        endDate: end,
        periodoLabel: `Mês de ${mesNome.toUpperCase()}`,
      };
    }

    // Personalizado
    const start = new Date(`${dataInicio}T00:00:00`);
    const end = new Date(`${dataFim}T23:59:59`);
    return {
      startDate: start,
      endDate: end,
      periodoLabel: `Período de ${formatDateBR(start)} até ${formatDateBR(end)}`,
    };
  }, [tipoPeriodo, dataSelecionada, dataInicio, dataFim]);

  // Filtered dataset for report
  const relatorioData = useMemo(() => {
    return pesagens.filter((p) => {
      const pDate = new Date(p.timestamp);
      if (pDate < startDate || pDate > endDate) return false;
      if (filtroResiduo !== 'TODOS' && p.tipo_residuo !== filtroResiduo) return false;
      if (operadorFiltro !== 'TODOS' && p.usuario !== operadorFiltro) return false;
      return true;
    });
  }, [pesagens, startDate, endDate, filtroResiduo, operadorFiltro]);

  // Aggregate metrics
  const totalPesagens = relatorioData.length;
  const pesoTotal = relatorioData.reduce((sum, p) => sum + p.peso, 0);
  const mediaPorPesagem = totalPesagens > 0 ? pesoTotal / totalPesagens : 0;

  // Breakdown by waste category
  const categoriasBreakdown = useMemo(() => {
    const map: Record<string, { count: number; totalPeso: number }> = {};
    RESIDUO_CATEGORIAS.forEach((c) => {
      map[c.id] = { count: 0, totalPeso: 0 };
    });

    relatorioData.forEach((p) => {
      if (!map[p.tipo_residuo]) {
        map[p.tipo_residuo] = { count: 0, totalPeso: 0 };
      }
      map[p.tipo_residuo].count += 1;
      map[p.tipo_residuo].totalPeso += p.peso;
    });

    return Object.keys(map)
      .map((id) => {
        const cat = RESIDUO_MAP[id as keyof typeof RESIDUO_MAP];
        return {
          id,
          nome: cat ? cat.nome : id,
          grupoAnvisa: cat ? cat.grupoAnvisa : '-',
          corHex: cat ? cat.corHex : '#003366',
          count: map[id].count,
          totalPeso: map[id].totalPeso,
          percentual: pesoTotal > 0 ? (map[id].totalPeso / pesoTotal) * 100 : 0,
        };
      })
      .sort((a, b) => b.totalPeso - a.totalPeso);
  }, [relatorioData, pesoTotal]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    exportToCSV(relatorioData, `relatorio_haoc_${tipoPeriodo}_${Date.now()}.csv`);
  };

  const handleExportExcel = () => {
    exportToExcel(relatorioData, `relatorio_haoc_${tipoPeriodo}_${Date.now()}.xls`);
  };

  const dataGeracao = formatDateTimeBR(Date.now());

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
      {/* Configuration & Filter Ribbon (Hidden during printing) */}
      <div className="no-print bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm mb-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              MÓDULO DE RELATÓRIOS
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gere relatórios executivos para vigilância sanitária, auditorias e gestão ambiental
            </p>
          </div>

          {/* Export Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>EXPORTAR EXCEL</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>EXPORTAR CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#003366] hover:bg-[#002244] text-white font-bold text-xs shadow-md transition active:scale-95"
            >
              <Printer className="w-4 h-4 text-teal-300" />
              <span>IMPRIMIR RELATÓRIO</span>
            </button>
          </div>
        </div>

        {/* Filter selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Agrupamento Temporal
            </label>
            <select
              value={tipoPeriodo}
              onChange={(e) =>
                setTipoPeriodo(e.target.value as 'dia' | 'semana' | 'mes' | 'personalizado')
              }
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-hidden"
            >
              <option value="dia">Por Dia</option>
              <option value="semana">Por Semana</option>
              <option value="mes">Por Mês</option>
              <option value="personalizado">Período Personalizado</option>
            </select>
          </div>

          {tipoPeriodo !== 'personalizado' ? (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Data Base de Referência
              </label>
              <input
                type="date"
                value={dataSelecionada}
                onChange={(e) => setDataSelecionada(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-hidden"
              />
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="w-1/2">
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">De</label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-hidden"
                />
              </div>
              <div className="w-1/2">
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Até</label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-hidden"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Filtro de Categoria
            </label>
            <select
              value={filtroResiduo}
              onChange={(e) =>
                setFiltroResiduo(e.target.value as 'TODOS' | TipoResiduoId)
              }
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-hidden"
            >
              <option value="TODOS">Todos os tipos de resíduo</option>
              {RESIDUO_CATEGORIAS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} ({c.grupoAnvisa})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Operador
            </label>
            <select
              value={operadorFiltro}
              onChange={(e) => setOperadorFiltro(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-hidden"
            >
              <option value="TODOS">Todos os operadores ({uniqueOperators.length})</option>
              {uniqueOperators.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* PRINTABLE OFFICIAL REPORT CANVAS */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-10 shadow-lg text-slate-900 dark:text-white print:border-none print:shadow-none print:p-0">
        {/* REPORT HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-slate-900 dark:border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#003366] text-white flex items-center justify-center font-black text-xl shrink-0">
              HAOC
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#003366] dark:text-teal-400">
                {config.hospital_name.toUpperCase()}
              </h1>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {config.unidade_hospitalar} • Sistema Integrado de Pesagem de Resíduos
              </p>
              <p className="text-[11px] text-slate-500">
                Gerenciamento em conformidade com ANVISA RDC 222/2018 e CONAMA 358/2005
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs space-y-1">
            <div className="inline-block px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-950 text-[#003366] dark:text-teal-300 font-bold uppercase text-[11px]">
              RELATÓRIO CONSOLIDADO DE RESÍDUOS
            </div>
            <div className="text-slate-500">
              Gerado em: <strong className="text-slate-900 dark:text-white">{dataGeracao}</strong>
            </div>
            <div className="text-slate-500">
              Operador solicitante: <strong className="text-slate-900 dark:text-white">{config.default_operator}</strong>
            </div>
          </div>
        </div>

        {/* REPORT METADATA SUMMARY BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Período Analisado
            </span>
            <span className="font-extrabold text-slate-900 dark:text-white block mt-0.5">
              {periodoLabel}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total de Pesagens
            </span>
            <span className="font-black text-lg text-slate-900 dark:text-white block mt-0.5">
              {totalPesagens} lançamentos
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Peso Total Aferido
            </span>
            <span className="font-black text-xl text-emerald-700 dark:text-emerald-400 block mt-0.5">
              {formatPeso(pesoTotal)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Média por Pesagem
            </span>
            <span className="font-black text-lg text-slate-800 dark:text-slate-200 block mt-0.5">
              {formatPeso(mediaPorPesagem)}
            </span>
          </div>
        </div>

        {/* CATEGORY BREAKDOWN TABLE */}
        <div className="mb-6">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
            Consolidação por Categoria de Resíduo
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-700">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-2.5">Categoria</th>
                  <th className="px-4 py-2.5">Classificação ANVISA</th>
                  <th className="px-4 py-2.5 text-center">Nº Lançamentos</th>
                  <th className="px-4 py-2.5 text-right">Peso Total</th>
                  <th className="px-4 py-2.5 text-right">% do Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {categoriasBreakdown.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 font-bold flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: c.corHex }}
                      />
                      <span>{c.nome}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{c.grupoAnvisa}</td>
                    <td className="px-4 py-2.5 text-center font-semibold">{c.count}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {formatPeso(c.totalPeso)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-500">
                      {c.percentual.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-600">
                <tr>
                  <td className="px-4 py-3" colSpan={2}>
                    TOTAL GERAL CONSOLIDADO
                  </td>
                  <td className="px-4 py-3 text-center">{totalPesagens}</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-700 dark:text-emerald-400 text-sm">
                    {formatPeso(pesoTotal)}
                  </td>
                  <td className="px-4 py-3 text-right">100,00%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* DETAILED WEIGHINGS LOG */}
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
            Relação Detalhada dos Lançamentos no Período ({relatorioData.length} registros)
          </h3>
          <div className="overflow-x-auto max-h-96 print:max-h-none overflow-y-auto">
            <table className="w-full text-left text-[11px] border border-slate-200 dark:border-slate-700">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold border-b border-slate-200 dark:border-slate-700 sticky top-0">
                <tr>
                  <th className="px-3 py-2">Data/Hora</th>
                  <th className="px-3 py-2">ID Registro</th>
                  <th className="px-3 py-2">Tipo de Resíduo</th>
                  <th className="px-3 py-2 text-right">Peso (kg)</th>
                  <th className="px-3 py-2">Operador</th>
                  <th className="px-3 py-2">Observação / Setor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {relatorioData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                      Nenhum registro atende aos critérios deste relatório.
                    </td>
                  </tr>
                ) : (
                  relatorioData.map((p) => {
                    const cat = RESIDUO_MAP[p.tipo_residuo];
                    return (
                      <tr key={p.id}>
                        <td className="px-3 py-1.5 whitespace-nowrap">
                          {formatDateBR(p.data)} {p.hora}
                        </td>
                        <td className="px-3 py-1.5 font-mono text-[10px] text-slate-400">
                          {p.id}
                        </td>
                        <td className="px-3 py-1.5 font-bold">
                          {cat ? cat.nome : p.tipo_residuo}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {p.peso.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="px-3 py-1.5 truncate max-w-[140px]">{p.usuario}</td>
                        <td className="px-3 py-1.5 text-slate-500 truncate max-w-[200px]">
                          {p.observacao || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SIGNATURE / AUDIT FOOTER */}
        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <div className="w-48 mx-auto border-b border-slate-400 mb-2" />
            <span className="font-bold text-slate-700 dark:text-slate-300 block">
              {config.default_operator}
            </span>
            <span className="text-[10px] text-slate-400">
              Operador Responsável pela Emissão • Matrícula {config.matricula_operador}
            </span>
          </div>

          <div>
            <div className="w-48 mx-auto border-b border-slate-400 mb-2" />
            <span className="font-bold text-slate-700 dark:text-slate-300 block">
              Gestão de Resíduos & Hotelaria Hospitalar
            </span>
            <span className="text-[10px] text-slate-400">
              Hospital Alemão Oswaldo Cruz • {config.unidade_hospitalar}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
