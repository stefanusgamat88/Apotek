import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  Delete,
  Store,
  Clock,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LockScreenModal: React.FC = () => {
  const {
    isLocked,
    currentUser,
    users,
    unlockSession,
    settings,
  } = useApp();

  const [pin, setPin] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input whenever screen locks
  useEffect(() => {
    if (isLocked) {
      setPin('');
      setErrorMessage('');
      setSuccessMessage('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isLocked, currentUser]);

  // Realtime clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setCurrentDate(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleKeyPress = (digit: string) => {
    if (pin.length < 16) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMessage('');

      // Auto-unlock if nextPin matches currentUser.pin or default '1234'
      if (nextPin === currentUser.pin || (nextPin === '1234' && currentUser.role === 'admin')) {
        setTimeout(() => {
          handleSubmit(undefined, nextPin);
        }, 120);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMessage('');
  };

  const handleSubmit = (e?: React.FormEvent, overridePin?: string) => {
    if (e) e.preventDefault();

    // If an explicit override pin is passed (e.g. from Auto-Unlock button), use it.
    // Otherwise use current typed pin. If typed pin is empty, default to currentUser.pin or '1234'.
    const pinToSubmit = (overridePin !== undefined ? overridePin : pin).trim() || currentUser.pin || '1234';

    const result = unlockSession(currentUser.id, pinToSubmit);
    if (!result.success) {
      setErrorMessage(result.message || 'PIN pembuka kunci salah. Silakan coba lagi.');
      setPin('');
      inputRef.current?.focus();
    } else {
      setSuccessMessage(result.message || 'Layar berhasil dibuka!');
      setErrorMessage('');
      setPin('');
    }
  };

  const handleQuickUnlock = () => {
    const targetPin = currentUser.pin || '1234';
    setPin(targetPin);
    handleSubmit(undefined, targetPin);
  };

  // Keyboard navigation & Enter submission
  useEffect(() => {
    if (!isLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPin('');
        setErrorMessage('');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, pin, currentUser]);

  // CRITICAL: Do not render when session is not locked
  if (!isLocked) {
    return null;
  }

  return (
    <div
      id="lock-screen-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header with Pharmacy brand */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-2 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
            <Lock className="w-3 h-3" />
            <span>Layar Terkunci</span>
          </div>

          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mb-3 text-emerald-400 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-bold tracking-tight">{settings.pharmacyName}</h2>
          <p className="text-xs text-slate-300 mt-0.5 flex items-center justify-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sistem Kasir POS & Farmasi</span>
          </p>

          <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
            <span>{currentDate}</span>
            <span className="font-mono font-bold text-emerald-300 text-sm">{currentTime} WIB</span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          {/* Active personal user info banner */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500/50 shadow-xs"
              />
              <div>
                <p className="text-xs font-bold text-slate-800">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500">
                  Pemilik Apotek / Apoteker Pengelola (Personal)
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-200">
              Admin Personal
            </span>
          </div>

          {/* Form input field with show/hide password toggle */}
          <form onSubmit={(e) => handleSubmit(e)} className="space-y-2">
            <label className="block text-center text-xs font-semibold text-slate-600">
              Masukkan PIN atau Sandi Pemilik
            </label>

            <div className="relative max-w-xs mx-auto">
              <input
                ref={inputRef}
                id="input-lockscreen-pin"
                type={showPassword ? 'text' : 'password'}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Ketik PIN / Sandi..."
                className="w-full text-center tracking-widest text-lg font-bold font-mono py-2.5 px-10 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-hidden transition-all bg-slate-50 focus:bg-white"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                title={showPassword ? 'Sembunyikan Sandi' : 'Tampilkan Sandi'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Error or Success notification */}
            {errorMessage && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 font-medium py-1 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 font-medium py-1 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
          </form>

          {/* Touchscreen Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                id={`keypad-${digit}`}
                type="button"
                onClick={() => handleKeyPress(digit)}
                className="h-11 rounded-2xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-800 font-bold text-lg transition-all active:scale-95 border border-slate-200/60 shadow-xs flex items-center justify-center select-none"
              >
                {digit}
              </button>
            ))}
            <button
              id="keypad-clear"
              type="button"
              onClick={handleClear}
              className="h-11 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-semibold text-xs transition-all active:scale-95 border border-slate-200/60 flex items-center justify-center select-none"
            >
              C
            </button>
            <button
              id="keypad-0"
              type="button"
              onClick={() => handleKeyPress('0')}
              className="h-11 rounded-2xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-800 font-bold text-lg transition-all active:scale-95 border border-slate-200/60 shadow-xs flex items-center justify-center select-none"
            >
              0
            </button>
            <button
              id="keypad-backspace"
              type="button"
              onClick={handleBackspace}
              className="h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all active:scale-95 border border-slate-200/60 flex items-center justify-center select-none"
              title="Hapus Digit"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Unlock Submit Button */}
          <button
            id="btn-submit-unlock"
            type="button"
            onClick={() => handleSubmit()}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
          >
            <Unlock className="w-4 h-4" />
            <span>Buka Kunci Layar POS</span>
          </button>

          {/* Quick Unlock Helper for Owner */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>PIN Pemilik: <strong className="font-mono text-slate-700">{currentUser.pin || '1234'}</strong></span>
            </span>
            <button
              id="btn-quick-auto-unlock"
              type="button"
              onClick={handleQuickUnlock}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1 active:scale-95"
            >
              <KeyRound className="w-3 h-3 text-emerald-600" />
              <span>Buka Cepat Otomatis</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
