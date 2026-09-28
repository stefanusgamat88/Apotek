import React from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  Keyboard,
  Layers,
  LayoutGrid,
  ListChecks,
  Monitor,
  Palette,
  Printer,
  QrCode,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Stethoscope,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PosLayoutMode, PosTheme, ReceiptTemplate } from '../types';

export const PosModesView: React.FC = () => {
  const {
    posLayoutMode,
    setPosLayoutMode,
    posTheme,
    setPosTheme,
    receiptTemplate,
    setReceiptTemplate,
    setActiveTab,
    medicines,
    cart,
  } = useApp();

  const posModesList: {
    id: PosLayoutMode;
    name: string;
    badge: string;
    badgeColor: string;
    icon: React.FC<{ className?: string }>;
    description: string;
    idealFor: string;
    speed: string;
    speedColor: string;
    inputType: string;
    features: string[];
  }[] = [
    {
      id: 'grid',
      name: 'Model 1: Visual Grid (Grid Kartu Gambar & Visual)',
      badge: 'Visual Terbaik • Ramah Sentuh',
      badgeColor: 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30',
      icon: LayoutGrid,
      description:
        'Tampilan kartu visual modern dengan foto obat, indikasi klinis, status stok berkode warna, dan pemilihan satuan instan. Sangat mudah digunakan oleh kasir umum.',
      idealFor: 'Kasir Visual, Layar Sentuh Tablet / Touchscreen POS, Display Katalog Etalase',
      speed: 'Standar / Visual Responsif',
      speedColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      inputType: 'Sentuh Layar / Klik Mouse / Barcode Scanner',
      features: [
        'Kartu obat interaktif dengan foto produk asli',
        'Filter cepat kategori obat dengan scroller horizontal',
        'Pemberitahuan sisa stok aman / menipis langsung di kartu',
        'Pilihan satuan jual (Tablet, Strip, Botol) dalam 1 klik',
      ],
    },
    {
      id: 'table',
      name: 'Model 2: List Cepat & Barcode Gun (Tabel Cepat / Keyboard Entry)',
      badge: 'Paling Cepat • Minimarket Mode',
      badgeColor: 'bg-blue-500/20 text-blue-700 border-blue-500/30',
      icon: ListChecks,
      description:
        'Tabel produk padat yang dirancang khusus untuk kecepatan tinggi dengan scanner barcode gun atau navigasi keyboard cepat. Mengurangi gerakan mouse hingga 80%.',
      idealFor: 'Minimarket Apotek, Kasir Antrian Ramai, Kasir dengan Barcode Gun Scanner USB/BT',
      speed: 'Sangat Cepat (Ultra Fast - Tanpa Jeda)',
      speedColor: 'text-blue-700 bg-blue-50 border-blue-200',
      inputType: 'Barcode Scanner Gun / Keyboard Auto-Focus',
      features: [
        'Input pencarian & barcode scanner selalu aktif (auto-focus)',
        'Tekan Enter untuk langsung memasukkan obat pertama ke keranjang',
        'Daftar baris kompak menampilkan SKU, harga, stok, dan rak obat',
        'Pengaturan jumlah obat cepat tanpa membuka popup',
      ],
    },
    {
      id: 'clinical',
      name: 'Model 3: Farmasi Klinis & Resep (Mode Apotek Khusus)',
      badge: 'Fitur Farmasi Lengkap • Skrining AI',
      badgeColor: 'bg-purple-500/20 text-purple-700 border-purple-500/30',
      icon: Stethoscope,
      description:
        'Model khusus apoteker dengan alur kerja pelayanan resep dokter resmi, penulisan etiket aturan pakai (Signa), deteksi alergi pasien, dan integrasi Skrining Interaksi Obat AI.',
      idealFor: 'Apoteker Pengelola Apotek (APA), Pelayanan Resep Dokter, Skrining Interaksi Obat & Alergi',
      speed: 'Presisi & Klinis Lengkap',
      speedColor: 'text-purple-700 bg-purple-50 border-purple-200',
      inputType: 'Resep Dokter, Catatan Dosis, Skrining AI',
      features: [
        'Header resep dokter: Nomor Resep, Nama Dokter, dan Rekam Alergi Pasien',
        'Input aturan pakai obat (Signa: 3x1 hari sesudah makan, dll) per item',
        'Tombol langsung Skrining Interaksi Obat & Keamanan Resep AI',
        'Pilihan penandaan racikan / sediaan non-racikan secara instan',
      ],
    },
  ];

  const themeOptions: {
    id: PosTheme;
    name: string;
    description: string;
    accentClass: string;
    previewBg: string;
  }[] = [
    {
      id: 'emerald',
      name: 'Emerald Apotek (Hijau Medis)',
      description: 'Nuansa hijau farmasi segar yang melambangkan kesehatan dan kebersihan.',
      accentClass: 'border-emerald-500 ring-emerald-500 text-emerald-700 bg-emerald-50',
      previewBg: 'bg-emerald-600',
    },
    {
      id: 'blue',
      name: 'Medical Blue (Biru Klinis)',
      description: 'Nuansa biru profesional rumah sakit & apotek modern dengan kontras tinggi.',
      accentClass: 'border-blue-500 ring-blue-500 text-blue-700 bg-blue-50',
      previewBg: 'bg-blue-600',
    },
    {
      id: 'purple',
      name: 'Royal Violet (Ungu Elegan)',
      description: 'Nuansa ungu cerdas modern yang mencerminkan teknologi farmasi canggih.',
      accentClass: 'border-purple-500 ring-purple-500 text-purple-700 bg-purple-50',
      previewBg: 'bg-purple-600',
    },
    {
      id: 'slate',
      name: 'Dark Cyber (Gelap Minimalis)',
      description: 'Nuansa monokrom gelap minimalis yang ramah di mata kasir shift malam.',
      accentClass: 'border-slate-800 ring-slate-800 text-slate-800 bg-slate-100',
      previewBg: 'bg-slate-900',
    },
  ];

  const receiptOptions: {
    id: ReceiptTemplate;
    name: string;
    paperWidth: string;
    description: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    {
      id: 'thermal-58',
      name: 'Struk Thermal 58mm',
      paperWidth: '58 mm',
      description: 'Format mini kasir hemat kertas paling populer untuk mini printer Bluetooth / USB.',
      icon: Printer,
    },
    {
      id: 'thermal-80',
      name: 'Struk Thermal 80mm',
      paperWidth: '80 mm',
      description: 'Format struk standar apotek besar & supermarket dengan detail item lebih rapi.',
      icon: Printer,
    },
    {
      id: 'invoice-a4',
      name: 'Faktur / Kwitansi Resmi A4',
      paperWidth: 'A4 / Surat',
      description: 'Dokumen faktur resmi lengkap dengan kop apotek, nomor SIPA, dan rincian pajak.',
      icon: FileText,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
            <Layers className="w-3.5 h-3.5" />
            <span>Pusat Ganti Mode & Model Kasir POS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Pilih Model Tampilan Kasir & Tata Letak POS
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
            Sesuaikan alur antarmuka kasir ApotekPOS sesuai kebutuhan operasional apotek Anda:
            mulai dari <strong>Model Visual Grid</strong> untuk kenyamanan sentuh, <strong>Model List Cepat</strong> untuk antrian barcode gun,
            hingga <strong>Model Farmasi Klinis</strong> lengkap dengan skrining resep dokter dan aturan pakai.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              id="btn-goto-pos-now"
              onClick={() => setActiveTab('pos')}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-2"
            >
              <span>Buka Kasir POS Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              id="btn-goto-ai-pharmacist-from-modes"
              onClick={() => setActiveTab('ai-pharmacist')}
              className="px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 font-semibold text-xs sm:text-sm transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-purple-300" />
              <span>Buka Asisten AI Apoteker</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 bottom-0 top-0 w-96 bg-indigo-500/10 blur-3xl pointer-events-none rounded-full" />
      </div>

      {/* 3 Model Selection Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-indigo-600" />
              <span>3 Model Tampilan Kasir POS Utama</span>
            </h2>
            <p className="text-xs text-slate-500">
              Klik salah satu model untuk mengaktifkan tata letak kasir secara langsung.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            Model Aktif: <strong className="text-indigo-600 uppercase">{posLayoutMode}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posModesList.map((mode) => {
            const isSelected = posLayoutMode === mode.id;
            const Icon = mode.icon;

            return (
              <div
                key={mode.id}
                id={`card-mode-${mode.id}`}
                onClick={() => setPosLayoutMode(mode.id)}
                className={`flex flex-col rounded-3xl p-6 transition-all cursor-pointer relative overflow-hidden border-2 ${
                  isSelected
                    ? 'bg-white border-indigo-600 shadow-xl ring-4 ring-indigo-500/10'
                    : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {/* Active Indicator Pin */}
                {isSelected && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-600 text-white text-[11px] font-bold shadow-xs">
                    <Check className="w-3.5 h-3.5" />
                    <span>Aktif Digunakan</span>
                  </div>
                )}

                <div className="flex items-start gap-3.5 mb-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform ${
                      isSelected ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0 pr-12">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${mode.badgeColor}`}>
                      {mode.badge}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-base mt-1.5 leading-snug">
                      {mode.name}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4 flex-1">
                  {mode.description}
                </p>

                {/* Ideal For Tag */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 mb-4 space-y-1.5">
                  <div className="text-[11px] text-slate-500 font-semibold">Ideal untuk:</div>
                  <div className="text-xs font-bold text-slate-800">{mode.idealFor}</div>
                </div>

                {/* Specs / Meta */}
                <div className="space-y-2 mb-5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Kecepatan Transaksi:</span>
                    <span className={`px-2 py-0.5 rounded-md font-semibold border ${mode.speedColor}`}>
                      {mode.speed}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Tipe Input:</span>
                    <span className="font-semibold text-slate-700 truncate max-w-[170px]">
                      {mode.inputType}
                    </span>
                  </div>
                </div>

                {/* Key Features List */}
                <div className="border-t border-slate-100 pt-3 mb-5 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Fitur Unggulan Model:
                  </span>
                  {mode.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Apply Button */}
                <button
                  type="button"
                  id={`btn-apply-mode-${mode.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPosLayoutMode(mode.id);
                  }}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Model Sedang Digunakan</span>
                    </>
                  ) : (
                    <span>Terapkan Model Ini</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Row 2: Themes & Thermal Receipt Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Theme Customization */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Pilihan Tema Warna Antarmuka POS</h3>
                <p className="text-xs text-slate-500">Sesuaikan palet aksen tombol dan sorotan sistem</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 capitalize">
              {posTheme}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {themeOptions.map((th) => {
              const isSelected = posTheme === th.id;
              return (
                <button
                  key={th.id}
                  id={`btn-theme-${th.id}`}
                  onClick={() => setPosTheme(th.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                    isSelected
                      ? `${th.accentClass} ring-2 shadow-xs`
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full ${th.previewBg} shrink-0 mt-0.5 shadow-xs`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 leading-tight">{th.name}</p>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {th.description}
                    </p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 shrink-0 text-slate-900 mt-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Receipt / Invoice Template */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Format Struk & Faktur Kasir</h3>
                <p className="text-xs text-slate-500">Pilih tata letak pencetakan struk printer kasir</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
              {receiptTemplate}
            </span>
          </div>

          <div className="space-y-3">
            {receiptOptions.map((rec) => {
              const isSelected = receiptTemplate === rec.id;
              const Icon = rec.icon;
              return (
                <div
                  key={rec.id}
                  id={`btn-receipt-${rec.id}`}
                  onClick={() => setReceiptTemplate(rec.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{rec.name}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded font-semibold bg-slate-100 text-slate-700">
                          {rec.paperWidth}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{rec.description}</p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isSelected ? (
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-full border border-slate-300" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary Footer Action Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-base text-white">Konfigurasi Siap Digunakan di Kasir</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Pilihan Anda tersimpan secara otomatis dan langsung berlaku untuk transaksi kasir berikutnya.
            </p>
          </div>
        </div>

        <button
          id="btn-modes-launch-pos"
          onClick={() => setActiveTab('pos')}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-950/30 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <span>Lanjutkan ke Kasir POS</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
