import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertCircle, X, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SupervisorPinModal: React.FC = () => {
  const { supervisorPrompt, closeSupervisorPrompt, verifyAdminPin } = useApp();
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!supervisorPrompt.isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) {
      setError('Masukkan PIN Administrator');
      return;
    }

    const isValid = verifyAdminPin(pin);
    if (isValid) {
      setError('');
      setPin('');
      const action = supervisorPrompt.onSuccess;
      closeSupervisorPrompt();
      if (action) action();
    } else {
      setError('PIN Administrator salah! Otorisasi ditolak.');
      setPin('');
    }
  };

  const handleClose = () => {
    setPin('');
    setError('');
    closeSupervisorPrompt();
  };

  return (
    <div
      id="supervisor-pin-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in"
    >
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-purple-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Otorisasi Supervisor / Admin</h3>
              <p className="text-[11px] text-purple-200">Hak Akses Khusus Diperlukan</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <p className="text-xs font-bold text-slate-800">{supervisorPrompt.title}</p>
            <p className="text-xs text-slate-500 mt-1">{supervisorPrompt.description}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Masukkan PIN Admin (Demo: 1234):
            </label>
            <div className="relative">
              <input
                id="supervisor-pin-input"
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                autoFocus
                placeholder="PIN 4-digit..."
                className="w-full text-center tracking-widest text-lg font-bold py-2.5 px-3 rounded-xl border border-slate-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>

            {error && (
              <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              id="btn-confirm-supervisor-pin"
              type="submit"
              className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-purple-900/20"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Verifikasi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
