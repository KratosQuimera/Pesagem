import React, { useState, useEffect, useRef } from 'react';
import {
  Trash2,
  Recycle,
  Sprout,
  FlaskConical,
  Biohazard,
  Syringe,
  Boxes,
  Disc,
  Activity,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Clock,
  Calendar,
  Building,
  User,
  Plus,
  Delete,
  Weight,
} from 'lucide-react';
import { TipoResiduoId, PesagemRecord, DeviceConfig } from '../types';
import { RESIDUO_CATEGORIAS, RESIDUO_MAP } from '../services/config';
import { formatPeso, parsePesoInput, validarPeso, formatDateBR, formatTimeBR } from '../utils/formatters';

interface PesagemFormProps {
  config: DeviceConfig;
  onSavePesagem: (pesagem: PesagemRecord) => Promise<PesagemRecord>;
}

export const PesagemForm: React.FC<PesagemFormProps> = ({ config, onSavePesagem }) => {
  const [selectedTipo, setSelectedTipo] = useState<TipoResiduoId | null>(null);
  const [pesoInput, setPesoInput] = useState<string>('');
  const [observacao, setObservacao] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successRecord, setSuccessRecord] = useState<PesagemRecord | null>(null);
  const [countdown, setCountdown] = useState<number>(config.auto_reset_seconds || 3);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep a live clock for current time display
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle countdown on success screen
  useEffect(() => {
    if (!successRecord) return;

    setCountdown(config.auto_reset_seconds || 3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleNovaPesagem();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [successRecord]);

  const handleNovaPesagem = () => {
    setSuccessRecord(null);
    setSelectedTipo(null);
    setPesoInput('');
    setObservacao('');
    setErrorMessage(null);
    setIsSubmitting(false);
  };

  const handleQuickAdd = (amount: number) => {
    const current = parsePesoInput(pesoInput);
    const updated = (current + amount).toFixed(2);
    setPesoInput(updated.replace('.', ','));
  };

  const handleKeypadPress = (val: string) => {
    if (val === 'CLEAR') {
      setPesoInput('');
      return;
    }
    if (val === 'BACKSPACE') {
      setPesoInput((prev) => prev.slice(0, -1));
      return;
    }
    if (val === ',') {
      if (!pesoInput.includes(',') && !pesoInput.includes('.')) {
        setPesoInput((prev) => (prev === '' ? '0,' : prev + ','));
      }
      return;
    }

    // Limit decimal places to 2
    const commaIndex = Math.max(pesoInput.indexOf(','), pesoInput.indexOf('.'));
    if (commaIndex !== -1 && pesoInput.substring(commaIndex + 1).length >= 2) {
      return; // Already 2 decimals
    }

    // Prevent excessive leading zeros
    if (pesoInput === '0' && val !== ',') {
      setPesoInput(val);
      return;
    }

    setPesoInput((prev) => prev + val);
  };

  const parsedPeso = parsePesoInput(pesoInput);
  const isFormValid = selectedTipo !== null && parsedPeso > 0 && !isSubmitting;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return; // Prevent double submission

    if (!selectedTipo) {
      setErrorMessage('Por favor, selecione o Tipo de Resíduo.');
      return;
    }

    const { valido, mensagem, valor } = validarPeso(pesoInput);
    if (!valido) {
      setErrorMessage(mensagem || 'Informe um peso válido maior que zero.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const dataStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const horaStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      const id = `HAOC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const newRecord: PesagemRecord = {
        id,
        data: dataStr,
        hora: horaStr,
        timestamp: now.getTime(),
        tipo_residuo: selectedTipo,
        peso: valor,
        unidade: 'kg',
        usuario: config.default_operator || 'Operador HAOC',
        observacao: observacao.trim() || undefined,
        device_id: config.device_id,
        device_name: config.device_name,
        location: config.location,
        sync_status: 'local',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      const saved = await onSavePesagem(newRecord);
      setSuccessRecord(saved);
    } catch (err: unknown) {
      console.error('Error saving pesagem:', err);
      setErrorMessage('Erro ao gravar pesagem no banco de dados. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  // Render appropriate Lucide icon by name
  const renderIcon = (iconName: string, className = 'w-6 h-6') => {
    switch (iconName) {
      case 'Trash2':
        return <Trash2 className={className} />;
      case 'Recycle':
        return <Recycle className={className} />;
      case 'Sprout':
        return <Sprout className={className} />;
      case 'FlaskConical':
        return <FlaskConical className={className} />;
      case 'Biohazard':
        return <Biohazard className={className} />;
      case 'Syringe':
        return <Syringe className={className} />;
      case 'Boxes':
        return <Boxes className={className} />;
      case 'Disc':
        return <Disc className={className} />;
      case 'Activity':
        return <Activity className={className} />;
      case 'Cpu':
        return <Cpu className={className} />;
      default:
        return <Trash2 className={className} />;
    }
  };

  // --- SUCCESS CONFIRMATION SCREEN ---
  if (successRecord) {
    const cat = RESIDUO_MAP[successRecord.tipo_residuo];
    return (
      <div className="max-w-2xl mx-auto py-6 px-4 animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-xl border border-emerald-200 dark:border-emerald-900/60 text-center relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -right-20 -top-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Success Checkmark */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mb-5 ring-8 ring-emerald-50 dark:ring-emerald-900/30">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            PESAGEM REGISTRADA COM SUCESSO
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Registro gravado com segurança no banco local • ID: <span className="font-mono">{successRecord.id}</span>
          </p>

          {/* Summary Card */}
          <div className="mt-6 p-5 sm:p-6 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-left">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Tipo de Resíduo
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat ? cat.corHex : '#003366' }}
                  />
                  <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    {cat ? cat.nome : successRecord.tipo_residuo}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {cat ? cat.grupoAnvisa : '-'}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Peso Aferido
                </span>
                <span className="font-black text-2xl sm:text-3xl text-emerald-600 dark:text-emerald-400 tracking-tight block mt-0.5">
                  {formatPeso(successRecord.peso)}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Data e Hora
                </span>
                <span className="font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300 block mt-0.5">
                  {formatDateBR(successRecord.data)} às {successRecord.hora}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Operador / Dispositivo
                </span>
                <span className="font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300 block mt-0.5 truncate">
                  {successRecord.usuario}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate block">
                  {successRecord.device_name || config.device_name}
                </span>
              </div>
            </div>

            {successRecord.observacao && (
              <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-400 dark:text-slate-500">Obs: </span>
                {successRecord.observacao}
              </div>
            )}
          </div>

          {/* Action button & Countdown bar */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleNovaPesagem}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#003366] hover:bg-[#002244] text-white font-bold text-sm shadow-lg shadow-blue-950/20 flex items-center justify-center gap-2 active:scale-98 transition"
            >
              <RotateCcw className="w-4 h-4 text-teal-300" />
              <span>NOVA PESAGEM</span>
            </button>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
            Retornando automaticamente à tela de pesagem em <strong className="text-teal-600 dark:text-teal-400">{countdown}s</strong>...
          </p>
        </div>
      </div>
    );
  }

  // --- MAIN WEIGHING SCREEN ---
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
      {/* Top hospital info pill */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 bg-white/70 dark:bg-slate-900/60 p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-slate-800 dark:text-slate-200">Terminal Ativo:</span>
          <span className="text-slate-600 dark:text-slate-400">{config.location}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1 font-medium">
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            {formatDateBR(currentTime)}
          </span>
          <span className="flex items-center gap-1 font-mono font-semibold text-slate-700 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            {formatTimeBR(currentTime)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: CATEGORY SELECTION (10 CARDS) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="w-2 h-4 bg-teal-600 rounded-xs" />
              1. SELECIONE O TIPO DE RESÍDUO
            </h2>
            {selectedTipo && (
              <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                Item Selecionado
              </span>
            )}
          </div>

          {/* Grid of 10 large touchscreen cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {RESIDUO_CATEGORIAS.map((cat) => {
              const isSelected = selectedTipo === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedTipo(cat.id);
                    setErrorMessage(null);
                    // Focus weight input on desktop
                    if (window.innerWidth > 768 && inputRef.current) {
                      inputRef.current.focus();
                    }
                  }}
                  className={`group relative text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex flex-col justify-between min-h-[96px] sm:min-h-[110px] cursor-pointer select-none active:scale-98 ${
                    isSelected
                      ? 'border-[#003366] dark:border-teal-400 bg-blue-50/90 dark:bg-slate-800/90 shadow-md ring-3 ring-blue-500/20'
                      : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-slate-300 hover:shadow-xs'
                  }`}
                  style={{
                    borderLeftColor: cat.corHex,
                    borderLeftWidth: '6px',
                  }}
                >
                  <div className="flex items-start justify-between gap-1 w-full">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: cat.corHex }}
                      >
                        {renderIcon(cat.icone, 'w-4 h-4 sm:w-5 sm:h-5')}
                      </div>
                      <div>
                        <span className="block font-black text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                          {cat.nome}
                        </span>
                        <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          {cat.grupoAnvisa}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#003366] dark:bg-teal-500 text-white flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-1 leading-snug">
                    {cat.subtitulo}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: WEIGHT ENTRY, NUMERIC KEYPAD & REGISTRATION */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-md">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="w-2 h-4 bg-teal-600 rounded-xs" />
                2. INFORME O PESO
              </h2>
              {selectedTipo ? (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {RESIDUO_MAP[selectedTipo]?.nome}
                </span>
              ) : (
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  Selecione o resíduo ao lado
                </span>
              )}
            </div>

            {/* Big Numeric Display */}
            <div className="relative mb-3">
              <div className="relative flex items-center rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 focus-within:border-teal-500 dark:focus-within:border-teal-400 p-3 shadow-inner transition-all">
                <Weight className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400 dark:text-slate-500 mr-2 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={pesoInput}
                  onChange={(e) => {
                    // Allow only digits, comma, period
                    const val = e.target.value.replace(/[^0-9.,]/g, '');
                    setPesoInput(val);
                    setErrorMessage(null);
                  }}
                  className="w-full bg-transparent text-right font-black text-3xl sm:text-4xl text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 outline-hidden font-mono tracking-tight"
                />
                <span className="text-lg sm:text-xl font-bold text-slate-500 dark:text-slate-400 ml-2 select-none">
                  kg
                </span>
              </div>

              {parsedPeso > 0 && (
                <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1 px-1">
                  <span>Valor validado:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatPeso(parsedPeso)}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Add Chips */}
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {[0.5, 1.0, 5.0, 10.0].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickAdd(amt)}
                  className="py-1.5 px-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition active:scale-95 flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3 text-teal-600" />
                  <span>{amt >= 1 ? `${amt.toFixed(0)} kg` : `${amt} kg`}</span>
                </button>
              ))}
            </div>

            {/* On-screen Touchpad (crucial for Tablet / Touchscreen kiosks) */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLEAR', '0', ','].map((btn) => {
                if (btn === 'CLEAR') {
                  return (
                    <button
                      key={btn}
                      type="button"
                      onClick={() => handleKeypadPress('CLEAR')}
                      className="py-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs active:scale-95 transition"
                    >
                      LIMPAR
                    </button>
                  );
                }
                return (
                  <button
                    key={btn}
                    type="button"
                    onClick={() => handleKeypadPress(btn)}
                    className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-base sm:text-lg active:scale-95 transition shadow-2xs"
                  >
                    {btn}
                  </button>
                );
              })}
            </div>

            {/* Backspace button */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => handleKeypadPress('BACKSPACE')}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-98"
              >
                <Delete className="w-4 h-4" />
                <span>Apagar Último Dígito</span>
              </button>
            </div>

            {/* Observação / Setor (Opcional) */}
            <div className="mb-3">
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Observação / Setor Hospitalar (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Centro Cirúrgico, UTI Adulto, Bloco B..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-hidden focus:border-teal-500"
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-2.5 mb-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* MAIN ACTION: REGISTRAR PESAGEM */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={!isFormValid}
              className={`w-full py-4 rounded-2xl font-black text-sm sm:text-base tracking-wide uppercase transition-all shadow-lg flex items-center justify-center gap-2 select-none ${
                isFormValid
                  ? 'bg-gradient-to-r from-[#003366] via-[#088395] to-[#00A896] hover:brightness-110 text-white shadow-blue-900/30 cursor-pointer active:scale-98'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>SALVANDO REGISTRO...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-teal-300" />
                  <span>REGISTRAR PESAGEM</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 mt-2 font-medium">
              Data, hora e operador serão salvos automaticamente no banco local
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
