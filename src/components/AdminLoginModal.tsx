import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  X,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AdminLoginModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, login, setActiveTab, currentUser } = useApp();
  const [username, setUsername] = useState('admin');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setIsAuthModalOpen(false);
    setPin('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!pin) {
      setErrorMessage('Masukkan PIN Administrator (Demo: 1234)');
      return;
    }

    const result = login(username, pin, 'Semua Shift (Owner / Apoteker)');
    if (result.success) {
      setSuccessMessage('Login Administrator berhasil! Mengalihkan ke Dashboard...');
      setTimeout(() => {
        setIsAuthModalOpen(false);
        setActiveTab('dashboard');
        setPin('');
        setSuccessMessage('');
      }, 700);
    } else {
      setErrorMessage(result.message);
      setPin('');
    }
  };

  const handleQuickDemo = () => {
    setUsername('admin');
    setPin('1234');
    setErrorMessage('');
  };

  return (
    <div
      id="admin-login-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in"
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-900 via-slate-900 to-indigo-950 p-6 text-white relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center mb-3 text-purple-300">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-bold tracking-tight">Login Administrator / Owner</h3>
          <p className="text-xs text-purple-200 mt-1">
            Autentikasi diperlukan sebelum masuk menu Dashboard dan melihat data keuangan apotek.
          </p>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current user badge info */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">Sesi Saat Ini:</span>
            <span className="font-semibold text-slate-800">
              {currentUser.name} ({currentUser.role.toUpperCase()})
            </span>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Username Administrator:
            </label>
            <div className="relative">
              <input
                id="modal-admin-username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setErrorMessage('');
                }}
                required
                placeholder="admin"
                className="w-full text-xs font-bold pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
              <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* PIN */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              PIN Keamanan Admin (Demo: 1234):
            </label>
            <div className="relative">
              <input
                id="modal-admin-pin"
                type={showPin ? 'text' : 'password'}
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setErrorMessage('');
                }}
                autoFocus
                placeholder="Masukkan PIN 4-digit..."
                className="w-full text-center tracking-widest text-lg font-bold pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Feedback */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            id="btn-confirm-admin-login-modal"
            type="submit"
            className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all shadow-md shadow-purple-900/20 flex items-center justify-center gap-2"
          >
            <span>Login Admin & Buka Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Quick Demo Button */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Isi Otomatis (PIN: 1234)</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
