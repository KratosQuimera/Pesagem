import React, { useState } from 'react';
import {
  Settings,
  Building,
  Laptop,
  User,
  Shield,
  Palette,
  CheckCircle2,
  Lock,
  Layers,
  Info,
  Save,
  Clock,
  Tv,
} from 'lucide-react';
import { DeviceConfig } from '../types';
import { RESIDUO_CATEGORIAS, UNIDADES_HOSPITALARES, APP_VERSION } from '../services/config';

interface ConfiguracoesViewProps {
  config: DeviceConfig;
  onSaveConfig: (newConfig: DeviceConfig) => Promise<DeviceConfig>;
}

export const ConfiguracoesView: React.FC<ConfiguracoesViewProps> = ({ config, onSaveConfig }) => {
  const [formData, setFormData] = useState<DeviceConfig>({ ...config });
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveConfig(formData);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            CONFIGURAÇÕES DO SISTEMA
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Parâmetros do terminal, operador padrão, dados do hospital e segurança
          </p>
        </div>
        <span className="px-3 py-1 rounded-xl bg-blue-100 dark:bg-blue-950 text-[#003366] dark:text-teal-400 font-mono font-bold text-xs border border-blue-200 dark:border-blue-900">
          Versão {APP_VERSION}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: IDENTIFICAÇÃO DO DISPOSITIVO */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Laptop className="w-5 h-5 text-teal-600" />
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white uppercase tracking-wider">
              Identificação do Dispositivo / Tablet
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                ID do Dispositivo (device_id):
              </label>
              <input
                type="text"
                value={formData.device_id}
                onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono font-semibold"
                placeholder="Ex: TABLET-001"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Identificador único de telemetria e sincronização futura
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nome Amigável do Dispositivo:
              </label>
              <input
                type="text"
                value={formData.device_name}
                onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-semibold"
                placeholder="Ex: Tablet Pesagem 01"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Localização Física / Posto de Coleta:
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-semibold"
                placeholder="Ex: Área Central de Resíduos - Bloco B"
                required
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: DADOS DO HOSPITAL & UNIDADE */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Building className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white uppercase tracking-wider">
              Instituição & Unidade Hospitalar
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nome da Instituição:
              </label>
              <input
                type="text"
                value={formData.hospital_name}
                onChange={(e) => setFormData({ ...formData, hospital_name: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-semibold"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Unidade Hospitalar:
              </label>
              <select
                value={formData.unidade_hospitalar}
                onChange={(e) => setFormData({ ...formData, unidade_hospitalar: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-semibold outline-hidden"
              >
                {UNIDADES_HOSPITALARES.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: OPERADOR & SEGURANÇA */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <User className="w-5 h-5 text-purple-600" />
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white uppercase tracking-wider">
              Operador Padrão & Segurança do Totem
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Operador Padrão de Lançamento:
              </label>
              <input
                type="text"
                value={formData.default_operator}
                onChange={(e) => setFormData({ ...formData, default_operator: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-semibold"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Matrícula / Identificação:
              </label>
              <input
                type="text"
                value={formData.matricula_operador}
                onChange={(e) => setFormData({ ...formData, matricula_operador: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                PIN de Desbloqueio do Modo Totem:
              </label>
              <input
                type="password"
                maxLength={8}
                value={formData.totem_pin}
                onChange={(e) => setFormData({ ...formData, totem_pin: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono font-bold tracking-widest"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Padrão: 1908 (Fundação HAOC)
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 4: FLUXO DE PESAGEM & TEMPO */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Clock className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white uppercase tracking-wider">
              Tempo de Exibição & Retorno Automático
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Segundos na tela de confirmação antes de reiniciar:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="2"
                  max="10"
                  step="1"
                  value={formData.auto_reset_seconds}
                  onChange={(e) =>
                    setFormData({ ...formData, auto_reset_seconds: Number(e.target.value) })
                  }
                  className="w-full accent-teal-600 cursor-pointer"
                />
                <span className="font-mono font-bold text-sm w-12 text-right text-teal-600">
                  {formData.auto_reset_seconds}s
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Agiliza o processo para a próxima pesagem sem toques extras
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
              <strong>Arquitetura Centralizada:</strong> Os 10 tipos de resíduos e suas classificações (CONAMA / ANVISA) são padronizados centralmente em <code>src/services/config.ts</code>, garantindo rastreabilidade sem dispersão de código.
            </div>
          </div>
        </div>

        {/* SAVE BUTTON & STATUS */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {isSaved && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              Configurações gravadas com sucesso!
            </span>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 rounded-2xl bg-[#003366] hover:bg-[#002244] text-white font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-blue-950/20 flex items-center gap-2 cursor-pointer active:scale-98 transition"
          >
            <Save className="w-4 h-4 text-teal-300" />
            <span>{isSaving ? 'Gravando...' : 'SALVAR CONFIGURAÇÕES'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
