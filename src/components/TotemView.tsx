import React, { useState } from 'react';
import { Lock, LogOut, X, AlertCircle } from 'lucide-react';
import { DeviceConfig, PesagemRecord } from '../types';
import { PesagemForm } from './PesagemForm';

interface TotemViewProps {
  config: DeviceConfig;
  onSavePesagem: (pesagem: PesagemRecord) => Promise<PesagemRecord>;
  onExitTotem: () => void;
}

export const TotemView: React.FC<TotemViewProps> = ({ config, onSavePesagem, onExitTotem }) => {
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === config.totem_pin.trim()) {
      setShowPinModal(false);
      setPinInput('');
      setPinError(false);
      onExitTotem();
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-between select-none">
      {/* Discreet top bar for Totem */}
      <div className="bg-[#003366] text-white px-4 py-2.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400/40 flex items-center justify-center font-black text-teal-300 text-xs">
            HAOC
          </div>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base leading-tight tracking-tight">
              PESAGEM DE RESÍDUOS HAOC
            </h1>
            <p className="text-[10px] text-teal-200">
              Terminal Operacional • {config.device_name} ({config.location})
            </p>
          </div>
        </div>

        {/* Lock / Exit button */}
        <button
          onClick={() => setShowPinModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition"
          title="Sair do Modo Totem (Requer Senha)"
        >
          <Lock className="w-3.5 h-3.5 text-teal-300" />
          <span className="hidden sm:inline">Administração</span>
        </button>
      </div>

      {/* Main Totem weighing form */}
      <div className="flex-1 p-2 sm:p-4">
        <PesagemForm config={config} onSavePesagem={onSavePesagem} />
      </div>

      {/* Discreet bottom footer */}
      <div className="p-2 text-center text-[10px] text-slate-400 bg-white/40 dark:bg-slate-900/40 border-t border-slate-200/50 dark:border-slate-800/50">
        Hospital Alemão Oswaldo Cruz • Modo Totem de Alta Produtividade • v{config.app_version}
      </div>

      {/* PIN Unlock Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Desbloquear Administração
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setPinInput('');
                  setPinError(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerifyPin} className="mt-4 space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Digite o PIN administrativo para sair do Modo Totem e acessar relatórios, histórico e configurações:
              </p>

              <div>
                <input
                  type="password"
                  inputMode="numeric"
                  autoFocus
                  placeholder="PIN"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  className="w-full text-center text-2xl font-mono tracking-widest p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 focus:border-teal-500 outline-hidden font-bold"
                />
                <span className="text-[10px] text-slate-400 text-center block mt-1">
                  PIN padrão do sistema: 1908
                </span>
              </div>

              {pinError && (
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-1.5 justify-center">
                  <AlertCircle className="w-4 h-4" />
                  <span>PIN incorreto. Tente novamente.</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-[#003366] hover:bg-[#002244] text-white font-bold text-xs shadow-md"
                >
                  Desbloquear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
