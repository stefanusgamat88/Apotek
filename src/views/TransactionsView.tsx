import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Ban,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Coins,
  CreditCard,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Printer,
  RotateCcw,
  Search,
  Trash2,
  TrendingUp,
  User,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Transaction } from '../types';
import {
  generateSalesReportPDF,
  formatRupiah,
  FinancialMetrics,
} from '../utils/reportPdfGenerator';
import { exportTransactionsRegisterXLSX } from '../utils/reportExcelGenerator';
import { MonthlyExcelExportModal } from '../components/MonthlyExcelExportModal';

export const TransactionsView: React.FC = () => {
  const {
    transactions,
    stockMovements,
    openReceipt,
    voidTransaction,
    currentUser,
    openSupervisorPrompt,
    settings,
    customers,
  } = useApp();

  // Audit Filter States
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'voided'>('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | '7days' | 'month' | 'last_month' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [customerQuery, setCustomerQuery] = useState<string>('');

  // Monthly archive export modal state
  const [showMonthlyExportModal, setShowMonthlyExportModal] = useState<boolean>(false);

  // Accordion row expansion
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Void modal state
  const [voidTarget, setVoidTarget] = useState<Transaction | null>(null);
  const [voidReason, setVoidReason] = useState('');

  // Handle Preset Date changes
  const handleDatePresetChange = (preset: 'all' | 'today' | '7days' | 'month' | 'last_month' | 'custom') => {
    setDatePreset(preset);
    const today = '2026-09-22'; // system anchor date
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (preset === '7days') {
      setStartDate('2026-09-15');
      setEndDate(today);
    } else if (preset === 'month') {
      setStartDate('2026-09-01');
      setEndDate('2026-09-30');
    } else if (preset === 'last_month') {
      setStartDate('2026-08-01');
      setEndDate('2026-08-31');
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setFilterStatus('all');
    setFilterMethod('all');
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
    setSelectedCustomer('all');
    setCustomerQuery('');
  };

  // Distinct customer list for dropdown
  const customerList = useMemo(() => {
    const list = new Set<string>();
    list.add('Pelanggan Umum');
    transactions.forEach((t) => {
      if (t.customerName?.trim()) list.add(t.customerName.trim());
    });
    customers.forEach((c) => {
      if (c.name?.trim()) list.add(c.name.trim());
    });
    return Array.from(list).sort((a, b) => (a === 'Pelanggan Umum' ? -1 : b === 'Pelanggan Umum' ? 1 : a.localeCompare(b)));
  }, [transactions, customers]);

  // Filter logic: Date Range + Customer Name + Status + Method + Search
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const txDate = t.timestamp.slice(0, 10);

      // 1. Date Range Filter
      const matchStartDate = !startDate || txDate >= startDate;
      const matchEndDate = !endDate || txDate <= endDate;

      // 2. Customer Filter (Dropdown & Specific Customer Search)
      const custName = t.customerName || 'Pelanggan Umum';
      const matchSelectedCustomer =
        selectedCustomer === 'all' ||
        custName.toLowerCase() === selectedCustomer.toLowerCase();

      const matchCustomerQuery =
        !customerQuery.trim() ||
        custName.toLowerCase().includes(customerQuery.toLowerCase().trim()) ||
        (t.customerPhone && t.customerPhone.includes(customerQuery.trim()));

      // 3. Status Filter
      const matchStatus = filterStatus === 'all' || t.status === filterStatus;

      // 4. Payment Method Filter
      const matchMethod = filterMethod === 'all' || t.paymentMethod === filterMethod;

      // 5. Keyword Search (Faktur, Kasir, Obat)
      const matchSearch =
        !search.trim() ||
        t.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        t.cashierName.toLowerCase().includes(search.toLowerCase()) ||
        t.items.some((it) => it.medicine.name.toLowerCase().includes(search.toLowerCase()));

      return (
        matchStartDate &&
        matchEndDate &&
        matchSelectedCustomer &&
        matchCustomerQuery &&
        matchStatus &&
        matchMethod &&
        matchSearch
      );
    });
  }, [
    transactions,
    startDate,
    endDate,
    selectedCustomer,
    customerQuery,
    filterStatus,
    filterMethod,
    search,
  ]);

  // Summary Metrics
  const summary = useMemo(() => {
    const completed = filteredTransactions.filter((t) => t.status === 'completed');
    const voided = filteredTransactions.filter((t) => t.status === 'voided');

    const totalOmzet = completed.reduce((sum, t) => sum + t.total, 0);
    const totalDiscount = completed.reduce((sum, t) => sum + (t.discount || 0), 0);
    const totalHPP = completed.reduce((sum, t) => sum + (t.totalHPP || Math.round(t.total * 0.72)), 0);
    const netProfit = completed.reduce((sum, t) => sum + (t.netProfit || totalOmzet - totalHPP), 0);
    const aov = completed.length > 0 ? Math.round(totalOmzet / completed.length) : 0;

    return {
      completedCount: completed.length,
      voidedCount: voided.length,
      totalOmzet,
      totalDiscount,
      totalHPP,
      netProfit,
      aov,
    };
  }, [filteredTransactions]);

  const handleConfirmVoid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidTarget || !voidReason.trim()) return;

    const targetId = voidTarget.id;
    const reason = voidReason;

    if (currentUser.role === 'kasir') {
      openSupervisorPrompt(
        `Otorisasi Void Faktur #${voidTarget.invoiceNumber}`,
        `Kasir (${currentUser.name}) memerlukan persetujuan Supervisor / Apoteker untuk membatalkan transaksi ini.`,
        () => {
          voidTransaction(targetId, reason);
          setVoidTarget(null);
          setVoidReason('');
        }
      );
      return;
    }

    voidTransaction(targetId, reason);
    setVoidTarget(null);
    setVoidReason('');
  };

  // Export PDF with full audit context
  const handleExportPDF = () => {
    let periodText = 'Seluruh Riwayat';
    if (startDate && endDate) {
      periodText = startDate === endDate ? `Tanggal ${startDate}` : `${startDate} s/d ${endDate}`;
    } else if (startDate) {
      periodText = `Mulai ${startDate}`;
    } else if (endDate) {
      periodText = `Sampai ${endDate}`;
    } else if (datePreset === 'today') {
      periodText = 'Hari Ini (22/09/2026)';
    } else if (datePreset === '7days') {
      periodText = '7 Hari Terakhir';
    } else if (datePreset === 'month') {
      periodText = 'Bulan September 2026';
    }

    if (selectedCustomer !== 'all') {
      periodText += ` • Pelanggan: ${selectedCustomer}`;
    } else if (customerQuery.trim()) {
      periodText += ` • Pelanggan: "${customerQuery.trim()}"`;
    }

    const filterInfo = {
      periodLabel: periodText,
      paymentMethod: filterMethod !== 'all' ? filterMethod : undefined,
      statusLabel: filterStatus === 'all' ? 'Semua' : filterStatus === 'completed' ? 'Lunas' : 'Void',
    };

    const metricsData: FinancialMetrics = {
      totalGrossSales: summary.totalOmzet + summary.totalDiscount,
      totalDiscount: summary.totalDiscount,
      totalNetSales: summary.totalOmzet,
      totalHPP: summary.totalHPP,
      grossProfit: summary.totalOmzet - summary.totalHPP,
      netProfit: summary.netProfit,
      marginPercent: summary.totalOmzet > 0 ? ((summary.netProfit / summary.totalOmzet) * 100).toFixed(1) : '0',
      transactionCount: summary.completedCount,
      averageOrderValue: summary.aov,
    };

    generateSalesReportPDF(filteredTransactions, settings, filterInfo, metricsData, currentUser.name);
  };

  // Export Excel (.xlsx) with full audit context
  const handleExportXLSX = () => {
    let periodLabel = 'Seluruh Transaksi';
    if (startDate && endDate) {
      periodLabel = startDate === endDate ? `Tanggal ${startDate}` : `${startDate} s/d ${endDate}`;
    } else if (startDate) {
      periodLabel = `Mulai ${startDate}`;
    } else if (endDate) {
      periodLabel = `Sampai ${endDate}`;
    } else if (datePreset === 'today') {
      periodLabel = 'Hari Ini (22/09/2026)';
    } else if (datePreset === '7days') {
      periodLabel = '7 Hari Terakhir';
    } else if (datePreset === 'month') {
      periodLabel = 'Bulan September 2026';
    }

    if (selectedCustomer !== 'all') {
      periodLabel += ` (Pelanggan: ${selectedCustomer})`;
    } else if (customerQuery.trim()) {
      periodLabel += ` (Pelanggan: ${customerQuery.trim()})`;
    }

    exportTransactionsRegisterXLSX(filteredTransactions, settings, periodLabel);
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      {/* 1. HEADER */}
      <div className="bg-white p-5 lg:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold tracking-wider uppercase">
              Riwayat Transaksi Penjualan
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-semibold">{settings.pharmacyName}</span>
          </div>
          <h2 className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight">
            Daftar Faktur & Struk Kasir
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola faktur penjualan apotek, cetak ulang struk thermal kasir, pembatalan void transaksi, dan ekspor arsip fisik.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
            title="Cetak langsung"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Cetak</span>
          </button>

          <button
            id="btn-export-excel-xlsx-transactions"
            onClick={handleExportXLSX}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-200 active:scale-95"
            title="Download spreadsheet Excel (.xlsx) dari filter saat ini"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>

          <button
            id="btn-export-monthly-archive-transactions"
            onClick={() => setShowMonthlyExportModal(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors flex items-center gap-1.5 border border-emerald-300 shadow-2xs active:scale-95 cursor-pointer"
            title="Ekspor Buku Kerja Arsip Bulanan Multi-Sheet (.xlsx)"
          >
            <Calendar className="w-4 h-4 text-emerald-700" />
            <span>Arsip Bulanan (.xlsx)</span>
          </button>

          <button
            id="btn-export-pdf-transactions"
            onClick={handleExportPDF}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition-all flex items-center gap-2 group"
          >
            <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            <span>Ekspor PDF Arsip</span>
          </button>
        </div>
      </div>

      {/* 2. KPI SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Total Omzet Lunas</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 tracking-tight">
            {formatRupiah(summary.totalOmzet)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{summary.completedCount} transaksi selesai</p>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Rata-Rata Transaksi (AOV)</span>
            <div className="w-7 h-7 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-800 tracking-tight">
            {formatRupiah(summary.aov)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Nilai rata-rata keranjang</p>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Laba Bersih Transaksi</span>
            <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-emerald-700 tracking-tight">
            {formatRupiah(summary.netProfit)}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Estimasi keuntungan</p>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Status Transaksi</span>
            <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-800">{filteredTransactions.length}</span>
            <span className="text-xs text-slate-400">Total</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[11px]">
            <span className="text-emerald-700 font-bold">{summary.completedCount} Lunas</span>
            {summary.voidedCount > 0 && (
              <span className="text-rose-600 font-bold">• {summary.voidedCount} Void</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. AUDIT & FILTER TOOLBAR */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                Pencarian & Filter Audit Riwayat Transaksi
              </h3>
              <p className="text-[11px] text-slate-400">
                Audit berdasarkan rentang tanggal dan nama pasien/pelanggan apotek.
              </p>
            </div>
          </div>

          {/* Preset Date Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Periode:
            </span>
            {[
              { id: 'all', label: 'Semua' },
              { id: 'today', label: 'Hari Ini' },
              { id: '7days', label: '7 Hari' },
              { id: 'month', label: 'Bulan Ini' },
              { id: 'last_month', label: 'Bulan Lalu' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleDatePresetChange(p.id as any)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  datePreset === p.id
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-200 border border-slate-200/80'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Filter Grid: Date Range & Customer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 text-xs">
          {/* Rentang Tanggal Filter */}
          <div className="lg:col-span-5 bg-slate-50/80 p-3 rounded-2xl border border-slate-200 space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px]">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              Rentang Tanggal Transaksi:
            </label>
            <div className="flex items-center gap-2">
              <input
                id="filter-start-date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-none focus:border-emerald-500"
              />
              <span className="text-slate-400 font-bold shrink-0">s/d</span>
              <input
                id="filter-end-date"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Filter Nama Pelanggan / Pasien */}
          <div className="lg:col-span-4 bg-slate-50/80 p-3 rounded-2xl border border-slate-200 space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-600" />
                Nama Pelanggan / Pasien:
              </span>
              {selectedCustomer !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCustomer('all')}
                  className="text-rose-600 hover:underline text-[10px]"
                >
                  Semua
                </button>
              )}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  id="filter-customer-query"
                  type="text"
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                  placeholder="Ketik nama / HP..."
                  className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>
              <select
                id="filter-customer-select"
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-emerald-500 truncate"
              >
                <option value="all">Semua Pasien</option>
                {customerList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Secondary Filters: Status & Metode */}
          <div className="lg:col-span-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-200 space-y-1.5">
            <label className="font-bold text-slate-700 block text-[11px]">
              Status & Metode Bayar:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Semua Status</option>
                <option value="completed">Lunas</option>
                <option value="voided">Void</option>
              </select>

              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Metode</option>
                <option value="cash">Tunai</option>
                <option value="qris">QRIS</option>
                <option value="dana">DANA</option>
                <option value="debit">Debit</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
          </div>
        </div>

        {/* Global Keyword Search & Reset Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari no. faktur, kasir, atau nama obat..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs text-slate-500 font-medium">
              Menampilkan <strong>{filteredTransactions.length}</strong> dari {transactions.length} faktur
            </span>

            {(startDate ||
              endDate ||
              datePreset !== 'all' ||
              selectedCustomer !== 'all' ||
              customerQuery.trim() ||
              filterStatus !== 'all' ||
              filterMethod !== 'all' ||
              search.trim()) && (
              <button
                id="btn-reset-audit-filter"
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Audit Filter Highlight Banner */}
        {(startDate ||
          endDate ||
          selectedCustomer !== 'all' ||
          customerQuery.trim() ||
          filterStatus !== 'all' ||
          filterMethod !== 'all') && (
          <div className="p-3 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Filter Audit Aktif:
              </span>
              {(startDate || endDate) && (
                <span className="px-2.5 py-1 rounded-xl bg-white text-emerald-800 font-bold border border-emerald-200 text-[11px] shadow-2xs">
                  📅 Periode: {startDate || 'Awal'} s/d {endDate || 'Hari ini'}
                </span>
              )}
              {selectedCustomer !== 'all' && (
                <span className="px-2.5 py-1 rounded-xl bg-white text-sky-800 font-bold border border-sky-200 text-[11px] shadow-2xs">
                  👤 Pelanggan: {selectedCustomer}
                </span>
              )}
              {customerQuery.trim() && (
                <span className="px-2.5 py-1 rounded-xl bg-white text-slate-800 font-bold border border-slate-200 text-[11px] shadow-2xs">
                  🔎 Cari Pasien: "{customerQuery.trim()}"
                </span>
              )}
              {filterStatus !== 'all' && (
                <span className="px-2 py-0.5 rounded-lg bg-white text-slate-700 font-bold border border-slate-200 text-[11px]">
                  Status: {filterStatus === 'completed' ? 'Lunas' : 'Void'}
                </span>
              )}
              {filterMethod !== 'all' && (
                <span className="px-2 py-0.5 rounded-lg bg-white text-slate-700 font-bold border border-slate-200 text-[11px] uppercase">
                  Metode: {filterMethod}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleResetFilters}
              className="text-rose-600 hover:text-rose-700 font-bold text-xs hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Hapus Filter
            </button>
          </div>
        )}
      </div>

      {/* 4. TRANSACTIONS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-3 w-8"></th>
                <th className="py-3.5 px-3">No. Faktur</th>
                <th className="py-3.5 px-3">Waktu Transaksi</th>
                <th className="py-3.5 px-3">Pasien / Pelanggan</th>
                <th className="py-3.5 px-3">Kasir & Cabang</th>
                <th className="py-3.5 px-3">Ringkasan Item</th>
                <th className="py-3.5 px-3">Total & Metode</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">Tidak ada riwayat transaksi</p>
                    <p className="text-xs mt-0.5">Sesuaikan kata kunci pencarian atau filter status.</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isVoided = tx.status === 'voided';
                  const isExpanded = expandedRowId === tx.id;

                  return (
                    <React.Fragment key={tx.id}>
                      <tr
                        className={`transition-colors ${
                          isVoided ? 'bg-rose-50/30' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setExpandedRowId(isExpanded ? null : tx.id)}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 flex items-center justify-center text-slate-500 transition-colors"
                            title="Rincian obat"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>

                        <td className="py-3 px-3 font-mono font-bold text-slate-800">
                          {tx.invoiceNumber}
                        </td>

                        <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                          {new Date(tx.timestamp).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-800">{tx.customerName || 'Pelanggan Umum'}</p>
                          {tx.customerPhone && (
                            <p className="text-[10px] text-slate-400">{tx.customerPhone}</p>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <p className="font-medium text-slate-700">{tx.cashierName}</p>
                          <p className="text-[10px] text-slate-400">{tx.branchName}</p>
                        </td>

                        <td className="py-3 px-3">
                          <div className="space-y-0.5 max-w-xs">
                            {tx.items.slice(0, 2).map((item, idx) => (
                              <p key={idx} className="text-[11px] text-slate-600 truncate">
                                {item.quantity} {item.selectedUnit.name} • {item.medicine.name}
                              </p>
                            ))}
                            {tx.items.length > 2 && (
                              <p className="text-[10px] text-slate-400 font-semibold">
                                +{tx.items.length - 2} obat lainnya...
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            <p className="font-extrabold text-xs text-slate-900">
                              {formatRupiah(tx.total)}
                            </p>
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-slate-100 text-slate-600">
                              {tx.paymentMethod}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          {isVoided ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                              Void / Batal
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Lunas Selesai
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openReceipt(tx)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors flex items-center gap-1 border border-emerald-200"
                              title="Cetak Ulang Struk Thermal"
                            >
                              <Printer className="w-3.5 h-3.5 text-emerald-600" />
                              Struk
                            </button>

                            {!isVoided && (
                              <button
                                onClick={() => setVoidTarget(tx)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Batalkan / Void Transaksi"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Accordion Item Breakdown */}
                      {isExpanded && (
                        <tr className="bg-emerald-50/20">
                          <td colSpan={9} className="py-3 px-6">
                            <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                              <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                                <span className="font-bold text-slate-800">
                                  Rincian Item Faktur #{tx.invoiceNumber}
                                </span>
                                <span className="text-slate-500 font-medium">
                                  Subtotal: {formatRupiah(tx.subtotal)}
                                  {tx.discount > 0 && ` | Diskon: ${formatRupiah(tx.discount)}`}
                                  {` | Total Bayar: ${formatRupiah(tx.total)}`}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {tx.items.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                                  >
                                    <div>
                                      <p className="font-bold text-slate-800 line-clamp-1">
                                        {item.medicine.name}
                                      </p>
                                      <p className="text-[11px] text-slate-500">
                                        {item.quantity} {item.selectedUnit.name} × {formatRupiah(item.unitPrice)}
                                      </p>
                                    </div>
                                    <p className="font-bold text-slate-900 shrink-0">
                                      {formatRupiah(item.subtotal)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              {tx.notes && (
                                <p className="text-[11px] text-slate-400 italic pt-1">
                                  Catatan transaksi: {tx.notes}
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
            {/* Grand Total Footer */}
            {filteredTransactions.length > 0 && (
              <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-800">
                <tr>
                  <td colSpan={6} className="py-3 px-4 text-right uppercase text-[11px]">
                    TOTAL FAKTUR TERPILIH:
                  </td>
                  <td className="py-3 px-3 font-black text-slate-900 text-sm">
                    {formatRupiah(summary.totalOmzet)}
                  </td>
                  <td colSpan={2} className="py-3 px-4 text-right text-xs text-slate-500">
                    {summary.completedCount} Lunas ({filteredTransactions.length} Faktur)
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* 5. MODAL: VOID TRANSAKSI */}
      {voidTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 text-xs">
            <div className="flex items-center gap-2.5 text-rose-600 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">
                Batalkan (Void) Transaksi
              </h3>
            </div>
            <p className="text-slate-500 mb-4">
              Anda akan membatalkan faktur{' '}
              <strong className="text-slate-800 font-mono">#{voidTarget.invoiceNumber}</strong> senilai{' '}
              <strong className="text-rose-600">{formatRupiah(voidTarget.total)}</strong>.
              Stok obat yang telah terjual akan otomatis dikembalikan ke gudang/kartu stok.
            </p>

            <form onSubmit={handleConfirmVoid} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alasan Pembatalan Faktur <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="Misal: Pasien salah membeli obat, retur resep dokter, salah input kasir..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setVoidTarget(null);
                    setVoidReason('');
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20"
                >
                  Konfirmasi Void
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Ekspor Arsip Bulanan Excel (.xlsx) */}
      <MonthlyExcelExportModal
        isOpen={showMonthlyExportModal}
        onClose={() => setShowMonthlyExportModal(false)}
        transactions={transactions}
        stockMovements={stockMovements}
        settings={settings}
        defaultPharmacistName={currentUser.name}
      />
    </div>
  );
};
