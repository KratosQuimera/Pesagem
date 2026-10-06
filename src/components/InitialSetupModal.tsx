import React, { useState } from 'react';
import { Laptop, MapPin, CheckCircle2, Shield } from 'lucide-react';
import { DeviceConfig } from '../types';

interface InitialSetupModalProps {
  config: DeviceConfig;
  onComplete: (updated: DeviceConfig) => void;
}

export const InitialSetupModal: React.FC<InitialSetupModalProps> = ({ config, onComplete }) => {
  const [deviceName, setDeviceName] = useState(config.device_name || 'Tablet Pesagem 01');
  const [location, setLocation] = useState(config.location || 'Área Central de Resíduos - Subsolo');
  const [operator, setOperator] = useState(config.default_operator || 'Operador de Higiene e Resíduos');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName.trim() || !location.trim()) {
      alert('Por favor preencha o nome do dispositivo e o local.');
      return;
    }

    onComplete({
      ...config,
      device_name: deviceName.trim(),
      location: location.trim(),
      default_operator: operator.trim() || config.default_operator,
      setup_completed: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300 select-none">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-[#003366] text-white flex items-center justify-center shrink-0 shadow-md">
            <Laptop className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest block">
              Primeira Execução
            </span>
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
              CONFIGURAÇÃO DO DISPOSITIVO
            </h2>
            <p className="text-xs text-slate-500">
              Hospital Alemão Oswaldo Cruz • Identificação do Terminal
            </p>
          </div>
        </div>

        {/* Instructions */}
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
          Para garantir a rastreabilidade hospitalar exigida pela ANVISA, identifique este tablet ou computador antes de iniciar os registros de pesagem:
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nome do Dispositivo:
            </label>
            <div className="relative">
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="Ex: Tablet Pesagem 01"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-semibold text-sm outline-hidden focus:border-teal-500"
                required
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Exemplo: Tablet Pesagem 01, Balança 02 - Triagem, Terminal Central
            </span>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Localização Física / Posto de Pesagem:
            </label>
            <div className="relative">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Área de Resíduos - Subsolo 1"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-semibold text-sm outline-hidden focus:border-teal-500"
                required
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Exemplo: Área de Resíduos, Expedição Bloco B, DML 3º Andar
            </span>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Operador Padrão:
            </label>
            <input
              type="text"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              placeholder="Ex: Operador de Higiene e Meio Ambiente"
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-semibold text-sm outline-hidden focus:border-teal-500"
            />
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#003366] hover:bg-[#002244] text-white font-black text-sm uppercase tracking-wide shadow-lg shadow-blue-950/20 flex items-center justify-center gap-2 transition active:scale-98"
            >
              <CheckCircle2 className="w-5 h-5 text-teal-400" />
              <span>CONCLUIR CONFIGURAÇÃO E INICIAR</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
