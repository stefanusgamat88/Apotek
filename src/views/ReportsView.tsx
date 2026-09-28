import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Coins,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Package,
  Printer,
  RotateCcw,
  Search,
  Sparkles,
  TrendingUp,
  User,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Building,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Transaction } from '../types';
import {
  generateSalesReportPDF,
  generateProfitLossPDF,
  formatRupiah,
  FinancialMetrics,
} from '../utils/reportPdfGenerator';
import {
  exportSalesReportXLSX,
  exportProfitLossXLSX,
  exportStockMovementsXLSX,
} from '../utils/reportExcelGenerator';
import { MonthlyExcelExportModal } from '../components/MonthlyExcelExportModal';

export const ReportsView: React.FC = () => {
  const { transactions, stockMovements, medicines, settings, openReceipt, currentUser } = useApp();

  // Navigation sub-tab: 'sales' | 'profit' | 'stock'
  const [reportType, setReportType] = useState<'sales' | 'profit' | 'stock'>('sales');

  // Monthly archive export modal state
  const [showMonthlyExportModal, setShowMonthlyExportModal] = useState<boolean>(false);

  // Filter States
  const [dateRangePreset, setDateRangePreset] = useState<'today' | '7days' | 'this_month' | 'last_month' | 'custom'>('this_month');
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-09-30');
  const [filterCashier, setFilterCashier] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'voided'>('completed');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Row accordion expansion state for sales table
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Handle Preset Date selection
  const handlePresetChange = (preset: 'today' | '7days' | 'this_month' | 'last_month' | 'custom') => {
    setDateRangePreset(preset);
    const today = '2026-09-22'; // System mock anchor date
    if (preset === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (preset === '7days') {
      setStartDate('2026-09-15');
      setEndDate(today);
    } else if (preset === 'this_month') {
      setStartDate('2026-09-01');
      setEndDate('2026-09-30');
    } else if (preset === 'last_month') {
      setStartDate('2026-08-01');
      setEndDate('2026-08-31');
    }
  };

  // Filtered Transactions
  const filteredTxs = useMemo(() => {
    return transactions.filter((t) => {
      // Date filter
      const txDate = t.timestamp.slice(0, 10);
      const matchDate = (!startDate || txDate >= startDate) && (!endDate || txDate <= endDate);

      // Status filter
      const matchStatus = filterStatus === 'all' || t.status === filterStatus;

      // Cashier filter
      const matchCashier = filterCashier === 'all' || t.cashierName.toLowerCase().includes(filterCashier.toLowerCase());

      // Payment method filter
      const matchMethod = filterMethod === 'all' || t.paymentMethod === filterMethod;

      // Search query
      const matchQuery =
        !searchQuery.trim() ||
        t.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.cashierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.items.some((it) => it.medicine.name.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchDate && matchStatus && matchCashier && matchMethod && matchQuery;
    });
  }, [transactions, startDate, endDate, filterStatus, filterCashier, filterMethod, searchQuery]);

  // Financial Metrics Calculation
  const metrics: FinancialMetrics = useMemo(() => {
    const validTxs = filteredTxs.filter((t) => t.status === 'completed');

    const totalGrossSales = validTxs.reduce((sum, t) => sum + (t.subtotal || t.total), 0);
    const totalDiscount = validTxs.reduce((sum, t) => sum + (t.discount || 0), 0);
    const totalNetSales = validTxs.reduce((sum, t) => sum + t.total, 0);
    const totalHPP = validTxs.reduce((sum, t) => sum + (t.totalHPP || Math.round(t.total * 0.72)), 0);
    const grossProfit = totalNetSales - totalHPP;
    const netProfit = validTxs.reduce((sum, t) => sum + (t.netProfit || grossProfit), 0);
    const marginPercent = totalNetSales > 0 ? ((netProfit / totalNetSales) * 100).toFixed(1) : '0';
    const transactionCount = validTxs.length;
    const averageOrderValue = transactionCount > 0 ? Math.round(totalNetSales / transactionCount) : 0;

    return {
      totalGrossSales,
      totalDiscount,
      totalNetSales,
      totalHPP,
      grossProfit,
      netProfit,
      marginPercent,
      transactionCount,
      averageOrderValue,
    };
  }, [filteredTxs]);

  // Breakdown by Payment Method
  const paymentBreakdown = useMemo(() => {
    const validTxs = filteredTxs.filter((t) => t.status === 'completed');
    const breakdown: Record<string, { count: number; total: number }> = {
      cash: { count: 0, total: 0 },
      qris: { count: 0, total: 0 },
      dana: { count: 0, total: 0 },
      debit: { count: 0, total: 0 },
      transfer: { count: 0, total: 0 },
    };

    validTxs.forEach((t) => {
      const method = t.paymentMethod || 'cash';
      if (!breakdown[method]) {
        breakdown[method] = { count: 0, total: 0 };
      }
      breakdown[method].count += 1;
      breakdown[method].total += t.total;
    });

    return breakdown;
  }, [filteredTxs]);

  // Period label for headers & PDFs
  const periodLabel = useMemo(() => {
    if (startDate === endDate) return startDate;
    return `${startDate} s/d ${endDate}`;
  }, [startDate, endDate]);

  // Export handlers
  const handleExportPDF = () => {
    const filterInfo = {
      periodLabel,
      startDate,
      endDate,
      cashierName: filterCashier !== 'all' ? filterCashier : undefined,
      paymentMethod: filterMethod !== 'all' ? filterMethod : undefined,
      statusLabel: filterStatus === 'all' ? 'Semua' : filterStatus === 'completed' ? 'Lunas' : 'Void',
    };

    if (reportType === 'sales') {
      generateSalesReportPDF(filteredTxs, settings, filterInfo, metrics, currentUser.name);
    } else {
      generateProfitLossPDF(filteredTxs, settings, filterInfo, metrics, currentUser.name);
    }
  };

  const handleExportXLSX = () => {
    const filterInfo = {
      periodLabel,
      startDate,
      endDate,
      cashierName: filterCashier !== 'all' ? filterCashier : undefined,
      paymentMethod: filterMethod !== 'all' ? filterMethod : undefined,
      statusLabel: filterStatus === 'all' ? 'Semua' : filterStatus === 'completed' ? 'Lunas' : 'Void',
    };

    if (reportType === 'sales') {
      exportSalesReportXLSX(filteredTxs, settings, filterInfo, metrics, currentUser.name);
    } else if (reportType === 'profit') {
      exportProfitLossXLSX(filteredTxs, settings, filterInfo, metrics, currentUser.name);
    } else {
      exportStockMovementsXLSX(stockMovements, settings, periodLabel);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      {/* 1. MAIN HEADER WITH PHARMACY BRAND & ACTIONS */}
      <div className="bg-white p-5 lg:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold tracking-wider uppercase">
              Modul Pelaporan Eksekutif
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-semibold">{settings.pharmacyName}</span>
          </div>
          <h2 className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight">
            Laporan Penjualan & Laba Rugi Apotek
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit rincian transaksi kasir, analisis margin keuntungan HPP, serta ekspor format PDF fisik & Excel.
          </p>
        </div>

        {/* Action Buttons: PDF, Excel, Print */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
            title="Cetak langsung ke printer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Cetak</span>
          </button>

          <button
            id="btn-export-excel-xlsx"
            onClick={handleExportXLSX}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-200 active:scale-95"
            title="Download spreadsheet Excel (.xlsx) dari tab aktif"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>

          <button
            id="btn-export-monthly-archive-reports"
            onClick={() => setShowMonthlyExportModal(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors flex items-center gap-1.5 border border-emerald-300 shadow-2xs active:scale-95 cursor-pointer"
            title="Ekspor Buku Kerja Arsip Bulanan Multi-Sheet Lengkap (.xlsx)"
          >
            <Calendar className="w-4 h-4 text-emerald-700" />
            <span>Arsip Bulanan (.xlsx)</span>
          </button>

          <button
            id="btn-export-pdf-report"
            onClick={handleExportPDF}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition-all flex items-center gap-2 group"
          >
            <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            <span>Ekspor PDF Resmi</span>
          </button>
        </div>
      </div>

      {/* 2. SUB-TAB BAR & PRESET FILTERS */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Main Subtabs */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
            <button
              onClick={() => setReportType('sales')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                reportType === 'sales'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Coins className="w-4 h-4 text-emerald-600" />
              Laporan Penjualan Kasir
            </button>
            <button
              onClick={() => setReportType('profit')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                reportType === 'profit'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-teal-600" />
              Laba Rugi (Income Statement)
            </button>
            <button
              onClick={() => setReportType('stock')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                reportType === 'stock'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4 text-amber-600" />
              Mutasi Persediaan Stok
            </button>
          </div>

          {/* Preset Date Selectors */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Periode:
            </span>
            {[
              { id: 'today', label: 'Hari Ini' },
              { id: '7days', label: '7 Hari' },
              { id: 'this_month', label: 'Bulan Ini' },
              { id: 'last_month', label: 'Bulan Lalu' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetChange(p.id as any)}
                className={`px-2.5 py-1.5 rounded-xl font-bold transition-all ${
                  dateRangePreset === p.id
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-200 border border-slate-200/80'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1 text-xs">
          {/* Date range picker */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 lg:col-span-2">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="flex items-center gap-2 flex-1">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDateRangePreset('custom');
                }}
                className="w-full bg-transparent text-slate-700 font-semibold focus:outline-none"
              />
              <span className="text-slate-400 font-bold">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDateRangePreset('custom');
                }}
                className="w-full bg-transparent text-slate-700 font-semibold focus:outline-none"
              />
            </div>
          </div>

          {/* Cashier Filter */}
          <select
            value={filterCashier}
            onChange={(e) => setFilterCashier(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Kasir / Operator</option>
            <option value="Admin">Admin Pemilik</option>
            <option value="Siti">Siti Rahma</option>
            <option value="Budi">Budi Santoso</option>
          </select>

          {/* Payment Method Filter */}
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Pembayaran</option>
            <option value="cash">Tunai (Cash)</option>
            <option value="qris">QRIS Dinamis</option>
            <option value="dana">DANA</option>
            <option value="debit">Kartu Debit</option>
            <option value="transfer">Transfer Bank</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:border-emerald-500"
          >
            <option value="completed">Status: Selesai / Lunas</option>
            <option value="voided">Status: Dibatalkan (Void)</option>
            <option value="all">Status: Semua Transaksi</option>
          </select>
        </div>

        {/* Search bar inside filter */}
        <div className="relative pt-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari cepat nomor faktur, nama pasien, kasir, atau nama obat..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-medium"
          />
        </div>
      </div>

      {/* 3. EXECUTIVE FINANCIAL KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Omzet Penjualan Bersih */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Penjualan Bersih</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 tracking-tight">
            {formatRupiah(metrics.totalNetSales)}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
            <span>{metrics.transactionCount} faktur lunas</span>
            {metrics.totalDiscount > 0 && (
              <span className="text-amber-600 font-semibold">
                (Diskon: {formatRupiah(metrics.totalDiscount)})
              </span>
            )}
          </div>
        </div>

        {/* Total HPP Modal Pengadaan */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>HPP Modal Obat</span>
            <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-700 tracking-tight">
            {formatRupiah(metrics.totalHPP)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Biaya pokok barang PBF</p>
        </div>

        {/* Laba Kotor Apotek */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Laba Kotor (Gross)</span>
            <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-teal-700 tracking-tight">
            {formatRupiah(metrics.grossProfit)}
          </p>
          <p className="text-[11px] text-teal-600 font-semibold mt-1">
            Selisih Penjualan - HPP
          </p>
        </div>

        {/* Laba Bersih Apotek */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-white to-white border-2 border-emerald-500/30 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold mb-1">
            <span>Laba Bersih Apotek</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-emerald-800 tracking-tight">
            {formatRupiah(metrics.netProfit)}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
              Margin {metrics.marginPercent}%
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold">Tingkat Sehat</span>
          </div>
        </div>

        {/* Rata-rata Belanja (AOV) */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Rata-Rata Transaksi</span>
            <div className="w-7 h-7 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-800 tracking-tight">
            {formatRupiah(metrics.averageOrderValue)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Nilai belanja per struk</p>
        </div>
      </div>

      {/* 4. SUB-CONTENT 1: LAPORAN PENJUALAN TABLE */}
      {reportType === 'sales' && (
        <div className="space-y-4">
          {/* Payment Method Quick Summary Badges */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Ringkasan Metode Pembayaran:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-semibold">
                💵 Tunai: <strong>{formatRupiah(paymentBreakdown.cash?.total || 0)}</strong> ({paymentBreakdown.cash?.count || 0})
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                📱 QRIS: <strong>{formatRupiah(paymentBreakdown.qris?.total || 0)}</strong> ({paymentBreakdown.qris?.count || 0})
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-sky-50 text-sky-800 font-semibold border border-sky-200">
                💳 Debit: <strong>{formatRupiah(paymentBreakdown.debit?.total || 0)}</strong> ({paymentBreakdown.debit?.count || 0})
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 font-semibold border border-blue-200">
                💎 DANA: <strong>{formatRupiah(paymentBreakdown.dana?.total || 0)}</strong> ({paymentBreakdown.dana?.count || 0})
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-800 font-semibold border border-purple-200">
                🏦 Transfer: <strong>{formatRupiah(paymentBreakdown.transfer?.total || 0)}</strong> ({paymentBreakdown.transfer?.count || 0})
              </span>
            </div>
          </div>

          {/* Interactive Transactions Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800">
                  Rincian Penjualan per Faktur Kasir
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Klik tanda panah untuk melihat rincian obat yang dibeli dalam faktur.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                Total {filteredTxs.length} Faktur Ditampilkan
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-3 w-8"></th>
                    <th className="py-3.5 px-3">No. Faktur</th>
                    <th className="py-3.5 px-3">Waktu Transaksi</th>
                    <th className="py-3.5 px-3">Pelanggan / Pasien</th>
                    <th className="py-3.5 px-3">Kasir</th>
                    <th className="py-3.5 px-3">Metode Bayar</th>
                    <th className="py-3.5 px-3 text-right">Subtotal</th>
                    <th className="py-3.5 px-3 text-right">Diskon</th>
                    <th className="py-3.5 px-3 text-right">Total Akhir</th>
                    <th className="py-3.5 px-3 text-right">Laba Bersih</th>
                    <th className="py-3.5 px-3 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTxs.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-slate-400">
                        <Coins className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-slate-600">Tidak ada transaksi ditemukan</p>
                        <p className="text-xs mt-0.5">Sesuaikan filter tanggal atau kata kunci pencarian Anda.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTxs.map((t) => {
                      const isExpanded = expandedRowId === t.id;
                      const isVoid = t.status === 'voided';

                      return (
                        <React.Fragment key={t.id}>
                          <tr
                            className={`transition-colors ${
                              isVoid ? 'bg-rose-50/40 text-slate-400' : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => setExpandedRowId(isExpanded ? null : t.id)}
                                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 flex items-center justify-center text-slate-500 transition-colors"
                                title="Lihat item obat"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-800">
                              {t.invoiceNumber}
                            </td>
                            <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                              {new Date(t.timestamp).toLocaleString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-700">
                              {t.customerName || 'Pelanggan Umum'}
                            </td>
                            <td className="py-3 px-3 text-slate-600">{t.cashierName}</td>
                            <td className="py-3 px-3">
                              <span className="uppercase font-bold text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                {t.paymentMethod}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right text-slate-600 font-medium">
                              {formatRupiah(t.subtotal)}
                            </td>
                            <td className="py-3 px-3 text-right text-amber-600 font-semibold">
                              {t.discount > 0 ? formatRupiah(t.discount) : '-'}
                            </td>
                            <td className="py-3 px-3 text-right font-black text-slate-900">
                              {formatRupiah(t.total)}
                            </td>
                            <td className="py-3 px-3 text-right font-black text-emerald-700">
                              {formatRupiah(t.netProfit)}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {t.status === 'completed' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  Lunas
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  Void
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => openReceipt(t)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] flex items-center justify-center gap-1 mx-auto transition-colors border border-emerald-200"
                              >
                                <Eye className="w-3 h-3" />
                                Struk
                              </button>
                            </td>
                          </tr>

                          {/* Accordion Expanded Row: Itemized Products */}
                          {isExpanded && (
                            <tr className="bg-emerald-50/30">
                              <td colSpan={12} className="py-3 px-6">
                                <div className="p-3 bg-white rounded-2xl border border-emerald-200/80 shadow-2xs space-y-2">
                                  <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                                    <span className="font-bold text-slate-800">
                                      Daftar Obat & Alkes pada Faktur #{t.invoiceNumber}
                                    </span>
                                    <span className="text-slate-500 font-medium">
                                      {t.items.length} macam produk • Kasir: {t.cashierName}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {t.items.map((item, idx) => (
                                      <div
                                        key={idx}
                                        className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                                      >
                                        <div>
                                          <p className="font-bold text-slate-800 line-clamp-1">
                                            {item.medicine.name}
                                          </p>
                                          <p className="text-[11px] text-slate-500">
                                            {item.quantity} {item.selectedUnit.name} × {formatRupiah(item.unitPrice)}
                                            {item.discountPercent > 0 && ` (Disc ${item.discountPercent}%)`}
                                          </p>
                                        </div>
                                        <p className="font-bold text-slate-900 shrink-0">
                                          {formatRupiah(item.subtotal)}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
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
                {filteredTxs.length > 0 && (
                  <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-800">
                    <tr>
                      <td colSpan={6} className="py-3 px-4 text-right uppercase text-[11px]">
                        GRAND TOTAL PERIODE INI:
                      </td>
                      <td className="py-3 px-3 text-right font-black">
                        {formatRupiah(metrics.totalGrossSales)}
                      </td>
                      <td className="py-3 px-3 text-right text-amber-600 font-black">
                        {metrics.totalDiscount > 0 ? formatRupiah(metrics.totalDiscount) : '-'}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-900 font-black text-sm">
                        {formatRupiah(metrics.totalNetSales)}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-700 font-black text-sm">
                        {formatRupiah(metrics.netProfit)}
                      </td>
                      <td colSpan={2} className="py-3 px-4 text-center text-xs text-slate-500">
                        {metrics.transactionCount} faktur
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. SUB-CONTENT 2: LAPORAN LABA RUGI (INCOME STATEMENT) */}
      {reportType === 'profit' && (
        <div className="space-y-5">
          {/* Formal Income Statement Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Format Laporan Laba Rugi Komprehensif (Income Statement)
                </h3>
                <p className="text-xs text-slate-500">
                  Perhitungan standar akuntansi apotek: Pendapatan Bruto - Diskon - HPP - Biaya Operasional = Laba Bersih.
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-slate-100 text-slate-600">
                Periode: {periodLabel}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Section 1: Revenue */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center font-bold text-slate-800 text-sm">
                  <span>1. PENDAPATAN OPERASIONAL USAHA</span>
                  <span>{formatRupiah(metrics.totalNetSales)}</span>
                </div>
                <div className="flex justify-between text-slate-600 pl-4">
                  <span>• Penjualan Kotor Obat & Alkes (Gross Sales)</span>
                  <span className="font-semibold">{formatRupiah(metrics.totalGrossSales)}</span>
                </div>
                <div className="flex justify-between text-slate-600 pl-4">
                  <span>• Potongan & Diskon Promosi Penjualan (-)</span>
                  <span className="font-semibold text-rose-600">
                    ({metrics.totalDiscount > 0 ? formatRupiah(metrics.totalDiscount) : 'Rp 0'})
                  </span>
                </div>
                <div className="flex justify-between font-bold text-emerald-800 border-t border-slate-200 pt-1.5 pl-4">
                  <span>= Total Penjualan Bersih (Net Revenue)</span>
                  <span>{formatRupiah(metrics.totalNetSales)}</span>
                </div>
              </div>

              {/* Section 2: COGS / HPP */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center font-bold text-slate-800 text-sm">
                  <span>2. BEBAN POKOK PENJUALAN (HPP)</span>
                  <span className="text-slate-800 font-bold">({formatRupiah(metrics.totalHPP)})</span>
                </div>
                <div className="flex justify-between text-slate-600 pl-4">
                  <span>• Harga Pokok Pembelian Obat Terjual (Faktur PBF Resmi)</span>
                  <span className="font-semibold text-slate-700">({formatRupiah(metrics.totalHPP)})</span>
                </div>
              </div>

              {/* Section 3: Gross Profit */}
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex justify-between items-center font-black text-teal-900 text-sm">
                <span>3. LABA KOTOR APOTEK (GROSS PROFIT)</span>
                <div className="text-right">
                  <p className="text-base">{formatRupiah(metrics.grossProfit)}</p>
                  <p className="text-[11px] font-semibold text-teal-700">
                    Margin Kotor: {metrics.marginPercent}%
                  </p>
                </div>
              </div>

              {/* Section 4: Operating Expenses */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center font-bold text-slate-800 text-sm">
                  <span>4. ESTIMASI BEBAN OPERASIONAL PENJUALAN</span>
                  <span className="text-slate-800 font-bold">
                    ({formatRupiah(Math.round(metrics.totalNetSales * 0.01))})
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 pl-4">
                  <span>• Beban Kemasan, Klip & Plastik Etiket Obat (0.8%)</span>
                  <span>({formatRupiah(Math.round(metrics.totalNetSales * 0.008))})</span>
                </div>
                <div className="flex justify-between text-slate-600 pl-4">
                  <span>• Biaya Administrasi Settlement & MDR QRIS (0.2%)</span>
                  <span>({formatRupiah(Math.round(metrics.totalNetSales * 0.002))})</span>
                </div>
              </div>

              {/* Section 5: Net Profit */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md flex justify-between items-center">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-emerald-100">
                    5. LABA BERSIH AKHIR (NET OPERATING PROFIT)
                  </span>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Telah memperhitungkan seluruh modal obat dan beban operasional terkait.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black">
                    {formatRupiah(metrics.grossProfit - Math.round(metrics.totalNetSales * 0.01))}
                  </p>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 text-white mt-1 inline-block">
                    Margin Bersih: {metrics.marginPercent}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Margin per Transaction Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800">
                  Rincian Margin Keuntungan per Faktur
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Analisis perbandingan omzet penjualan terhadap modal beli barang (HPP).
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {filteredTxs.length} Transaksi Terhitung
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">No. Faktur</th>
                    <th className="py-3 px-3">Tanggal</th>
                    <th className="py-3 px-3">Item Terjual</th>
                    <th className="py-3 px-3 text-right">Omzet Jual</th>
                    <th className="py-3 px-3 text-right">HPP Modal</th>
                    <th className="py-3 px-3 text-right">Laba Bersih</th>
                    <th className="py-3 px-4 text-center">Margin %</th>
                    <th className="py-3 px-3 text-center">Tingkat Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTxs.map((t) => {
                    const margin = t.total > 0 ? (t.netProfit / t.total) * 100 : 0;
                    const marginStr = margin.toFixed(1);

                    return (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-800">
                          {t.invoiceNumber}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {new Date(t.timestamp).toLocaleDateString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                          {t.items.map((it) => `${it.medicine.name} (${it.quantity})`).join(', ')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                          {formatRupiah(t.total)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-500 font-medium">
                          {formatRupiah(t.totalHPP)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-700">
                          {formatRupiah(t.netProfit)}
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold text-slate-800">
                          {marginStr}%
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {margin >= 30 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Tinggi &gt;30%
                            </span>
                          ) : margin >= 15 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                              Normal
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              Tipis &lt;15%
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-800">
                  <tr>
                    <td colSpan={3} className="py-3 px-4 text-right uppercase text-[11px]">
                      TOTAL KESELURUHAN:
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-900">
                      {formatRupiah(metrics.totalNetSales)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-700 font-black">
                      {formatRupiah(metrics.totalHPP)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-700 font-black text-sm">
                      {formatRupiah(metrics.netProfit)}
                    </td>
                    <td className="py-3 px-4 text-center font-black text-emerald-800">
                      {metrics.marginPercent}%
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. SUB-CONTENT 3: MUTASI STOK BARANG */}
      {reportType === 'stock' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                Log Mutasi Keluar & Masuk Persediaan Obat
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Kartu kontrol stok apotek berdasarkan pergerakan penjualan dan restock PBF.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {stockMovements.length} Log Mutasi
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-3">Nama Obat</th>
                  <th className="py-3 px-3">Tipe Mutasi</th>
                  <th className="py-3 px-3 text-right">Perubahan Qty</th>
                  <th className="py-3 px-3 text-center">Saldo Awal</th>
                  <th className="py-3 px-3 text-center">Saldo Akhir</th>
                  <th className="py-3 px-4">Referensi / No. Faktur</th>
                  <th className="py-3 px-3">Petugas Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockMovements.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono text-slate-500">{s.date}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">{s.medicineName}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`uppercase text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          s.type === 'in'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.type === 'out'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {s.type === 'in' ? 'Masuk (In)' : s.type === 'out' ? 'Keluar (Out)' : 'Penyesuaian'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      <span className={s.qtyChange > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {s.qtyChange > 0 ? `+${s.qtyChange}` : s.qtyChange} {s.unit}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">{s.previousStock}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">{s.currentStock}</td>
                    <td className="py-2.5 px-4 text-slate-600 font-mono text-[11px]">{s.refNumber}</td>
                    <td className="py-2.5 px-3 text-slate-600">{s.operator}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Ekspor Buku Kerja Arsip Bulanan Excel (.xlsx) */}
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
