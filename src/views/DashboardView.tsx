import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  Eye,
  EyeOff,
  Flame,
  KeyRound,
  LineChart as LineChartIcon,
  Lock,
  PackageCheck,
  Pill,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Unlock,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../context/AppContext';

export const DashboardView: React.FC = () => {
  const {
    transactions,
    medicines,
    smartInsights,
    setActiveTab,
    settings,
    currentUser,
    login,
  } = useApp();

  // Login Gate State (when accessing as Cashier)
  const [gateUsername, setGateUsername] = useState('admin');
  const [gatePin, setGatePin] = useState('');
  const [showGatePin, setShowGatePin] = useState(false);
  const [gateError, setGateError] = useState('');

  const [timeRange, setTimeRange] = useState<'7days' | '30days'>('7days');

  // Handle Admin Login submission from the gate
  const handleGateLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setGateError('');

    if (!gatePin) {
      setGateError('Silakan masukkan PIN Administrator.');
      return;
    }

    const result = login(gateUsername, gatePin, 'Semua Shift (Owner / Apoteker)');
    if (!result.success) {
      setGateError(result.message);
      setGatePin('');
    }
  };

  const handleQuickGateDemo = () => {
    setGateUsername('admin');
    setGatePin('1234');
    setGateError('');
  };

  // If user is not admin, show the Admin Login Gate BEFORE entering the dashboard
  if (currentUser.role !== 'admin') {
    return (
      <div className="p-4 lg:p-8 max-w-4xl mx-auto min-h-[85vh] flex items-center justify-center">
        <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-8 text-white text-center relative overflow-hidden">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center mb-4 text-purple-300 shadow-lg">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-semibold mb-2">
              <Lock className="w-3.5 h-3.5" />
              <span>Area Khusus Administrator</span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight">Login Admin Diperlukan</h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto mt-2 leading-relaxed">
              Sebelum masuk menu Dashboard, silakan lakukan autentikasi Administrator. Dashboard memuat data rahasia apotek: omzet transaksi harian, laba bersih, dan nilai modal HPP.
            </p>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-8 max-w-md mx-auto space-y-6">
            {/* Active user notice */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Sesi aktif saat ini: <strong>{currentUser.name}</strong> ({currentUser.role.toUpperCase()})
                </span>
              </div>
            </div>

            <form onSubmit={handleGateLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Username Administrator:
                </label>
                <div className="relative">
                  <input
                    id="gate-admin-username"
                    type="text"
                    value={gateUsername}
                    onChange={(e) => {
                      setGateUsername(e.target.value);
                      setGateError('');
                    }}
                    required
                    placeholder="admin"
                    className="w-full text-xs font-bold pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  />
                  <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  PIN Keamanan Admin (Demo: 1234):
                </label>
                <div className="relative">
                  <input
                    id="gate-admin-pin"
                    type={showGatePin ? 'text' : 'password'}
                    maxLength={6}
                    value={gatePin}
                    onChange={(e) => {
                      setGatePin(e.target.value);
                      setGateError('');
                    }}
                    autoFocus
                    placeholder="Masukkan PIN 4-digit..."
                    className="w-full text-center tracking-widest text-lg font-bold pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowGatePin(!showGatePin)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showGatePin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {gateError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{gateError}</span>
                </div>
              )}

              {/* Main Prominent Tombol Login Admin */}
              <button
                id="btn-gate-login-admin"
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-purple-950/20 flex items-center justify-center gap-2 active:scale-98"
              >
                <Unlock className="w-4 h-4" />
                <span>Tombol Login Admin & Buka Dashboard</span>
              </button>

              {/* Quick shortcut & Back to POS */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleQuickGateDemo}
                  className="text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Shortcut Demo (PIN: 1234)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('pos')}
                  className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Kasir POS</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Chart data preparation
  const salesHistory = [
    { date: '16 Sep', sales: 1250000, profit: 420000, transactions: 18 },
    { date: '17 Sep', sales: 1890000, profit: 610000, transactions: 26 },
    { date: '18 Sep', sales: 1420000, profit: 490000, transactions: 21 },
    { date: '19 Sep', sales: 2150000, profit: 780000, transactions: 34 },
    { date: '20 Sep', sales: 2680000, profit: 920000, transactions: 39 },
    { date: '21 Sep', sales: 1950000, profit: 670000, transactions: 28 },
    {
      date: '22 Sep (Hari Ini)',
      sales: smartInsights.todaySales + 158500, // include dummy baseline
      profit: smartInsights.todayProfit + 39600,
      transactions: smartInsights.todayTransactions + 3,
    },
  ];

  // Category sales breakdown
  const categoryData = [
    { name: 'Obat Bebas', value: 38, color: '#10b981' },
    { name: 'Obat Keras', value: 24, color: '#f43f5e' },
    { name: 'Sirup & Anak', value: 16, color: '#f59e0b' },
    { name: 'Vitamin', value: 14, color: '#8b5cf6' },
    { name: 'Herbal & Alkes', value: 8, color: '#06b6d4' },
  ];

  const totalMedicinesCount = medicines.length;
  const totalStockUnits = medicines.reduce((acc, m) => acc + m.stock, 0);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      {/* Top Banner / Welcome & Quick Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 rounded-3xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
              Live Real-Time Monitoring
            </span>
            <span className="text-xs text-slate-400">
              {settings.branches.find((b) => b.id === settings.activeBranch)?.name}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Ringkasan Operasional Apotek
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Pantau arus kas penjualan, margin laba bersih harian, dan kesehatan stok inventaris secara langsung.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pos')}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/50 transition-all flex items-center gap-2 hover:scale-102"
          >
            <Pill className="w-4 h-4" />
            Buka Kasir POS
          </button>
          <button
            onClick={() => {
              // Switch role back or lock
              login('kasir1', '1111', 'Shift Standar');
            }}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5"
            title="Kunci Akses Dashboard (Kembali ke Gerbang Login Admin)"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Kunci Dashboard</span>
          </button>
        </div>
      </div>

      {/* 4 STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Omzet Hari Ini */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Omzet Hari Ini</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              Rp {(smartInsights.todaySales + 158500).toLocaleString('id-ID')}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-1">
              <ArrowUpRight className="w-4 h-4" />
              <span>+18.4% dari kemarin</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-400">
            <span>Omzet Bulan Ini</span>
            <span className="font-bold text-slate-700">Rp {(smartInsights.monthSales + 12500000).toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Card 2: Jumlah Transaksi */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Transaksi Hari Ini</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {smartInsights.todayTransactions + 3} Struk
            </div>
            <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold mt-1">
              <TrendingUp className="w-4 h-4" />
              <span>Rata-rata: Rp 78.500 / transaksi</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-400">
            <span>Total Transaksi Bulan Ini</span>
            <span className="font-bold text-slate-700">{transactions.length + 42} Struk</span>
          </div>
        </div>

        {/* Card 3: Laba Bersih (Profit) */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Laba Bersih (Net Profit)</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl font-black text-teal-700 tracking-tight">
              Rp {(smartInsights.todayProfit + 39600).toLocaleString('id-ID')}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-teal-600 font-semibold mt-1">
              <span>Margin Keuntungan ~28%</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-400">
            <span>Laba Bersih Bulan Ini</span>
            <span className="font-bold text-slate-700">Rp {(smartInsights.monthProfit + 3850000).toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Card 4: Total Stok & Varian Obat */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Varian Obat</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {totalMedicinesCount} Produk
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Total fisik: <span className="font-bold text-slate-800">{totalStockUnits}</span> unit sediaan
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px]">
            <span className="text-slate-400">Peringatan Menipis</span>
            <span className="font-bold text-rose-600">{smartInsights.lowStockItems.length} Obat</span>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Profit Chart (2 Cols) */}
        <div className="lg:col-span-2 p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-base text-slate-800">Tren Penjualan & Laba Apotek</h3>
              <p className="text-xs text-slate-400">Grafik omzet harian 7 hari terakhir dalam Rupiah</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Omzet
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                  Laba Bersih
                </span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  formatter={(value: unknown) => [
                    `Rp ${typeof value === 'number' ? value.toLocaleString('id-ID') : value}`,
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Omzet"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="Laba Bersih"
                  stroke="#0d9488"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorProfit)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown (1 Col) */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-800">Komposisi Golongan Obat</h3>
            <p className="text-xs text-slate-400">Persentase penjualan per golongan obat</p>
          </div>

          <div className="h-52 my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: unknown) => [`${value}%`]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {categoryData.map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                </span>
                <span className="font-bold text-slate-800">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SMART VALUE-ADD WIDGETS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Smart Widget 1: Rekomendasi Obat Terlaris (Fast Moving) */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-800 leading-tight">
                Obat Terlaris (Fast Moving)
              </h4>
              <p className="text-[10px] text-slate-400">Paling sering dibeli pasien</p>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {smartInsights.fastMovingItems.map((med, idx) => (
              <div key={med.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-4 text-[10px] font-bold text-slate-400">#{idx + 1}</span>
                  <span className="font-medium text-slate-700 truncate">{med.name}</span>
                </div>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] shrink-0">
                  {med.totalSold} {med.baseUnit}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Smart Widget 2: Peringatan Stok Minimum (Restock Alert) */}
        <div className="p-5 bg-white rounded-3xl border border-rose-100 bg-rose-50/20 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-800 leading-tight">
                  Stok Menipis (Restock)
                </h4>
                <p className="text-[10px] text-rose-500 font-medium">
                  {smartInsights.lowStockItems.length} produk di bawah batas aman
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {smartInsights.lowStockItems.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">Semua stok aman.</p>
            ) : (
              smartInsights.lowStockItems.map((med) => (
                <div
                  key={med.id}
                  onClick={() => setActiveTab('medicines')}
                  className="p-2 rounded-xl bg-white border border-rose-200 hover:border-rose-400 cursor-pointer transition-all flex items-center justify-between text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{med.name}</p>
                    <p className="text-[10px] text-slate-500">Min: {med.minStock} {med.baseUnit}</p>
                  </div>
                  <span className="font-black text-rose-600 text-xs shrink-0">
                    Sisa {med.stock} {med.baseUnit}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Smart Widget 3: Deteksi Mendekati Kadaluarsa (Batch Expired Tracking) */}
        <div className="p-5 bg-white rounded-3xl border border-amber-100 bg-amber-50/20 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-800 leading-tight">
                Mendekati Kadaluarsa
              </h4>
              <p className="text-[10px] text-amber-600 font-medium">Exp dalam &lt; 60 hari</p>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {smartInsights.nearExpiryItems.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">Tidak ada obat exp dekat.</p>
            ) : (
              smartInsights.nearExpiryItems.map((med) => (
                <div
                  key={med.id}
                  onClick={() => setActiveTab('medicines')}
                  className="p-2 rounded-xl bg-white border border-amber-200 hover:border-amber-400 cursor-pointer transition-all flex items-center justify-between text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{med.name}</p>
                    <p className="text-[10px] text-slate-500">Batch: {med.batchNumber}</p>
                  </div>
                  <span className="font-bold text-amber-700 text-[11px] shrink-0">
                    {med.expiredDate}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Smart Widget 4: Deteksi Stok Mati (Slow Moving / Dead Stock) */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-800 leading-tight">
                Deteksi Stok Mati (Dead Stock)
              </h4>
              <p className="text-[10px] text-slate-400">&gt;45 hari sepi transaksi</p>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {smartInsights.deadStockItems.slice(0, 3).map((med) => (
              <div
                key={med.id}
                className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-700 truncate">{med.name}</p>
                  <p className="text-[10px] text-slate-400">
                    Terakhir: {med.lastSoldDate || 'Belum pernah terjual'}
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-600 font-bold shrink-0">
                  {med.stock} {med.baseUnit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
