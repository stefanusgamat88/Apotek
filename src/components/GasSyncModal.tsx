import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  ExternalLink,
  Copy,
  Download,
  Settings,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Sparkles,
  Database,
  HelpCircle,
  Table,
  Check,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GAS_SCRIPT_CODE } from '../utils/gasScriptTemplate';

interface GasSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GasSyncModal: React.FC<GasSyncModalProps> = ({ isOpen, onClose }) => {
  const {
    gasConfig,
    updateGasConfig,
    testGas,
    initGasSheetsAction,
    syncToGas,
    pullFromGasAction,
    isGasSyncing,
    medicines,
    transactions,
    customers,
    suppliers,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'sync' | 'guide' | 'schema'>('sync');
  const [urlInput, setUrlInput] = useState<string>(gasConfig.webAppUrl || '');
  const [autoSync, setAutoSync] = useState<boolean>(gasConfig.autoSyncOnTransaction);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    updateGasConfig({
      webAppUrl: urlInput.trim(),
      autoSyncOnTransaction: autoSync,
    });
    setFeedback({
      success: true,
      message: 'Pengaturan URL Google Apps Script berhasil disimpan.',
    });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleTestConnection = async () => {
    if (!urlInput.trim()) {
      setFeedback({ success: false, message: 'Harap masukkan URL Web App Google Apps Script terlebih dahulu.' });
      return;
    }
    setIsTesting(true);
    setFeedback(null);
    const res = await testGas(urlInput.trim());
    setIsTesting(false);
    setFeedback(res);
  };

  const handleInitSheets = async () => {
    if (!urlInput.trim()) {
      setFeedback({ success: false, message: 'Harap masukkan URL Web App Google Apps Script terlebih dahulu.' });
      return;
    }
    setIsInitializing(true);
    setFeedback(null);
    const res = await initGasSheetsAction(urlInput.trim());
    setIsInitializing(false);
    setFeedback(res);
  };

  const handlePushAll = async () => {
    setFeedback(null);
    const res = await syncToGas();
    setFeedback(res);
  };

  const handlePullAll = async () => {
    if (!window.confirm('Tarik data dari Google Sheets? Perubahan lokal yang belum disimpan mungkin akan tertimpa.')) {
      return;
    }
    setFeedback(null);
    const res = await pullFromGasAction();
    setFeedback(res);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GAS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleDownloadScript = () => {
    const blob = new Blob([GAS_SCRIPT_CODE], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Code.gs';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white">Backend Google Apps Script (GAS)</h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950">
                  Google Sheets Database
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                Gunakan Google Spreadsheet pribadi Anda sebagai database cloud tanpa biaya & mudah diakses
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 bg-slate-50/80">
          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'sync'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            Sinkronisasi & Konfigurasi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Panduan Pasang Skrip (Code.gs)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'schema'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            Struktur Tabel Spreadsheet
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1 text-slate-700 text-xs">
          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl flex items-center gap-2.5 border animate-in fade-in ${
                feedback.success
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              {feedback.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <div className="flex-1 font-semibold">{feedback.message}</div>
            </div>
          )}

          {activeTab === 'sync' && (
            <div className="space-y-5">
              {/* Status Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3.5 h-3.5 rounded-full ring-4 ${
                      gasConfig.status === 'connected'
                        ? 'bg-emerald-500 ring-emerald-100 animate-pulse'
                        : gasConfig.status === 'error'
                        ? 'bg-rose-500 ring-rose-100'
                        : 'bg-slate-400 ring-slate-100'
                    }`}
                  />
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">
                      Status Backend: {gasConfig.status === 'connected' ? 'Terhubung ke Google Sheets' : 'Belum Terhubung'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Terakhir Sinkronisasi:{' '}
                      {gasConfig.lastSyncTime
                        ? new Date(gasConfig.lastSyncTime).toLocaleString('id-ID')
                        : 'Belum pernah'}
                    </span>
                  </div>
                </div>

                {gasConfig.spreadsheetUrl && (
                  <a
                    href={gasConfig.spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 text-xs font-bold transition-all shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                    Buka Google Spreadsheet
                  </a>
                )}
              </div>

              {/* URL Input Form */}
              <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <label className="block text-xs font-bold text-slate-800">
                  Google Apps Script Web App URL:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveConfig}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold transition-all text-xs"
                    >
                      Simpan URL
                    </button>
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTesting}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all flex items-center gap-1.5 text-xs disabled:opacity-60"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                      {isTesting ? 'Mengecek...' : 'Test Koneksi'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoSync}
                      onChange={(e) => {
                        setAutoSync(e.target.checked);
                        updateGasConfig({ autoSyncOnTransaction: e.target.checked });
                      }}
                      className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="font-semibold text-slate-700 text-[11px] flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      Otomatis kirim setiap transaksi baru ke Google Sheets (Real-Time Auto Sync)
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={handleInitSheets}
                    disabled={isInitializing}
                    className="text-[11px] text-teal-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-teal-600" />
                    {isInitializing ? 'Menyiapkan Sheet...' : 'Inisialisasi Tabel Sheets Otomatis'}
                  </button>
                </div>
              </div>

              {/* Action Buttons: Push & Pull */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Push to Sheets */}
                <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                      <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                      Kirim Seluruh Data ke Sheets (Upload)
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Mengunggah seluruh data saat ini ({medicines.length} obat, {transactions.length} transaksi,{' '}
                      {customers.length} pelanggan, {suppliers.length} supplier) ke Google Spreadsheet Anda.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handlePushAll}
                    disabled={isGasSyncing || !urlInput}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    <ArrowUpRight className={`w-4 h-4 ${isGasSyncing ? 'animate-bounce' : ''}`} />
                    {isGasSyncing ? 'Sedang Mengunggah...' : 'Upload Data Sekarang'}
                  </button>
                </div>

                {/* Pull from Sheets */}
                <div className="p-4 rounded-2xl border border-teal-200 bg-teal-50/50 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
                      <ArrowDownLeft className="w-4 h-4 text-teal-600" />
                      Tarik Data dari Sheets (Download)
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Mengambil data master obat dan transaksi terbaru yang telah Anda edit atau tambahkan langsung di
                      Google Spreadsheet.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handlePullAll}
                    disabled={isGasSyncing || !urlInput}
                    className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    <ArrowDownLeft className={`w-4 h-4 ${isGasSyncing ? 'animate-bounce' : ''}`} />
                    {isGasSyncing ? 'Sedang Menarik...' : 'Download dari Sheets'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                <span className="font-bold flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  Hanya Butuh Waktu 2 Menit untuk Memasang Backend Google Apps Script!
                </span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Google Apps Script (GAS) berjalan di cloud Google Anda sendiri secara 100% gratis tanpa biaya bulanan.
                  Data kasir apotek Anda tersimpan langsung di Google Drive Anda.
                </p>
              </div>

              {/* Step by step */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">Buat Google Spreadsheet Baru</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Buka{' '}
                      <a
                        href="https://sheets.new"
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 font-bold underline inline-flex items-center gap-0.5"
                      >
                        sheets.new <ExternalLink className="w-3 h-3" />
                      </a>{' '}
                      di browser Anda dan beri nama dokumen, misalnya <strong>Database ApotekPOS</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">Buka Menu Ekstensi → Apps Script</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Di Google Sheets tersebut, klik menu <strong>Extensions (Ekstensi)</strong> lalu pilih{' '}
                      <strong>Apps Script</strong>. Jendela editor skrip akan terbuka.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">Salin & Tempelkan Kode Script (Code.gs)</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Hapus teks default di file <code>Code.gs</code>, lalu salin seluruh skrip di bawah ini:
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={handleCopyScript}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 transition-all text-xs shadow-xs"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedCode ? 'Kode Skrip Tersalin!' : 'Salin Kode Skrip (Code.gs)'}
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadScript}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5 transition-all text-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download File .gs
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    4
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">Terapkan Sebagai Aplikasi Web (Deploy as Web App)</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Klik tombol biru <strong>Deploy (Terapkan)</strong> di kanan atas →{' '}
                      <strong>New deployment (Penerapan baru)</strong> → Pilih jenis <strong>Web app</strong>:
                    </p>
                    <ul className="list-disc list-inside mt-1.5 space-y-0.5 text-[11px] text-slate-600">
                      <li>
                        <strong>Execute as:</strong> Me (akun Google Anda)
                      </li>
                      <li>
                        <strong>Who has access:</strong>{' '}
                        <span className="text-emerald-700 font-black">Anyone (Siapa saja)</span>{' '}
                        <em className="text-slate-400 font-normal">
                          (Wajib dipilih agar web app kasir dapat memproses data)
                        </em>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    5
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">Salin Web App URL ke ApotekPOS</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Salin URL yang diberikan (format:{' '}
                      <code>https://script.google.com/macros/s/.../exec</code>), lalu masukkan ke tab{' '}
                      <strong>Sinkronisasi</strong> di modal ini dan klik <strong>Test Koneksi</strong>!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                Skrip GAS ApotekPOS secara otomatis membuat dan menata format lembar kerja (Sheet) berikut saat tombol{' '}
                <strong>Inisialisasi Tabel Sheets Otomatis</strong> ditekan:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Table className="w-3.5 h-3.5 text-emerald-600" />
                    Sheet: Obat
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    ID, Barcode, SKU, Nama Obat, Generik, Kategori, Satuan, Stok, Min Stok, Harga Beli, Harga Jual, Expired
                    Date, No Batch, Pabrik/PBF, Rak.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Table className="w-3.5 h-3.5 text-emerald-600" />
                    Sheet: Transaksi
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    ID Transaksi, No Faktur, Tanggal, Kasir, Pelanggan, Total, Metode Bayar, Kembalian, Laba Bersih,
                    Status, Ringkasan Item.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Table className="w-3.5 h-3.5 text-emerald-600" />
                    Sheet: DetailTransaksi
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    ID Transaksi, No Faktur, ID Obat, Nama Obat, Satuan, Qty, Harga Satuan, Diskon %, Subtotal.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Table className="w-3.5 h-3.5 text-emerald-600" />
                    Sheet: MutasiStok
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    ID Mutasi, Tanggal, ID Obat, Nama Obat, Tipe Mutasi (In/Out), Jumlah, Sisa Stok, Referensi Faktur.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Table className="w-3.5 h-3.5 text-emerald-600" />
                    Sheet: Pelanggan & Supplier
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Pelanggan (Nama, Telp, Alergi, Riwayat Belanja) & Supplier PBF (Nama Distributor, Kontak, Alamat,
                    Tempo).
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Table className="w-3.5 h-3.5 text-emerald-600" />
                    Sheet: Pengaturan
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Profil apotek, Nama Apoteker Pengelola Apotek (APA), SIA, SIPA, format printer, dan persentase pajak.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Backend GAS 100% bebas biaya server & fleksibel
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
