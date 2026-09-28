import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Camera,
  Clock,
  KeyRound,
  Lock,
  LogOut,
  Menu,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setMobileMenuOpen,
    currentUser,
    users,
    setCurrentUser,
    openPhotoModal,
    smartInsights,
    openScanner,
    isOnline,
    syncStatus,
    settings,
    lockSession,
    logout,
    setIsAuthModalOpen,
  } = useApp();

  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
      setDate(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalAlerts = smartInsights.lowStockItems.length + smartInsights.nearExpiryItems.length;

  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    pos: { title: 'Kasir & Transaksi POS', subtitle: 'Pilih produk obat, proses pembayaran, cetak struk thermal' },
    dashboard: { title: 'Dashboard Real-Time', subtitle: 'Statistik omzet, transaksi, laba bersih & grafik penjualan' },
    medicines: { title: 'Katalog & Manajemen Stok Obat', subtitle: 'Master data obat, nomor batch, expired & multi-satuan' },
    categories: { title: 'Kategori Obat', subtitle: 'Pengelompokan golongan obat bebas, terbatas, keras & herbal' },
    'stock-cards': { title: 'Kartu Stok Otomatis', subtitle: 'Riwayat mutasi keluar masuk stok pergerakan barang' },
    purchases: { title: 'Pembelian & Stok Masuk', subtitle: 'Penerimaan stok dari Pedagang Besar Farmasi (PBF)' },
    suppliers: { title: 'Data Supplier & PBF', subtitle: 'Daftar distributor resmi farmasi & ketentuan tempo' },
    transactions: { title: 'Riwayat Transaksi', subtitle: 'Daftar struk penjualan, cetak ulang & pembatalan void' },
    customers: { title: 'Data Pelanggan & Pasien', subtitle: 'Riwayat kunjungan, catatan alergi obat & loyalitas' },
    reports: { title: 'Laporan Lengkap & Analisis', subtitle: 'Laporan omzet, laba rugi akuntansi, ekspor PDF/Excel' },
    auth: { title: 'Login & Keamanan PIN', subtitle: 'Verifikasi login admin personal, ganti PIN keamanan & penguncian layar' },
    settings: { title: 'Pengaturan & Backup Data', subtitle: 'Identitas apotek, nomor SIA/SIPA, nama apoteker, printer thermal & backup JSON berkala' },
    'pos-modes': {
      title: 'Pusat Ganti Mode & Model Kasir POS',
      subtitle: 'Pilih model antarmuka kasir (Visual Grid, List Cepat Barcode Gun, Farmasi Klinis) & tema warna',
    },
    'ai-pharmacist': {
      title: 'AI Apoteker - Skrining Klinis & Konsultasi',
      subtitle: 'Asisten pintar skrining resep dokter, deteksi interaksi obat, swamedikasi keluhan, dan etiket KIE',
    },
  };

  const currentInfo = pageTitles[activeTab] || { title: 'ApotekPOS', subtitle: 'Sistem Kasir & Stok Apotek' };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-xs px-4 lg:px-6 py-2.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Hamburger & Page Title */}
        <div className="flex items-center gap-3">
          <button
            id="btn-open-mobile-sidebar"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            title="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col">
            <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight leading-tight">
              {currentInfo.title}
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block truncate max-w-md">
              {currentInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Actions & Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Lock POS Button */}
          <button
            id="btn-navbar-quick-lock"
            onClick={lockSession}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-semibold transition-all shadow-xs"
            title="Kunci Layar (Lock Screen POS)"
          >
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden md:inline">Kunci Layar</span>
          </button>

          {/* Quick Scan Barcode Button */}
          <button
            id="btn-quick-barcode-scanner"
            onClick={openScanner}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-all shadow-xs"
            title="Scan Barcode Kamera atau Alat Scanner"
          >
            <QrCode className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Scan Barcode</span>
          </button>

          {/* Quick AI Pharmacist Button */}
          <button
            id="btn-navbar-quick-ai"
            onClick={() => setActiveTab('ai-pharmacist')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-semibold transition-all shadow-xs"
            title="Buka Asisten AI Apoteker & Skrining Resep"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden lg:inline">AI Apoteker</span>
          </button>

          {/* Real-time Clock Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200/80 text-xs text-slate-600 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{date}</span>
            <span className="font-semibold text-slate-800">{time}</span>
          </div>

          {/* Sync & Connectivity Status */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
              isOnline
                ? 'bg-emerald-50/70 text-emerald-700 border-emerald-200/60'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
            title={isOnline ? 'Tersinkronisasi dengan Cloud Database' : 'Mode Offline'}
          >
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden xl:inline">Cloud Real-time</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-500" />
                <span>Offline</span>
              </>
            )}
          </div>

          {/* Auto-Backup Safety Indicator */}
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60 text-xs font-semibold transition-all cursor-pointer"
            title="Sistem Cadangan Otomatis Harian & Mingguan Aktif. Klik untuk kelola riwayat cadangan."
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cadangan: Aman</span>
          </button>

          {/* Notification Bell Dropdown */}
          <div className="relative">
            <button
              id="btn-notifications-toggle"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Notifikasi Peringatan Stok & Expired"
            >
              <Bell className="w-5 h-5" />
              {totalAlerts > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                  {totalAlerts}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                id="notifications-dropdown"
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2"
              >
                <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800">Pemberitahuan Apotek</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold">
                      {totalAlerts} Perlu Tindakan
                    </span>
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Tutup
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                  {/* Low Stock Alerts */}
                  {smartInsights.lowStockItems.map((med) => (
                    <div
                      key={med.id}
                      onClick={() => {
                        setActiveTab('medicines');
                        setShowNotifications(false);
                      }}
                      className="px-4 py-2.5 hover:bg-rose-50/50 cursor-pointer transition-colors flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{med.name}</p>
                        <p className="text-[11px] text-rose-600 font-medium">
                          Stok tersisa: <span className="font-bold">{med.stock} {med.baseUnit}</span> (Min: {med.minStock})
                        </p>
                        <p className="text-[10px] text-slate-400">Rak: {med.locationRack}</p>
                      </div>
                    </div>
                  ))}

                  {/* Near Expiry Alerts */}
                  {smartInsights.nearExpiryItems.map((med) => (
                    <div
                      key={med.id}
                      onClick={() => {
                        setActiveTab('medicines');
                        setShowNotifications(false);
                      }}
                      className="px-4 py-2.5 hover:bg-amber-50/50 cursor-pointer transition-colors flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{med.name}</p>
                        <p className="text-[11px] text-amber-600 font-medium">
                          Mendekati Kadaluarsa: <span className="font-bold">{med.expiredDate}</span>
                        </p>
                        <p className="text-[10px] text-slate-400">Batch: {med.batchNumber}</p>
                      </div>
                    </div>
                  ))}

                  {totalAlerts === 0 && (
                    <div className="py-6 text-center text-xs text-slate-400">
                      Semua stok aman dan belum ada obat yang mendekati tanggal kadaluarsa.
                    </div>
                  )}
                </div>

                <div className="px-4 pt-2 border-t border-slate-100 text-center">
                  <button
                    onClick={() => {
                      setActiveTab('medicines');
                      setShowNotifications(false);
                    }}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                  >
                    Lihat Semua Stok di Katalog →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Direct Ganti PIN / Sandi Pemilik button */}
          <button
            id="btn-navbar-ganti-pin"
            onClick={() => setActiveTab('auth')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-all shadow-xs"
            title="Menu Ganti PIN / Password Pemilik"
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Ganti PIN / Sandi</span>
            <span className="sm:hidden">PIN</span>
          </button>

          {/* User Profile / Quick Menu */}
          <div className="relative">
            <button
              id="btn-user-profile-menu"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 pl-2 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-slate-50 transition-all text-left"
            >
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-32">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold uppercase">
                  Pemilik Apotek (Owner)
                </span>
              </div>
              <div className="relative">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-emerald-500/40"
                />
                <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-600 text-white p-0.5 rounded-full shadow-xs">
                  <Camera className="w-2.5 h-2.5" />
                </span>
              </div>
            </button>

            {showUserMenu && (
              <div
                id="user-profile-dropdown"
                className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2"
              >
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Pemilik Aplikasi</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{currentUser.name}</p>
                    <p className="text-xs text-slate-500 font-medium">Apoteker Pengelola Apotek</p>
                  </div>
                  <button
                    onClick={() => {
                      openPhotoModal();
                      setShowUserMenu(false);
                    }}
                    title="Ganti Foto Profil"
                    className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors border border-emerald-200"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <div className="px-3 pt-2 space-y-1">
                  <button
                    id="btn-navbar-change-photo"
                    onClick={() => {
                      openPhotoModal();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left text-xs py-2 px-2.5 rounded-lg text-emerald-900 bg-emerald-50 hover:bg-emerald-100 font-bold flex items-center gap-2 transition-colors border border-emerald-200/60"
                  >
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>Ganti Foto Profil</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('auth');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left text-xs py-1.5 px-2.5 rounded-lg text-slate-700 hover:bg-slate-100 font-medium flex items-center gap-2 transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ganti PIN / Password Login</span>
                  </button>

                  <button
                    onClick={() => {
                      lockSession();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left text-xs py-1.5 px-2.5 rounded-lg text-amber-800 hover:bg-amber-50 font-medium flex items-center gap-2 transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Kunci Layar POS</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left text-xs py-1.5 px-2.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors"
                  >
                    Buka Pengaturan & Backup
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left text-xs py-1.5 px-2.5 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-2 transition-colors pt-1 border-t border-slate-100"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Keluar / Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
