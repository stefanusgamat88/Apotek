import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Building,
  CheckCircle2,
  KeyRound,
  Printer,
  Receipt,
  RotateCcw,
  Save,
  Shield,
  Sparkles,
  Info,
  Camera,
  X,
  FileSpreadsheet,
  ExternalLink,
  Zap,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetDemoData,
    currentUser,
    setActiveTab,
    openPhotoModal,
    gasConfig,
    openGasModal,
    syncToGas,
    pullFromGasAction,
    isGasSyncing,
  } = useApp();

  const [pharmacyName, setPharmacyName] = useState(settings.pharmacyName);
  const [pharmacyTagline, setPharmacyTagline] = useState(settings.pharmacyTagline);
  const [address, setAddress] = useState(settings.address);
  const [city, setCity] = useState(settings.city);
  const [phone, setPhone] = useState(settings.phone);
  const [siaNumber, setSiaNumber] = useState(settings.siaNumber);
  const [sipaNumber, setSipaNumber] = useState(settings.sipaNumber);
  const [pharmacistName, setPharmacistName] = useState(settings.pharmacistName);
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter);
  const [printerPaperWidth, setPrinterPaperWidth] = useState<'58mm' | '80mm'>(settings.printerPaperWidth);
  const [enableTax, setEnableTax] = useState(settings.enableTax);
  const [taxRate, setTaxRate] = useState(settings.taxRate);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleExecuteReset = () => {
    setIsResetting(true);
    setTimeout(() => {
      const res = resetDemoData();
      setIsResetting(false);
      setShowResetConfirmModal(false);
      setResetFeedback(res);
      setTimeout(() => setResetFeedback(null), 6000);
    }, 250);
  };

  // Synchronize local input state whenever context settings change (e.g. from restore or other views)
  useEffect(() => {
    setPharmacyName(settings.pharmacyName);
    setPharmacyTagline(settings.pharmacyTagline);
    setAddress(settings.address);
    setCity(settings.city);
    setPhone(settings.phone);
    setSiaNumber(settings.siaNumber);
    setSipaNumber(settings.sipaNumber);
    setPharmacistName(settings.pharmacistName);
    setReceiptFooter(settings.receiptFooter);
    setPrinterPaperWidth(settings.printerPaperWidth);
    setEnableTax(settings.enableTax);
    setTaxRate(settings.taxRate);
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      pharmacyName,
      pharmacyTagline,
      address,
      city,
      phone,
      siaNumber,
      sipaNumber,
      pharmacistName,
      receiptFooter,
      printerPaperWidth,
      enableTax,
      taxRate: Number(taxRate),
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Pengaturan Apotek & Database Cloud
          </h2>
          <p className="text-xs text-slate-500">
            Kelola profil apotek, legalitas SIA & SIPA apoteker, printer struk kasir, serta integrasi database Google Apps Script (Google Sheets).
          </p>
        </div>

        {savedSuccess && (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            Pengaturan & Profil Apoteker Berhasil Diperbarui!
          </span>
        )}
      </div>

      {resetFeedback && (
        <div
          className={`p-4 rounded-3xl text-xs font-bold flex items-center gap-3 border shadow-xs animate-in fade-in ${
            resetFeedback.success
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          {resetFeedback.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <div className="flex-1">
            <p className="text-sm font-black">{resetFeedback.success ? '✓ Reset Database Berhasil!' : 'Gagal Mereset Database'}</p>
            <p className="text-xs font-medium text-slate-600 mt-0.5">{resetFeedback.message}</p>
          </div>
        </div>
      )}

      {/* SECTION: Backend Google Apps Script (GAS) & Google Sheets */}
      <div className="bg-gradient-to-br from-white to-emerald-50/40 p-6 rounded-3xl border border-emerald-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-emerald-100 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">
                  Backend Google Apps Script (GAS) & Google Sheets
                </h3>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    gasConfig.status === 'connected'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : gasConfig.status === 'error'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-slate-100 text-slate-700 border border-slate-300'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      gasConfig.status === 'connected'
                        ? 'bg-emerald-500 animate-pulse'
                        : gasConfig.status === 'error'
                        ? 'bg-rose-500'
                        : 'bg-slate-400'
                    }`}
                  />
                  {gasConfig.status === 'connected'
                    ? 'Cloud Sheets Terhubung'
                    : gasConfig.status === 'error'
                    ? 'Koneksi Error'
                    : 'Belum Terhubung'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Jadikan Google Spreadsheet pribadi Anda sebagai database cloud gratis. Seluruh transaksi kasir, master obat, dan mutasi stok tersimpan aman di Google Drive Anda.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openGasModal}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Buka Panel & Skrip GAS
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Web App</span>
            <div className="mt-1">
              <p className="text-xs font-mono truncate text-slate-700 font-semibold">
                {gasConfig.webAppUrl ? gasConfig.webAppUrl.replace('https://script.google.com/macros/s/', '').substring(0, 24) + '...' : 'Belum diisi'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {gasConfig.autoSyncOnTransaction ? '✓ Auto-Sync Transaksi Aktif' : 'Auto-Sync Nonaktif'}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Spreadsheet Terhubung</span>
            <div className="mt-1">
              {gasConfig.spreadsheetUrl ? (
                <a
                  href={gasConfig.spreadsheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3 text-emerald-600" />
                  Buka Dokumen Google Sheets →
                </a>
              ) : (
                <p className="text-xs text-slate-500 font-medium">Belum ada link spreadsheet</p>
              )}
              <p className="text-[10px] text-slate-400 mt-0.5">
                {gasConfig.lastSyncTime ? `Sinkron: ${new Date(gasConfig.lastSyncTime).toLocaleTimeString('id-ID')}` : 'Belum pernah sync'}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={syncToGas}
              disabled={isGasSyncing || !gasConfig.webAppUrl}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              Upload
            </button>
            <button
              type="button"
              onClick={pullFromGasAction}
              disabled={isGasSyncing || !gasConfig.webAppUrl}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 border border-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-teal-600" />
              Download
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Identitas Apotek */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-800 pb-3 border-b border-slate-100">
            <Building className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm">Identitas & Kontak Apotek</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nama Apotek *</label>
              <input
                type="text"
                required
                value={pharmacyName}
                onChange={(e) => setPharmacyName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Slogan / Tagline</label>
              <input
                type="text"
                value={pharmacyTagline}
                onChange={(e) => setPharmacyTagline(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Alamat Lengkap Apotek *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Kota / Kabupaten *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nomor Telepon / WhatsApp *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Legalitas Apotek (SIA, SIPA, & Nama Apoteker Pengelola) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-800 pb-3 border-b border-slate-100">
            <Shield className="w-5 h-5 text-teal-600" />
            <div>
              <h3 className="font-bold text-sm">Legalitas Farmasi & Nama Apoteker Pengelola</h3>
              <p className="text-[11px] text-slate-400">
                Nama apoteker pengelola akan otomatis disinkronkan ke akun profil login, struk cetak kasir, dan kartu stok.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                SIA (Surat Izin Apotek) *
              </label>
              <input
                type="text"
                required
                value={siaNumber}
                onChange={(e) => setSiaNumber(e.target.value)}
                placeholder="503/001/SIA/DPMPTSP/2024"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                SIPA (Surat Izin Praktik Apoteker) *
              </label>
              <input
                type="text"
                required
                value={sipaNumber}
                onChange={(e) => setSipaNumber(e.target.value)}
                placeholder="19920815/SIPA-32.73/2023/2001"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center justify-between">
                <span>Nama Apoteker Pengelola (APA) *</span>
                <span className="text-[10px] text-emerald-600 font-bold">Sinkron Profil</span>
              </label>
              <input
                id="input-pharmacist-name"
                type="text"
                required
                value={pharmacistName}
                onChange={(e) => setPharmacistName(e.target.value)}
                placeholder="Contoh: apt. Stefanus, S.Farm"
                className="w-full px-3 py-2 border border-emerald-400 ring-1 ring-emerald-500/20 rounded-xl font-bold text-slate-800 bg-emerald-50/20"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Ketika Anda mengganti <strong>Nama Apoteker Pengelola</strong> di sini dan menekan <em>"Simpan Konfigurasi Apotek"</em>, nama akan otomatis langsung diperbarui pada profil admin yang sedang aktif (<strong>{currentUser.name}</strong>), kop struk belanja kasir, serta catatan mutasi.
            </span>
          </div>
        </div>

        {/* Printer Thermal & Struk */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-800 pb-3 border-b border-slate-100">
            <Printer className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-sm">Printer Thermal Kasir & Desain Struk</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Ukuran Kertas Thermal</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPrinterPaperWidth('58mm')}
                  className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    printerPaperWidth === '58mm'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Thermal 58mm (Mobile / Portable)
                </button>
                <button
                  type="button"
                  onClick={() => setPrinterPaperWidth('80mm')}
                  className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    printerPaperWidth === '80mm'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Thermal 80mm (Desktop / Standart)
                </button>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Pengaturan Pajak / PPN</label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="checkbox"
                  id="enableTax"
                  checked={enableTax}
                  onChange={(e) => setEnableTax(e.target.checked)}
                  className="rounded text-emerald-600 w-4 h-4"
                />
                <label htmlFor="enableTax" className="text-slate-700 font-medium">
                  Aktifkan PPN (Default 0% untuk obat bebas apotek)
                </label>
              </div>
              {enableTax && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-20 px-2.5 py-1 border border-slate-300 rounded-lg text-xs"
                  />
                  <span className="text-xs text-slate-500">% PPN</span>
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">
                Pesan Kaki Struk (Receipt Footer Notes)
              </label>
              <input
                type="text"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                placeholder="Semoga Lekas Sembuh. Obat yang sudah dibeli tidak dapat ditukar."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Keamanan & PIN Pemilik Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-3">
            <div className="flex items-center gap-3 text-slate-800">
              <div
                className="relative group cursor-pointer"
                onClick={openPhotoModal}
                title="Klik untuk ganti foto profil"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500 shadow-xs group-hover:opacity-85 transition-opacity"
                />
                <div className="absolute inset-0 bg-slate-900/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                  <Camera className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-sm">Keamanan Akun & PIN Pemilik Aplikasi</h3>
                <p className="text-[11px] text-slate-500">Mode personal murni pemilik apotek (Single Owner).</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-settings-change-photo"
                onClick={openPhotoModal}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ganti Foto Profil</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('auth')}
                className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <span>Buka Menu Ganti PIN / Sandi</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-400 block text-[10px]">Pemilik Terdaftar:</span>
              <span className="font-bold text-slate-800">{currentUser.name}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-400 block text-[10px]">Username Login:</span>
              <span className="font-mono font-bold text-slate-800">{currentUser.username}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[10px]">Status PIN:</span>
                <span className="font-bold text-emerald-600">● Terlindungi ({currentUser.pin.length} digit)</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('auth')}
                className="text-emerald-700 font-bold hover:underline text-[11px]"
              >
                Ubah PIN →
              </button>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            id="btn-reset-database-bottom"
            type="button"
            onClick={() => setShowResetConfirmModal(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center justify-center gap-2 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Ulang Database Demo
          </button>

          <button
            id="btn-save-settings"
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Save className="w-4 h-4" />
            Simpan Konfigurasi Apotek
          </button>
        </div>
      </form>

      {/* Modal Konfirmasi Reset Ulang Database */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="w-9 h-9 rounded-2xl bg-rose-100 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-rose-700" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Konfirmasi Reset Ulang Database
                  </h3>
                  <p className="text-[11px] text-slate-400">Kembalikan sistem ke data pabrik</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 space-y-2">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                Perhatian: Tindakan ini akan mengembalikan:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-800">
                <li>Seluruh riwayat faktur kasir ke data demo awal</li>
                <li>Stok obat dan pergerakan mutasi kartu stok</li>
                <li>Data supplier dan pelanggan kembali ke awal</li>
                <li>Pengaturan apotek & akun pemilik (username: admin, PIN: 1234)</li>
              </ul>
            </div>

            <p className="text-slate-600 text-xs leading-relaxed">
              Seluruh data master obat dan transaksi bawaan apotek akan dipulihkan secara bersih. Apakah Anda yakin ingin mereset sekarang?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                id="btn-confirm-execute-reset"
                type="button"
                onClick={handleExecuteReset}
                disabled={isResetting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20 flex items-center gap-1.5 active:scale-95 disabled:opacity-60"
              >
                <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
                <span>{isResetting ? 'Mereset Database...' : 'Ya, Reset Database Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
