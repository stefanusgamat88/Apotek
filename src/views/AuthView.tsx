import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Lock,
  Unlock,
  LogOut,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
  History,
  Check,
  Sparkles,
  UserCheck,
  Store,
  RefreshCw,
  Save,
  Key,
  Camera,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AuthView: React.FC = () => {
  const {
    currentUser,
    users,
    logout,
    lockSession,
    changeOwnerCredentials,
    auditLogs,
    settings,
    setActiveTab,
    openPhotoModal,
  } = useApp();

  // Active sub-tab: 'change-pin' | 'profile' | 'test-pin' | 'logs'
  const [activeSubTab, setActiveSubTab] = useState<'change-pin' | 'profile' | 'test-pin' | 'logs'>('change-pin');

  // Form State for Changing PIN / Password
  const [ownerName, setOwnerName] = useState(currentUser.name);
  const [ownerUsername, setOwnerUsername] = useState(currentUser.username);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // Password visibility toggles
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  // Form notifications
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // PIN Testing Sandbox
  const [testInputPin, setTestInputPin] = useState('');
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'success' | 'fail'; message: string }>({
    status: 'idle',
    message: '',
  });

  // Calculate PIN / Password Strength
  const calculateStrength = (val: string) => {
    if (!val) return { score: 0, text: 'Kosong', color: 'bg-slate-200' };
    if (val.length < 4) return { score: 1, text: 'Terlalu Pendek (min 4 digit)', color: 'bg-rose-500 text-rose-700' };
    const hasLetters = /[a-zA-Z]/.test(val);
    const hasNumbers = /[0-9]/.test(val);
    const hasSpecial = /[^a-zA-Z0-9]/.test(val);

    if (val.length >= 6 && hasLetters && hasNumbers && hasSpecial) {
      return { score: 4, text: 'Sangat Kuat (Kombinasi Kompleks)', color: 'bg-emerald-500 text-emerald-700' };
    }
    if ((hasLetters && hasNumbers) || val.length >= 6) {
      return { score: 3, text: 'Kuat & Aman', color: 'bg-emerald-400 text-emerald-700' };
    }
    if (val.length >= 4 && /^\d+$/.test(val)) {
      return { score: 2, text: 'Standar PIN Angka (Cepat & Praktis)', color: 'bg-amber-400 text-amber-700' };
    }
    return { score: 2, text: 'Sedang', color: 'bg-blue-400 text-blue-700' };
  };

  const strength = calculateStrength(newPin);

  // Handle Changing PIN / Password
  const handleChangeCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!currentPin.trim()) {
      setFormError('Silakan masukkan PIN / Password lama Anda untuk verifikasi.');
      return;
    }

    if (!newPin.trim()) {
      setFormError('PIN / Password baru tidak boleh kosong.');
      return;
    }

    if (newPin.trim().length < 4) {
      setFormError('PIN / Password baru minimal 4 angka atau karakter.');
      return;
    }

    if (newPin !== confirmPin) {
      setFormError('Konfirmasi PIN baru tidak sesuai dengan PIN baru.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const result = changeOwnerCredentials(currentPin, newPin, ownerUsername, ownerName);
      setIsSubmitting(false);

      if (result.success) {
        setFormSuccess(result.message);
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
      } else {
        setFormError(result.message);
      }
    }, 400);
  };

  // Test PIN Simulator
  const handleTestPinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!testInputPin.trim()) {
      setTestResult({ status: 'fail', message: 'Ketik PIN pada keypad simulator' });
      return;
    }

    if (testInputPin.trim() === currentUser.pin) {
      setTestResult({
        status: 'success',
        message: `✓ PIN Benar! Kunci aplikasi dapat dibuka sebagai ${currentUser.name}.`,
      });
    } else {
      setTestResult({
        status: 'fail',
        message: '✗ PIN Salah! Tidak cocok dengan PIN login aktif saat ini.',
      });
    }
  };

  const handleTestKeypadPress = (digit: string) => {
    if (testInputPin.length < 8) {
      setTestInputPin((prev) => prev + digit);
      setTestResult({ status: 'idle', message: '' });
    }
  };

  const handleTestBackspace = () => {
    setTestInputPin((prev) => prev.slice(0, -1));
    setTestResult({ status: 'idle', message: '' });
  };

  const handleTestClear = () => {
    setTestInputPin('');
    setTestResult({ status: 'idle', message: '' });
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Top Banner: Single Owner Notice */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border border-emerald-800/40">
        <div className="relative z-10 flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0 text-emerald-300 shadow-inner">
            <KeyRound className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Clean Mode: Khusus Pemilik Aplikasi Saja</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Menu Ganti PIN & Keamanan Login</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              Sistem ini dikonfigurasi murni untuk pemilik tunggal (Owner Apoteker). Kelola PIN akses kasir POS, password akun, serta kunci layar personal Anda di sini.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="relative z-10 flex items-center gap-2 flex-wrap">
          <button
            id="btn-auth-lock-screen"
            onClick={lockSession}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/15 flex items-center gap-2 shadow-xs"
          >
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Kunci Layar POS</span>
          </button>
          <button
            id="btn-auth-logout"
            onClick={logout}
            className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-2"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('change-pin')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'change-pin'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Ganti PIN / Password Login</span>
        </button>

        <button
          onClick={() => setActiveSubTab('test-pin')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'test-pin'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Uji Coba PIN (Simulator)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('profile')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'profile'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Profil Pemilik & Hak Akses</span>
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'logs'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Log Aktivitas & Keamanan</span>
        </button>
      </div>

      {/* SUB-TAB 1: GANTI PIN / PASSWORD LOGIN */}
      {activeSubTab === 'change-pin' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Change PIN Form */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-emerald-600" />
                  Formulir Ganti PIN / Password Aplikasi
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ubah kode rahasia yang digunakan untuk login dan membuka kunci layar POS.
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-400">PIN Aktif Saat Ini:</span>
                <span className="font-mono font-bold text-emerald-600">•••• ({currentUser.pin.length} digit)</span>
              </div>
            </div>

            {/* Success Alert */}
            {formSuccess && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-start gap-3 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">{formSuccess}</p>
                  <p className="text-[11px] text-emerald-700">
                    PIN baru telah tersimpan di browser dan langsung aktif untuk sesi berikutnya. Anda dapat mencobanya di tab <strong>Uji Coba PIN</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {formError && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-3 animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span className="font-medium">{formError}</span>
              </div>
            )}

            <form onSubmit={handleChangeCredentials} className="space-y-5">
              {/* Owner Name & Username row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama Pemilik / Apoteker Pengelola:
                  </label>
                  <input
                    id="input-owner-name"
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    required
                    placeholder="apt. Stefanus, S.Farm"
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Nama ini disinkronkan ke struk cetak & laporan.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Username Akun Pemilik:
                  </label>
                  <input
                    id="input-owner-username"
                    type="text"
                    value={ownerUsername}
                    onChange={(e) => setOwnerUsername(e.target.value)}
                    required
                    placeholder="admin"
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">ID identitas saat login sistem.</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                {/* Current PIN */}
                <div className="max-w-md">
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span>1. Masukkan PIN / Sandi Lama:</span>
                    <span className="text-[10px] text-slate-400 font-normal">Wajib untuk verifikasi keamanan</span>
                  </label>
                  <div className="relative">
                    <input
                      id="input-current-pin"
                      type={showCurrentPin ? 'text' : 'password'}
                      value={currentPin}
                      onChange={(e) => setCurrentPin(e.target.value)}
                      required
                      placeholder="Masukkan PIN lama Anda..."
                      className="w-full text-xs font-mono font-bold tracking-wider px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPin(!showCurrentPin)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                      title={showCurrentPin ? 'Sembunyikan' : 'Lihat'}
                    >
                      {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Petunjuk: Jika belum pernah diubah, PIN default bawaan adalah <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">1234</span>.
                  </p>
                </div>
              </div>

              {/* New PIN & Confirm PIN row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span>2. PIN / Sandi Baru:</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Min. 4 digit</span>
                  </label>
                  <div className="relative">
                    <input
                      id="input-new-pin"
                      type={showNewPin ? 'text' : 'password'}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      required
                      placeholder="Contoh: 8899 atau Sandi123"
                      className="w-full text-xs font-mono font-bold tracking-wider px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPin(!showNewPin)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Strength Meter */}
                  {newPin.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                        <div
                          className={`h-full transition-all rounded-full ${
                            strength.score >= 1 ? 'w-1/4 bg-emerald-500' : 'w-0'
                          }`}
                        />
                        <div
                          className={`h-full transition-all rounded-full ${
                            strength.score >= 2 ? 'w-1/4 bg-emerald-500' : 'w-0'
                          }`}
                        />
                        <div
                          className={`h-full transition-all rounded-full ${
                            strength.score >= 3 ? 'w-1/4 bg-emerald-500' : 'w-0'
                          }`}
                        />
                        <div
                          className={`h-full transition-all rounded-full ${
                            strength.score >= 4 ? 'w-1/4 bg-emerald-500' : 'w-0'
                          }`}
                        />
                      </div>
                      <p className="text-[10px] font-semibold text-slate-600 flex items-center gap-1">
                        <span>Kekuatan Sandi:</span>
                        <span className={strength.color}>{strength.text}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span>3. Konfirmasi PIN / Sandi Baru:</span>
                    {confirmPin && (
                      <span
                        className={`text-[10px] font-bold ${
                          newPin === confirmPin ? 'text-emerald-600' : 'text-rose-500'
                        }`}
                      >
                        {newPin === confirmPin ? '✓ Cocok' : '✗ Belum sama'}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      id="input-confirm-pin"
                      type={showConfirmPin ? 'text' : 'password'}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      required
                      placeholder="Ketik ulang PIN baru..."
                      className={`w-full text-xs font-mono font-bold tracking-wider px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 ${
                        confirmPin && newPin !== confirmPin
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                          : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPin(!showConfirmPin)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Pastikan penulisan sama persis dengan kolom PIN baru.</p>
                </div>
              </div>

              {/* Tips & Recommendations Box */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-600" />
                  Rekomendasi Keamanan Pemilik:
                </p>
                <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5 pl-1">
                  <li>Gunakan 4 hingga 6 angka yang mudah diingat saat bertransaksi cepat di kasir.</li>
                  <li>Jangan berikan PIN ini kepada pihak yang tidak berwenang karena memberikan akses ke laba & modal.</li>
                  <li>Setelah mengganti PIN, Anda dapat langsung mengujinya di tombol simulator di samping kanan.</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  id="btn-submit-change-pin"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs transition-all shadow-md shadow-emerald-950/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan PIN Baru...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan & Terapkan PIN Baru</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Side Cards */}
          <div className="space-y-6">
            {/* Active Owner Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                Identitas Pemilik Terdaftar
              </h3>
              <div className="flex items-center gap-3.5 mb-4">
                <div
                  className="relative group cursor-pointer shrink-0"
                  onClick={openPhotoModal}
                  title="Klik untuk ganti foto profil"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-xs group-hover:opacity-85 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-slate-900/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white shadow-xs">
                    <Camera className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</h4>
                  <p className="text-xs text-emerald-600 font-semibold">Pemilik Apotek (Owner)</p>
                  <button
                    type="button"
                    id="btn-auth-change-photo-quick"
                    onClick={openPhotoModal}
                    className="mt-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200 flex items-center gap-1.5 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ganti Foto Profil</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Apotek:</span>
                  <span className="font-semibold text-slate-800">{settings.pharmacyName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Username:</span>
                  <span className="font-mono font-bold text-slate-800">{currentUser.username}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Status Akun:</span>
                  <span className="text-emerald-600 font-bold">● Aktif & Terlindungi</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Mode Sistem:</span>
                  <span className="text-slate-800 font-semibold">Single Owner (Murni)</span>
                </div>
              </div>
            </div>

            {/* Quick Lock Action Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Kunci Layar Seketika</h4>
                  <p className="text-[11px] text-slate-300">Amankan layar saat meninggalkan kasir.</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Fitur Kunci Layar akan menyembunyikan nominal kas dan transaksi sampai PIN yang sah dimasukkan kembali.
              </p>
              <button
                id="btn-card-lock-now"
                type="button"
                onClick={lockSession}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <Lock className="w-4 h-4" />
                <span>Kunci Layar POS Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: UJI COBA PIN (SIMULATOR) */}
      {activeSubTab === 'test-pin' && (
        <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 mx-auto flex items-center justify-center mb-2 shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Simulator Uji Coba PIN</h2>
            <p className="text-xs text-slate-500 mt-1">
              Uji PIN baru Anda sekarang untuk memastikan Anda mengingatnya dengan benar sebelum dipakai di kasir.
            </p>
          </div>

          {/* Test Display */}
          <div className="mb-4">
            <div className="p-3 rounded-2xl bg-slate-900 text-center font-mono text-xl font-bold tracking-widest text-emerald-400 min-h-12 flex items-center justify-center border border-slate-700">
              {testInputPin ? '•'.repeat(testInputPin.length) : <span className="text-slate-600 text-xs">Tekan angka keypad di bawah</span>}
            </div>

            {testResult.status !== 'idle' && (
              <div
                className={`mt-2 p-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 ${
                  testResult.status === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {testResult.status === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Virtual Keypad */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleTestKeypadPress(d)}
                className="h-12 rounded-2xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-800 font-bold text-lg active:scale-95 border border-slate-200/80 transition-all flex items-center justify-center"
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              onClick={handleTestClear}
              className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs active:scale-95 border border-slate-200/80 flex items-center justify-center"
            >
              C
            </button>
            <button
              type="button"
              onClick={() => handleTestKeypadPress('0')}
              className="h-12 rounded-2xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-800 font-bold text-lg active:scale-95 border border-slate-200/80 transition-all flex items-center justify-center"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleTestBackspace}
              className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 active:scale-95 border border-slate-200/80 flex items-center justify-center"
              title="Hapus"
            >
              ⌫
            </button>
          </div>

          {/* Action button */}
          <button
            type="button"
            onClick={() => handleTestPinSubmit()}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2"
          >
            <Unlock className="w-4 h-4" />
            <span>Verifikasi Kecocokan PIN</span>
          </button>
        </div>
      )}

      {/* SUB-TAB 3: PROFIL PEMILIK & HAK AKSES */}
      {activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              Informasi Pemilik Aplikasi
            </h3>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/60">
                <div className="flex items-center gap-4">
                  <div
                    className="relative group cursor-pointer shrink-0"
                    onClick={openPhotoModal}
                    title="Klik untuk ganti foto profil"
                  >
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm group-hover:opacity-85 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-slate-900/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                      <Camera className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{currentUser.name}</h4>
                    <p className="text-xs text-emerald-600 font-semibold">Owner & Penanggung Jawab Apotek</p>
                    <p className="text-xs text-slate-400 mt-0.5">ID Pengguna: {currentUser.id}</p>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-auth-change-photo-profile-tab"
                  onClick={openPhotoModal}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all shrink-0"
                >
                  <Camera className="w-4 h-4" />
                  <span>Ganti Foto Profil</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px]">Nomor SIA Apotek:</span>
                  <span className="font-semibold text-slate-800">{settings.siaNumber}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px]">Nomor SIPA Apoteker:</span>
                  <span className="font-semibold text-slate-800">{settings.sipaNumber}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px]">Telepon / WhatsApp:</span>
                  <span className="font-semibold text-slate-800">{currentUser.phone || settings.phone}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px]">Akses Shift:</span>
                  <span className="font-semibold text-slate-800">Semua Shift (Bebas)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Privileges Matrix */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              Matriks Otoritas Pemilik (Full Access)
            </h3>

            <div className="space-y-2.5 text-xs">
              {[
                { title: 'Kasir POS & Transaksi', desc: 'Melayani penjualan resep, OTC, diskon & pembayaran', granted: true },
                { title: 'Dashboard Finansial', desc: 'Melihat omzet harian, laba kotor, laba bersih & HPP', granted: true },
                { title: 'Master Data Obat & Alkes', desc: 'Tambah obat baru, atur multi-satuan, batas stok & harga', granted: true },
                { title: 'Pembelian & Stok Masuk', desc: 'Input faktur PBF, kelola hutang tempo & riwayat supplier', granted: true },
                { title: 'Laporan Lengkap & Ekspor', desc: 'Download laporan penjualan, laba rugi, dan kartu stok', granted: true },
                { title: 'Backup & Restore Database', desc: 'Download file cadangan JSON dan pulihkan data kapan saja', granted: true },
              ].map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between p-3 rounded-2xl bg-emerald-50/50 border border-emerald-200/60"
                >
                  <div>
                    <h5 className="font-bold text-slate-800">{p.title}</h5>
                    <p className="text-[11px] text-slate-500">{p.desc}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] shrink-0">
                    Otoritas Penuh ✓
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: LOG AKTIVITAS & KEAMANAN */}
      {activeSubTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                Audit Trail & Log Keamanan Pemilik
              </h3>
              <p className="text-xs text-slate-500">
                Pencatatan riwayat setiap aksi autentikasi, pengubahan PIN, dan modifikasi data.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 font-semibold">Waktu Kejadian</th>
                  <th className="pb-3 font-semibold">Tindakan / Aksi</th>
                  <th className="pb-3 font-semibold">Keterangan Aktivitas</th>
                  <th className="pb-3 font-semibold">Kategori</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.slice(0, 15).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 font-mono text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-3 font-bold text-slate-800">{log.action}</td>
                    <td className="py-3 text-slate-600">{log.details}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase ${
                          log.type === 'auth'
                            ? 'bg-purple-100 text-purple-800'
                            : log.type === 'system'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {log.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
