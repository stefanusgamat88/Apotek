import React, { useState, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  Calendar,
  CheckSquare,
  Square,
  ShieldCheck,
  TrendingUp,
  Coins,
  Receipt,
  UserCheck,
  Sparkles,
  Info,
} from 'lucide-react';
import { Transaction, StockMovement, PharmacySettings } from '../types';
import { exportMonthlyArchiveXLSX } from '../utils/reportExcelGenerator';

interface MonthlyExcelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  stockMovements: StockMovement[];
  settings: PharmacySettings;
  defaultPharmacistName?: string;
}

export const MonthlyExcelExportModal: React.FC<MonthlyExcelExportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  stockMovements,
  settings,
  defaultPharmacistName = 'Apoteker Penanggung Jawab',
}) => {
  // Available months extracted from transaction data plus standard defaults
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    // Default current month anchor
    set.add('2026-09');
    set.add('2026-08');
    set.add('2026-07');
    transactions.forEach((t) => {
      if (t.timestamp && t.timestamp.length >= 7) {
        set.add(t.timestamp.slice(0, 7));
      }
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const [selectedMonthYear, setSelectedMonthYear] = useState<string>('2026-09');
  const [pharmacistName, setPharmacistName] = useState<string>(defaultPharmacistName);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Sheet toggles
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeTransactions, setIncludeTransactions] = useState(true);
  const [includeMedicines, setIncludeMedicines] = useState(true);
  const [includePayments, setIncludePayments] = useState(true);
  const [includeStock, setIncludeStock] = useState(true);

  // Month Statistics Preview
  const monthlyStats = useMemo(() => {
    const monthlyTxs = transactions.filter((t) => t.timestamp.startsWith(selectedMonthYear));
    const completed = monthlyTxs.filter((t) => t.status === 'completed');
    const voided = monthlyTxs.filter((t) => t.status === 'voided');

    const totalGross = completed.reduce((sum, t) => sum + (t.subtotal || t.total), 0);
    const totalDiscount = completed.reduce((sum, t) => sum + (t.discount || 0), 0);
    const totalNet = completed.reduce((sum, t) => sum + t.total, 0);
    const totalHPP = completed.reduce((sum, t) => sum + (t.totalHPP || Math.round(t.total * 0.72)), 0);
    const netProfit = completed.reduce((sum, t) => sum + (t.netProfit || totalNet - totalHPP), 0);

    const monthlyStockLogs = stockMovements.filter((s) => s.date.startsWith(selectedMonthYear));

    // Calculate unique medicines sold
    const itemIds = new Set<string>();
    completed.forEach((t) => {
      t.items.forEach((it) => itemIds.add(it.medicine.id));
    });

    return {
      totalCount: monthlyTxs.length,
      completedCount: completed.length,
      voidedCount: voided.length,
      totalGross,
      totalDiscount,
      totalNet,
      totalHPP,
      netProfit,
      uniqueMedicinesCount: itemIds.size,
      stockMovementCount: monthlyStockLogs.length,
    };
  }, [transactions, stockMovements, selectedMonthYear]);

  if (!isOpen) return null;

  const [yearStr, monthStr] = selectedMonthYear.split('-');
  const monthNum = parseInt(monthStr, 10) || 9;
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const monthLabel = `${monthNames[monthNum - 1] || 'September'} ${yearStr}`;

  const handleDownload = () => {
    setIsExporting(true);
    setTimeout(() => {
      exportMonthlyArchiveXLSX(
        selectedMonthYear,
        transactions,
        stockMovements,
        settings,
        pharmacistName || defaultPharmacistName,
        {
          includeSummary,
          includeTransactions,
          includeMedicines,
          includePayments,
          includeStock,
        }
      );
      setIsExporting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-200 animate-in zoom-in-95">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight text-white">
                  Ekspor Arsip Bulanan Excel (.xlsx)
                </h3>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-200 font-extrabold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Resmi Apoteker
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                {settings.pharmacyName} • Format Buku Kerja Multi-Sheet untuk Audit Eksternal
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh] custom-scrollbar text-xs">
          {/* 1. Selection Options: Month & Pharmacist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pilih Periode Bulan & Tahun:</span>
              </label>
              <select
                id="select-monthly-archive-period"
                value={selectedMonthYear}
                onChange={(e) => setSelectedMonthYear(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:outline-none focus:border-emerald-500"
              >
                {availableMonths.map((ym) => {
                  const [y, m] = ym.split('-');
                  const idx = parseInt(m, 10) - 1;
                  const label = `${monthNames[idx] || m} ${y}`;
                  return (
                    <option key={ym} value={ym}>
                      {label} ({ym})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Apoteker / Penanggung Jawab:</span>
              </label>
              <input
                id="input-pharmacist-name"
                type="text"
                value={pharmacistName}
                onChange={(e) => setPharmacistName(e.target.value)}
                placeholder="Nama Apoteker / Petugas"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* 2. Monthly Summary Preview Card */}
          <div className="p-4 bg-gradient-to-br from-slate-50 to-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200/60">
              <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-700" />
                Ringkasan Data {monthLabel}:
              </span>
              <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-full">
                {monthlyStats.completedCount} Faktur Lunas
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
              <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 block">Total Omzet Bersih</span>
                <span className="font-black text-xs text-slate-900 block mt-0.5">
                  Rp {monthlyStats.totalNet.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 block">Laba Bersih</span>
                <span className="font-black text-xs text-emerald-700 block mt-0.5">
                  Rp {monthlyStats.netProfit.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 block">Jenis Obat Terjual</span>
                <span className="font-black text-xs text-slate-800 block mt-0.5">
                  {monthlyStats.uniqueMedicinesCount} Obat
                </span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 block">Log Mutasi Stok</span>
                <span className="font-black text-xs text-slate-800 block mt-0.5">
                  {monthlyStats.stockMovementCount} Mutasi
                </span>
              </div>
            </div>
          </div>

          {/* 3. Worksheet (Sheet) Checklist */}
          <div className="space-y-2">
            <span className="font-extrabold text-slate-800 block text-xs">
              Lembar Kerja (Sheet) yang Disertakan ke Dalam File Excel:
            </span>

            <div className="space-y-1.5">
              {[
                {
                  id: 'summary',
                  label: 'Sheet 1: Ringkasan Eksekutif & Laba Rugi',
                  desc: 'KFI finansial, total omzet, HPP, estimasi beban kemasan & MDR, laba bersih & PPN',
                  checked: includeSummary,
                  toggle: () => setIncludeSummary(!includeSummary),
                },
                {
                  id: 'transactions',
                  label: 'Sheet 2: Daftar Faktur Transaksi Penjualan Lengkap',
                  desc: 'Rincian setiap faktur, jam, pelanggan, kasir, rincian obat, subtotal, diskon & referensi',
                  checked: includeTransactions,
                  toggle: () => setIncludeTransactions(!includeTransactions),
                },
                {
                  id: 'medicines',
                  label: 'Sheet 3: Rekap Penjualan Per Item Obat (Analisis Pareto)',
                  desc: 'Total kuantitas, omzet, HPP modal, dan persentase kontribusi margin tiap obat & alkes',
                  checked: includeMedicines,
                  toggle: () => setIncludeMedicines(!includeMedicines),
                },
                {
                  id: 'payments',
                  label: 'Sheet 4: Rekapitulasi Kanal Pembayaran (QRIS, DANA, Tunai, EDC)',
                  desc: 'Audit komparasi penerimaan fisik kasir vs saldo perbankan/e-wallet',
                  checked: includePayments,
                  toggle: () => setIncludePayments(!includePayments),
                },
                {
                  id: 'stock',
                  label: 'Sheet 5: Audit Mutasi & Kartu Stok Bulanan',
                  desc: 'Log pergerakan stok barang masuk (PBF), keluar (penjualan kasir), dan stok opname',
                  checked: includeStock,
                  toggle: () => setIncludeStock(!includeStock),
                },
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={item.toggle}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-colors flex items-start gap-2.5 ${
                    item.checked
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {item.checked ? (
                    <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className="font-extrabold text-xs">{item.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy & Archival Compliance Banner */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Standar Pengarsipan Farmasi & Pajak:</strong> File Excel (.xlsx) dibuat dengan format
              tabel baku dan formula kompatibel Microsoft Excel, Google Sheets, serta LibreOffice Calc untuk
              kebutuhan laporan pajak tahunan dan audit BPOM/Dinkes.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-slate-500 text-[11px]">
            File: <span className="font-mono font-bold text-slate-700">Arsip_Bulanan_Apotek_{selectedMonthYear}.xlsx</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              id="btn-confirm-monthly-excel-export"
              type="button"
              disabled={isExporting}
              onClick={handleDownload}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Membuat Spreadsheet...' : `Unduh Arsip ${monthLabel} (.xlsx)`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
