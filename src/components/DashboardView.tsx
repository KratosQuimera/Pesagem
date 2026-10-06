import React, { useMemo, useState } from 'react';
import {
  Weight,
  Calendar,
  Layers,
  TrendingUp,
  BarChart3,
  PieChart,
  Trash2,
  Sparkles,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { PesagemRecord, DeviceConfig } from '../types';
import { RESIDUO_CATEGORIAS, RESIDUO_MAP } from '../services/config';
import { formatPeso, formatDateBR } from '../utils/formatters';

interface DashboardViewProps {
  pesagens: PesagemRecord[];
  config: DeviceConfig;
  onClearDemoData: () => Promise<number>;
  onSeedDemoData: () => Promise<number>;
  onRefresh: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  pesagens,
  config,
  onClearDemoData,
  onSeedDemoData,
  onRefresh,
}) => {
  const [filterDays, setFilterDays] = useState<number>(30); // 7, 14, 30 or 0 (all)
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  // Demo records check
  const demoCount = useMemo(() => pesagens.filter((p) => p.is_demo).length, [pesagens]);

  // Date boundaries
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const currentMonthPrefix = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;

  // Filtered dataset for charts
  const relevantPesagens = useMemo(() => {
    if (filterDays === 0) return pesagens;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - filterDays);
    return pesagens.filter((p) => new Date(p.timestamp) >= cutoff);
  }, [pesagens, filterDays]);

  // 1. KPI: Peso Total Hoje
  const pesoTotalHoje = useMemo(() => {
    return pesagens
      .filter((p) => p.data === todayStr)
      .reduce((sum, p) => sum + p.peso, 0);
  }, [pesagens, todayStr]);

  // 2. KPI: Peso Total do Mês
  const pesoTotalMes = useMemo(() => {
    return pesagens
      .filter((p) => p.data.startsWith(currentMonthPrefix))
      .reduce((sum, p) => sum + p.peso, 0);
  }, [pesagens, currentMonthPrefix]);

  // 3. KPI: Total de Pesagens
  const totalPesagens = pesagens.length;

  // 4. KPI: Média por Pesagem
  const mediaPorPesagem = useMemo(() => {
    if (totalPesagens === 0) return 0;
    const totalGeral = pesagens.reduce((sum, p) => sum + p.peso, 0);
    return totalGeral / totalPesagens;
  }, [pesagens, totalPesagens]);

  // RESUMO POR RESÍDUO (Tabela ordenada pelo peso total decrescente)
  const resumoPorResiduo = useMemo(() => {
    const map: Record<string, { count: number; pesoTotal: number }> = {};

    RESIDUO_CATEGORIAS.forEach((cat) => {
      map[cat.id] = { count: 0, pesoTotal: 0 };
    });

    relevantPesagens.forEach((p) => {
      if (!map[p.tipo_residuo]) {
        map[p.tipo_residuo] = { count: 0, pesoTotal: 0 };
      }
      map[p.tipo_residuo].count += 1;
      map[p.tipo_residuo].pesoTotal += p.peso;
    });

    const list = Object.keys(map).map((id) => {
      const cat = RESIDUO_MAP[id as keyof typeof RESIDUO_MAP];
      return {
        id,
        nome: cat ? cat.nome : id,
        grupoAnvisa: cat ? cat.grupoAnvisa : '-',
        corHex: cat ? cat.corHex : '#003366',
        quantidade: map[id].count,
        pesoTotal: map[id].pesoTotal,
      };
    });

    // Sort by peso total descending
    return list.sort((a, b) => b.pesoTotal - a.pesoTotal);
  }, [relevantPesagens]);

  const totalPeriodoPeso = useMemo(() => {
    return resumoPorResiduo.reduce((sum, r) => sum + r.pesoTotal, 0);
  }, [resumoPorResiduo]);

  // Daily evolution over the last days for timeline chart
  const timelineData = useMemo(() => {
    const daysCount = filterDays === 0 ? 30 : filterDays;
    const daysMap: Record<string, number> = {};

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      daysMap[dStr] = 0;
    }

    relevantPesagens.forEach((p) => {
      if (daysMap[p.data] !== undefined) {
        daysMap[p.data] += p.peso;
      }
    });

    return Object.entries(daysMap).map(([data, peso]) => ({
      data,
      label: formatDateBR(data).substring(0, 5), // DD/MM
      peso,
    }));
  }, [relevantPesagens, filterDays]);

  const maxTimelinePeso = useMemo(() => {
    const max = Math.max(...timelineData.map((d) => d.peso), 10);
    return max * 1.15; // 15% headroom
  }, [timelineData]);

  const handleClearDemo = async () => {
    if (!confirm('Deseja realmente remover todos os dados fictícios de demonstração?')) return;
    setIsClearing(true);
    try {
      await onClearDemoData();
      onRefresh();
    } finally {
      setIsClearing(false);
    }
  };

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      await onSeedDemoData();
      onRefresh();
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
      {/* Title & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            DASHBOARD DE PESAGEM
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Métricas analíticas, indicadores hospitalares e evolução de resíduos
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeline Period Selector */}
          <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <span className="px-2 font-bold text-slate-400">Período:</span>
            {[
              { label: '7d', val: 7 },
              { label: '14d', val: 14 },
              { label: '30d', val: 30 },
              { label: 'Tudo', val: 0 },
            ].map((p) => (
              <button
                key={p.val}
                onClick={() => setFilterDays(p.val)}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  filterDays === p.val
                    ? 'bg-[#003366] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Demo Data Management */}
          {demoCount > 0 ? (
            <button
              onClick={handleClearDemo}
              disabled={isClearing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-bold transition"
              title="Remover dados fictícios de teste"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>LIMPAR DADOS DE DEMONSTRAÇÃO ({demoCount})</span>
            </button>
          ) : (
            <button
              onClick={handleSeedDemo}
              disabled={isSeeding}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Gerar Dados de Teste</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 MAIN KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: PESO TOTAL HOJE */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              PESO TOTAL HOJE
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#003366] dark:text-blue-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight block">
              {formatPeso(pesoTotalHoje)}
            </span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3 text-teal-600" /> Atualizado em tempo real
            </span>
          </div>
        </div>

        {/* Card 2: PESO TOTAL DO MÊS */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              PESO TOTAL DO MÊS
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Weight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-teal-700 dark:text-teal-400 font-mono tracking-tight block">
              {formatPeso(pesoTotalMes)}
            </span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
              Mês corrente ({now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })})
            </span>
          </div>
        </div>

        {/* Card 3: TOTAL DE PESAGENS */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              TOTAL DE PESAGENS
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight block">
              {totalPesagens}
            </span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
              Lançamentos registrados no banco
            </span>
          </div>
        </div>

        {/* Card 4: MÉDIA POR PESAGEM */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              MÉDIA POR PESAGEM
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight block">
              {formatPeso(mediaPorPesagem)}
            </span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
              Média ponderada geral
            </span>
          </div>
        </div>
      </div>

      {/* 2 CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        {/* CHART 1: PESO POR TIPO DE RESÍDUO */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-600" />
                PESO POR TIPO DE RESÍDUO
              </h3>
              <p className="text-[11px] text-slate-400">
                Distribuição percentual e em quilogramas no período
              </p>
            </div>
          </div>

          {/* Horizontal Distribution Bars */}
          <div className="space-y-3 pt-2">
            {resumoPorResiduo.filter((r) => r.pesoTotal > 0 || r.quantidade > 0).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">
                Sem registros no período selecionado.
              </p>
            ) : (
              resumoPorResiduo.map((item) => {
                const pct = totalPeriodoPeso > 0 ? (item.pesoTotal / totalPeriodoPeso) * 100 : 0;
                return (
                  <div key={item.id} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.corHex }}
                        />
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {item.nome}
                        </span>
                        <span className="text-[10px] text-slate-400">({item.quantidade}x)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatPeso(item.pesoTotal)}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 w-10 text-right">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Bar background */}
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(pct, 1)}%`,
                          backgroundColor: item.corHex,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CHART 2: EVOLUÇÃO DAS PESAGENS AO LONGO DO TEMPO */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  EVOLUÇÃO TEMPORAL DAS PESAGENS
                </h3>
                <p className="text-[11px] text-slate-400">
                  Total descartado por dia (kg)
                </p>
              </div>
            </div>

            {/* SVG Line / Bar Chart */}
            <div className="h-56 w-full pt-4 pb-2">
              <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00A896" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#00A896" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal reference grid lines */}
                <line x1="0" y1="40" x2="500" y2="40" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
                <line x1="0" y1="90" x2="500" y2="90" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
                <line x1="0" y1="140" x2="500" y2="140" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
                <line x1="0" y1="180" x2="500" y2="180" stroke="currentColor" strokeOpacity="0.15" />

                {/* Draw Area & Points */}
                {(() => {
                  const points = timelineData.map((d, idx) => {
                    const x = (idx / (timelineData.length - 1 || 1)) * 480 + 10;
                    const y = 180 - (d.peso / maxTimelinePeso) * 150;
                    return { x, y, ...d };
                  });

                  const pathD = points.reduce((acc, p, idx) => {
                    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                  }, '');

                  const areaD = `${pathD} L ${points[points.length - 1]?.x || 490} 180 L ${points[0]?.x || 10} 180 Z`;

                  return (
                    <g>
                      {/* Area Fill */}
                      <path d={areaD} fill="url(#areaGrad)" />
                      {/* Line */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#00A896"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Dots */}
                      {points.map((p, idx) => (
                        <circle
                          key={idx}
                          cx={p.x}
                          cy={p.y}
                          r={p.peso > 0 ? 4 : 2}
                          className="fill-[#003366] dark:fill-teal-300 stroke-white dark:stroke-slate-900"
                          strokeWidth="2"
                        />
                      ))}
                    </g>
                  );
                })()}
              </svg>
            </div>
          </div>

          {/* Timeline X-axis Labels */}
          <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>{timelineData[0]?.label || '-'}</span>
            <span>{timelineData[Math.floor(timelineData.length / 2)]?.label || '-'}</span>
            <span>{timelineData[timelineData.length - 1]?.label || '-'}</span>
          </div>
        </div>
      </div>

      {/* 12. TABELA RESUMO POR RESÍDUO */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              RESUMO POR RESÍDUO (ORDENADO POR PESO TOTAL)
            </h3>
            <p className="text-[11px] text-slate-400">
              Consolidação quantitativa e volumétrica das categorias
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 select-none">
              <tr>
                <th className="px-4 py-3">Resíduo</th>
                <th className="px-4 py-3">Classificação ANVISA</th>
                <th className="px-4 py-3 text-center">Quantidade</th>
                <th className="px-4 py-3 text-right">Peso Total</th>
                <th className="px-4 py-3 text-right">% do Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {resumoPorResiduo.map((item) => {
                const pct = totalPeriodoPeso > 0 ? (item.pesoTotal / totalPeriodoPeso) * 100 : 0;
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: item.corHex }}
                        />
                        <span className="font-bold text-slate-900 dark:text-white">
                          {item.nome}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-medium">{item.grupoAnvisa}</td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                      {item.quantidade}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400">
                      {formatPeso(item.pesoTotal)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-500">
                      {pct.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-100/90 dark:bg-slate-800 font-bold text-slate-900 dark:text-white border-t-2 border-slate-200 dark:border-slate-700">
              <tr>
                <td className="px-4 py-3">TOTAL GERAL</td>
                <td className="px-4 py-3">-</td>
                <td className="px-4 py-3 text-center">
                  {resumoPorResiduo.reduce((sum, r) => sum + r.quantidade, 0)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-emerald-700 dark:text-emerald-400 text-sm">
                  {formatPeso(totalPeriodoPeso)}
                </td>
                <td className="px-4 py-3 text-right">100,00%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
