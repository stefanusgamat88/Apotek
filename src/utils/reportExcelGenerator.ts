import * as XLSX from 'xlsx';
import { Transaction, StockMovement, PharmacySettings } from '../types';
import { FinancialMetrics, ReportFilterInfo } from './reportPdfGenerator';

/**
 * Format currency to match user image format e.g. "Rp 24.500"
 */
const formatRp = (val: number): string => {
  return 'Rp ' + Math.round(val).toLocaleString('id-ID');
};

/**
 * Format timestamp to match user image format: "DD/MM/YYYY, HH.mm" e.g. "22/09/2026, 08.15"
 */
const formatDateTime = (ts: string): string => {
  const d = new Date(ts);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year}, ${hours}.${minutes}`;
};

/**
 * Generate and download Sales Report in Excel (.xlsx) format
 * Table header and row format precisely matched to user specification:
 * [No, No. Faktur, Waktu, Pelanggan, Kasir, Metode, Rincian Obat & Alkes, Subtotal, Diskon, Total Akhir, Laba Bersih, Status]
 */
export const exportSalesReportXLSX = (
  transactions: Transaction[],
  settings: PharmacySettings,
  filters: ReportFilterInfo,
  metrics: FinancialMetrics,
  printedBy: string = 'Administrator / Apoteker'
) => {
  const wb = XLSX.utils.book_new();

  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const rows: any[][] = [
    // Header Kop Apotek
    [settings.pharmacyName.toUpperCase()],
    [`${settings.address} • Telp: ${settings.phone} • SIA: ${settings.siaNumber || '-'} • SIPA: ${settings.sipaNumber || '-'}`],
    ['LAPORAN PENJUALAN APOTEK (SALES REPORT)'],
    [`Periode: ${filters.periodLabel} | Tanggal Ekspor: ${currentDate} ${currentTime} | Dicetak Oleh: ${printedBy}`],
    [''],
    // EXACT TABLE HEADERS AS SPECIFIED BY USER
    [
      'No',
      'No. Faktur',
      'Waktu',
      'Pelanggan',
      'Kasir',
      'Metode',
      'Rincian Obat & Alkes',
      'Subtotal',
      'Diskon',
      'Total Akhir',
      'Laba Bersih',
      'Status',
    ],
  ];

  // Data Rows matching screenshot format
  transactions.forEach((t, idx) => {
    const timeFormatted = formatDateTime(t.timestamp);
    const itemsSummary = t.items
      .map((it) => `${it.medicine.name} (${it.quantity} ${it.selectedUnit.name})`)
      .join(', ');

    const subtotalFormatted = formatRp(t.subtotal || t.total);
    const discountFormatted = t.discount > 0 ? formatRp(t.discount) : '-';
    const totalFormatted = formatRp(t.total);
    const profitFormatted = formatRp(t.netProfit || 0);
    const statusText = t.status === 'completed' ? 'LUNAS' : 'VOID';

    rows.push([
      idx + 1,
      t.invoiceNumber,
      timeFormatted,
      t.customerName || 'Pelanggan Umum',
      t.cashierName,
      t.paymentMethod.toUpperCase(),
      itemsSummary,
      subtotalFormatted,
      discountFormatted,
      totalFormatted,
      profitFormatted,
      statusText,
    ]);
  });

  // GRAND TOTAL ROW MATCHING EXACT SCREENSHOT
  rows.push([
    '',
    'GRAND TOTAL',
    `${transactions.length} Faktur`,
    '',
    '',
    '',
    '',
    formatRp(metrics.totalGrossSales),
    metrics.totalDiscount > 0 ? formatRp(metrics.totalDiscount) : '-',
    formatRp(metrics.totalNetSales),
    formatRp(metrics.netProfit),
    '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Column widths for optimal display in Excel without truncation
  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 22 }, // No. Faktur
    { wch: 20 }, // Waktu
    { wch: 22 }, // Pelanggan
    { wch: 24 }, // Kasir
    { wch: 12 }, // Metode
    { wch: 55 }, // Rincian Obat & Alkes
    { wch: 18 }, // Subtotal
    { wch: 14 }, // Diskon
    { wch: 18 }, // Total Akhir
    { wch: 18 }, // Laba Bersih
    { wch: 12 }, // Status
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Laporan_Penjualan');

  const filename = `Laporan_Penjualan_${settings.pharmacyName.replace(/\s+/g, '_')}_${filters.periodLabel.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, filename);
};

/**
 * Generate and download Profit & Loss Report in Excel (.xlsx) format
 * Matched with standard executive layout
 */
export const exportProfitLossXLSX = (
  transactions: Transaction[],
  settings: PharmacySettings,
  filters: ReportFilterInfo,
  metrics: FinancialMetrics,
  printedBy: string = 'Administrator / Apoteker'
) => {
  const wb = XLSX.utils.book_new();

  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Sheet 1: Formal Income Statement
  const packagingCost = Math.round(metrics.totalNetSales * 0.008);
  const paymentFeeCost = Math.round(metrics.totalNetSales * 0.002);
  const totalOperatingExpenses = packagingCost + paymentFeeCost;
  const netOperatingProfit = metrics.grossProfit - totalOperatingExpenses;
  const netOperatingMargin = metrics.totalNetSales > 0 ? ((netOperatingProfit / metrics.totalNetSales) * 100).toFixed(1) : '0';

  const incomeStatementRows: any[][] = [
    [settings.pharmacyName.toUpperCase()],
    [`${settings.address} • Telp: ${settings.phone} • SIA: ${settings.siaNumber || '-'} • SIPA: ${settings.sipaNumber || '-'}`],
    ['LAPORAN LABA RUGI KOMPREHENSIF APOTEK (INCOME STATEMENT)'],
    [`Periode: ${filters.periodLabel} | Tanggal Ekspor: ${currentDate} ${currentTime} | Dicetak Oleh: ${printedBy}`],
    [''],
    ['URAIAN KEUANGAN APOTEK', 'SUBTOTAL', 'TOTAL AKUMULASI'],
    ['1. PENDAPATAN OPERASIONAL USAHA', '', ''],
    ['   Penjualan Kotor Obat & Alkes (Gross Sales)', formatRp(metrics.totalGrossSales), ''],
    ['   Potongan & Diskon Promosi Penjualan (-)', `(${metrics.totalDiscount > 0 ? formatRp(metrics.totalDiscount) : 'Rp 0'})`, ''],
    ['   TOTAL PENDAPATAN BERSIH (NET REVENUE)', '', formatRp(metrics.totalNetSales)],
    ['2. BEBAN POKOK PENJUALAN (HPP)', '', ''],
    ['   Harga Pokok Pembelian Obat Terjual (COGS PBF Resmi)', '', `(${formatRp(metrics.totalHPP)})`],
    ['3. LABA KOTOR APOTEK (GROSS PROFIT)', '', formatRp(metrics.grossProfit)],
    ['   Persentase Margin Laba Kotor (%)', '', `${metrics.marginPercent}%`],
    ['4. ESTIMASI BEBAN OPERASIONAL PENJUALAN', '', ''],
    ['   Beban Kemasan, Klip & Plastik Etiket Obat (0.8%)', formatRp(packagingCost), ''],
    ['   Biaya Administrasi Transaksi & MDR QRIS (0.2%)', formatRp(paymentFeeCost), ''],
    ['   Total Beban Operasional Terkait', '', `(${formatRp(totalOperatingExpenses)})`],
    ['5. LABA BERSIH OPERASIONAL AKHIR (NET PROFIT)', '', formatRp(netOperatingProfit)],
    ['   Persentase Margin Bersih Akhir (%)', '', `${netOperatingMargin}%`],
  ];

  const wsIncome = XLSX.utils.aoa_to_sheet(incomeStatementRows);
  wsIncome['!cols'] = [
    { wch: 55 },
    { wch: 22 },
    { wch: 25 },
  ];
  XLSX.utils.book_append_sheet(wb, wsIncome, 'Laba_Rugi_Akuntansi');

  // Sheet 2: Margin per Faktur following the user's styled column structure
  const marginRows: any[][] = [
    [settings.pharmacyName.toUpperCase()],
    ['RINCIAN MARGIN LABA PER FAKTUR PENJUALAN'],
    [`Periode: ${filters.periodLabel}`],
    [''],
    [
      'No',
      'No. Faktur',
      'Waktu',
      'Pelanggan',
      'Kasir',
      'Metode',
      'Rincian Obat & Alkes',
      'Omzet Jual',
      'HPP Modal',
      'Laba Bersih',
      'Margin %',
      'Tingkat Profit',
    ],
  ];

  transactions.forEach((t, idx) => {
    const margin = t.total > 0 ? (t.netProfit / t.total) * 100 : 0;
    const marginStr = margin.toFixed(1);
    const itemsSummary = t.items.map((it) => `${it.medicine.name} (${it.quantity} ${it.selectedUnit.name})`).join(', ');

    let profitLevel = 'Tipis (<15%)';
    if (margin >= 30) profitLevel = 'Tinggi (>30%)';
    else if (margin >= 15) profitLevel = 'Normal (15-30%)';

    marginRows.push([
      idx + 1,
      t.invoiceNumber,
      formatDateTime(t.timestamp),
      t.customerName || 'Pelanggan Umum',
      t.cashierName,
      t.paymentMethod.toUpperCase(),
      itemsSummary,
      formatRp(t.total),
      formatRp(t.totalHPP || 0),
      formatRp(t.netProfit || 0),
      `${marginStr}%`,
      profitLevel,
    ]);
  });

  marginRows.push([
    '',
    'GRAND TOTAL',
    `${transactions.length} Faktur`,
    '',
    '',
    '',
    '',
    formatRp(metrics.totalNetSales),
    formatRp(metrics.totalHPP),
    formatRp(metrics.netProfit),
    `${metrics.marginPercent}%`,
    '',
  ]);

  const wsMargin = XLSX.utils.aoa_to_sheet(marginRows);
  wsMargin['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 20 },
    { wch: 20 },
    { wch: 24 },
    { wch: 12 },
    { wch: 55 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsMargin, 'Margin_per_Faktur');

  const filename = `Laporan_Laba_Rugi_${settings.pharmacyName.replace(/\s+/g, '_')}_${filters.periodLabel.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, filename);
};

/**
 * Generate and download Stock Movements Report in Excel (.xlsx) format
 */
export const exportStockMovementsXLSX = (
  movements: StockMovement[],
  settings: PharmacySettings,
  periodLabel: string
) => {
  const wb = XLSX.utils.book_new();

  const rows: any[][] = [
    [settings.pharmacyName.toUpperCase()],
    [`${settings.address} • Telp: ${settings.phone}`],
    ['LAPORAN MUTASI & KARTU STOK PERSEDIAAN OBAT'],
    [`Periode: ${periodLabel} | Total: ${movements.length} Log Mutasi`],
    [''],
    [
      'No',
      'Waktu',
      'Nama Obat & Alkes',
      'Tipe Mutasi',
      'Perubahan Qty',
      'Satuan',
      'Saldo Awal',
      'Saldo Akhir',
      'No. Referensi',
      'Petugas Operator',
    ],
  ];

  movements.forEach((s, idx) => {
    rows.push([
      idx + 1,
      s.date,
      s.medicineName,
      s.type === 'in' ? 'Masuk (In)' : s.type === 'out' ? 'Keluar (Out)' : 'Penyesuaian',
      s.qtyChange,
      s.unit,
      s.previousStock,
      s.currentStock,
      s.refNumber,
      s.operator,
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 35 },
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 25 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Mutasi_Stok');

  const filename = `Laporan_Mutasi_Stok_${settings.pharmacyName.replace(/\s+/g, '_')}_${periodLabel.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, filename);
};

/**
 * Generate and download Transactions Register in Excel (.xlsx) format
 * Also adopting the exact 12-column header format:
 * [No, No. Faktur, Waktu, Pelanggan, Kasir, Metode, Rincian Obat & Alkes, Subtotal, Diskon, Total Akhir, Laba Bersih, Status]
 */
export const exportTransactionsRegisterXLSX = (
  transactions: Transaction[],
  settings: PharmacySettings,
  periodLabel: string = 'Seluruh Transaksi'
) => {
  const wb = XLSX.utils.book_new();

  const rows: any[][] = [
    [settings.pharmacyName.toUpperCase()],
    [`${settings.address} • Telp: ${settings.phone}`],
    ['DAFTAR RIWAYAT TRANSAKSI PENJUALAN KASIR'],
    [`Periode / Filter: ${periodLabel} | Total: ${transactions.length} Faktur`],
    [''],
    [
      'No',
      'No. Faktur',
      'Waktu',
      'Pelanggan',
      'Kasir',
      'Metode',
      'Rincian Obat & Alkes',
      'Subtotal',
      'Diskon',
      'Total Akhir',
      'Laba Bersih',
      'Status',
    ],
  ];

  let totalGross = 0;
  let totalDisc = 0;
  let totalNet = 0;
  let totalProfit = 0;

  transactions.forEach((tx, idx) => {
    const items = tx.items
      .map((it) => `${it.medicine.name} (${it.quantity} ${it.selectedUnit.name})`)
      .join(', ');

    if (tx.status === 'completed') {
      totalGross += tx.subtotal || tx.total;
      totalDisc += tx.discount || 0;
      totalNet += tx.total;
      totalProfit += tx.netProfit || 0;
    }

    rows.push([
      idx + 1,
      tx.invoiceNumber,
      formatDateTime(tx.timestamp),
      tx.customerName || 'Pelanggan Umum',
      tx.cashierName,
      tx.paymentMethod.toUpperCase(),
      items,
      formatRp(tx.subtotal || tx.total),
      tx.discount > 0 ? formatRp(tx.discount) : '-',
      formatRp(tx.total),
      formatRp(tx.netProfit || 0),
      tx.status === 'completed' ? 'LUNAS' : 'VOID',
    ]);
  });

  rows.push([
    '',
    'GRAND TOTAL',
    `${transactions.length} Faktur`,
    '',
    '',
    '',
    '',
    formatRp(totalGross),
    totalDisc > 0 ? formatRp(totalDisc) : '-',
    formatRp(totalNet),
    formatRp(totalProfit),
    '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 20 },
    { wch: 22 },
    { wch: 24 },
    { wch: 12 },
    { wch: 55 },
    { wch: 18 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Riwayat_Transaksi');

  const filename = `Riwayat_Transaksi_${settings.pharmacyName.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, filename);
};

/**
 * Generate and download Comprehensive Monthly Pharmacy Archive in Excel (.xlsx) format
 * Designed specifically for external archival, tax reporting, and executive audit.
 * Features 5 comprehensive sheets:
 * 1. Ringkasan_Eksekutif (Executive Overview, Revenues, P&L, Taxes)
 * 2. Daftar_Transaksi (All monthly sales invoices with itemized details & payment refs)
 * 3. Penjualan_Per_Obat (Sales volume, revenue & profit margin per medicine)
 * 4. Kanal_Pembayaran (Cash, QRIS, DANA, Debit, Transfer breakdown)
 * 5. Mutasi_Stok_Bulanan (Stock card movement audit)
 */
export const exportMonthlyArchiveXLSX = (
  monthYear: string, // e.g. "2026-09"
  allTransactions: Transaction[],
  allStockMovements: StockMovement[],
  settings: PharmacySettings,
  printedBy: string = 'Apoteker Penanggung Jawab',
  options: {
    includeSummary?: boolean;
    includeTransactions?: boolean;
    includeMedicines?: boolean;
    includePayments?: boolean;
    includeStock?: boolean;
  } = {
    includeSummary: true,
    includeTransactions: true,
    includeMedicines: true,
    includePayments: true,
    includeStock: true,
  }
) => {
  const wb = XLSX.utils.book_new();

  const [yearStr, monthStr] = monthYear.split('-');
  const monthNum = parseInt(monthStr, 10) || 9;
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const monthName = monthNames[monthNum - 1] || 'September';
  const periodTitle = `Bulan ${monthName} ${yearStr}`;

  // Filter transactions and stock movements for the designated month
  const monthlyTxs = allTransactions.filter((t) => t.timestamp.startsWith(monthYear));
  const completedTxs = monthlyTxs.filter((t) => t.status === 'completed');
  const voidedTxs = monthlyTxs.filter((t) => t.status === 'voided');

  const monthlyStock = allStockMovements.filter((s) => s.date.startsWith(monthYear));

  // Financial calculations
  const totalGross = completedTxs.reduce((sum, t) => sum + (t.subtotal || t.total), 0);
  const totalDiscount = completedTxs.reduce((sum, t) => sum + (t.discount || 0), 0);
  const totalNet = completedTxs.reduce((sum, t) => sum + t.total, 0);
  const totalHPP = completedTxs.reduce((sum, t) => sum + (t.totalHPP || Math.round(t.total * 0.72)), 0);
  const grossProfit = totalNet - totalHPP;
  const marginPercent = totalNet > 0 ? ((grossProfit / totalNet) * 100).toFixed(1) : '0';

  const packagingExpense = Math.round(totalNet * 0.008);
  const paymentFeeExpense = Math.round(totalNet * 0.002);
  const totalOperatingExpense = packagingExpense + paymentFeeExpense;
  const netOperatingProfit = grossProfit - totalOperatingExpense;
  const netMarginPercent = totalNet > 0 ? ((netOperatingProfit / totalNet) * 100).toFixed(1) : '0';

  const estPPN = settings.enableTax ? Math.round((totalNet * (settings.taxRate || 11)) / 100) : 0;
  const aov = completedTxs.length > 0 ? Math.round(totalNet / completedTxs.length) : 0;

  const exportDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const exportTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // SHEET 1: RINGKASAN EKSEKUTIF & LABA RUGI
  if (options.includeSummary !== false) {
    const summaryRows: any[][] = [
      [settings.pharmacyName.toUpperCase()],
      [`Alamat: ${settings.address} • Telp: ${settings.phone} • Kota: ${settings.city}`],
      [`SIA (Surat Izin Apotek): ${settings.siaNumber || '-'} • SIPA: ${settings.sipaNumber || '-'}`],
      ['ARSIP LAPORAN BULANAN KEUANGAN APOTEK'],
      [`Periode: ${periodTitle} | Tanggal Ekspor: ${exportDate} ${exportTime} | Apoteker/Penanggung Jawab: ${printedBy}`],
      [''],
      ['PARAMETER KINERJA KEUANGAN (KEY FINANCIAL INDICATORS)', 'NILAI NOMINAL', 'KETERANGAN AUDIT'],
      ['1. VOLUME TRANSAKSI PENJUALAN', '', ''],
      ['   Total Faktur Penjualan Lunas', `${completedTxs.length} Transaksi`, 'Transaksi berhasil diselesaikan kasir'],
      ['   Total Transaksi Batal / Void', `${voidedTxs.length} Transaksi`, 'Transaksi dibatalkan supervisor'],
      ['   Rata-rata Nilai Belanja Pasien (AOV)', formatRp(aov), 'Average Order Value per faktur'],
      ['2. PENDAPATAN OPERASIONAL', '', ''],
      ['   Penjualan Kotor Obat & Alkes (Gross Revenue)', formatRp(totalGross), 'Nilai transaksi sebelum diskon'],
      ['   Total Potongan Diskon Promosi (-)', `(${formatRp(totalDiscount)})`, 'Diskon kasir & promo apotek'],
      ['   TOTAL PENDAPATAN BERSIH APOTEK (NET REVENUE)', formatRp(totalNet), 'Omzet riil diterima apotek'],
      ['3. HARGA POKOK PENJUALAN (HPP MODAL PBF)', '', ''],
      ['   Total Modal Obat Terjual (COGS PBF)', `(${formatRp(totalHPP)})`, 'Beban pokok pembelian ke distributor resmi'],
      ['   LABA KOTOR APOTEK (GROSS PROFIT)', formatRp(grossProfit), `Tingkat Margin Kotor: ${marginPercent}%`],
      ['4. ESTIMASI BEBAN OPERASIONAL PENJUALAN', '', ''],
      ['   Beban Kemasan, Klip & Plastik Etiket Obat (0.8%)', `(${formatRp(packagingExpense)})`, 'Biaya perlengkapan penyerahan obat'],
      ['   Biaya Administrasi Transaksi & MDR QRIS (0.2%)', `(${formatRp(paymentFeeExpense)})`, 'Biaya jaringan switching perbankan'],
      ['   Total Beban Operasional Terkait', `(${formatRp(totalOperatingExpense)})`, 'Total estimasi beban langsung'],
      ['5. LABA OPERASIONAL AKHIR BERSIH (NET OPERATING PROFIT)', formatRp(netOperatingProfit), `Margin Bersih Akhir: ${netMarginPercent}%`],
      ['6. INFORMASI PERPAJAKAN', '', ''],
      ['   Status Pajak PPN Apotek', settings.enableTax ? `Aktif (${settings.taxRate}%)` : 'Non-PKP / Non-Aktif', 'Pengaturan perpajakan apotek'],
      ['   Estimasi Akumulasi PPN Terutang', formatRp(estPPN), 'PPN Keluaran transaksi kasir'],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 60 }, { wch: 26 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan_Eksekutif');
  }

  // SHEET 2: DAFTAR TRANSAKSI LENGKAP
  if (options.includeTransactions !== false) {
    const txRows: any[][] = [
      [settings.pharmacyName.toUpperCase()],
      [`DAFTAR RIWAYAT FAKTUR PENJUALAN - ${periodTitle.toUpperCase()}`],
      [`Total: ${monthlyTxs.length} Faktur | Tanggal Ekspor: ${exportDate} ${exportTime}`],
      [''],
      [
        'No',
        'No. Faktur',
        'Waktu Transaksi',
        'Nama Pelanggan',
        'Kasir Operator',
        'Metode Bayar',
        'Ref E-Wallet / QRIS',
        'Rincian Obat & Alkes Terjual',
        'Subtotal (Rp)',
        'Diskon (Rp)',
        'Total Akhir (Rp)',
        'HPP Modal (Rp)',
        'Laba Bersih (Rp)',
        'Status',
      ],
    ];

    monthlyTxs.forEach((t, idx) => {
      const itemsSummary = t.items
        .map((it) => `${it.medicine.name} [${it.quantity} ${it.selectedUnit.name} @ Rp ${it.unitPrice.toLocaleString('id-ID')}]`)
        .join('; ');

      txRows.push([
        idx + 1,
        t.invoiceNumber,
        formatDateTime(t.timestamp),
        t.customerName || 'Pelanggan Umum',
        t.cashierName,
        t.paymentMethod.toUpperCase(),
        t.paymentRef || '-',
        itemsSummary,
        t.subtotal || t.total,
        t.discount || 0,
        t.total,
        t.totalHPP || Math.round(t.total * 0.72),
        t.netProfit || 0,
        t.status === 'completed' ? 'LUNAS' : 'VOID',
      ]);
    });

    // Grand total row
    txRows.push([
      '',
      'TOTAL BULAN INI',
      `${completedTxs.length} Faktur Lunas`,
      '',
      '',
      '',
      '',
      '',
      totalGross,
      totalDiscount,
      totalNet,
      totalHPP,
      grossProfit,
      '',
    ]);

    const wsTx = XLSX.utils.aoa_to_sheet(txRows);
    wsTx['!cols'] = [
      { wch: 6 },  // No
      { wch: 22 }, // No. Faktur
      { wch: 20 }, // Waktu
      { wch: 22 }, // Pelanggan
      { wch: 20 }, // Kasir
      { wch: 14 }, // Metode
      { wch: 22 }, // Ref
      { wch: 65 }, // Rincian Item
      { wch: 16 }, // Subtotal
      { wch: 14 }, // Diskon
      { wch: 16 }, // Total Akhir
      { wch: 16 }, // HPP
      { wch: 16 }, // Laba
      { wch: 12 }, // Status
    ];
    XLSX.utils.book_append_sheet(wb, wsTx, 'Daftar_Transaksi');
  }

  // SHEET 3: PENJUALAN PER ITEM OBAT (ANALISIS PARETO & OBAT TERLARIS)
  if (options.includeMedicines !== false) {
    const itemMap = new Map<
      string,
      {
        name: string;
        genericName: string;
        category: string;
        unit: string;
        totalQty: number;
        totalOmzet: number;
        totalHPP: number;
      }
    >();

    completedTxs.forEach((t) => {
      t.items.forEach((item) => {
        const key = item.medicine.id + '_' + item.selectedUnit.name;
        const existing = itemMap.get(key);
        const itemHPP = (item.medicine.buyPrice || 0) * (item.selectedUnit.conversionFactor || 1) * item.quantity;

        if (existing) {
          existing.totalQty += item.quantity;
          existing.totalOmzet += item.subtotal;
          existing.totalHPP += itemHPP;
        } else {
          itemMap.set(key, {
            name: item.medicine.name,
            genericName: item.medicine.genericName || '-',
            category: item.medicine.category || 'Umum',
            unit: item.selectedUnit.name,
            totalQty: item.quantity,
            totalOmzet: item.subtotal,
            totalHPP: itemHPP,
          });
        }
      });
    });

    const itemSalesList = Array.from(itemMap.values()).sort((a, b) => b.totalOmzet - a.totalOmzet);

    const itemRows: any[][] = [
      [settings.pharmacyName.toUpperCase()],
      [`REKAP PENJUALAN PER ITEM OBAT & ALKES - ${periodTitle.toUpperCase()}`],
      [`Dianalisis dari ${completedTxs.length} faktur transaksi lunas | Total Jenis Item: ${itemSalesList.length}`],
      [''],
      [
        'Peringkat',
        'Nama Produk Obat',
        'Zat Aktif / Generik',
        'Golongan / Kategori',
        'Satuan Jual',
        'Jumlah Qty Terjual',
        'Total Omzet (Rp)',
        'Total HPP Modal (Rp)',
        'Laba Kotor (Rp)',
        'Margin Laba (%)',
      ],
    ];

    itemSalesList.forEach((it, idx) => {
      const itemProfit = it.totalOmzet - it.totalHPP;
      const itemMargin = it.totalOmzet > 0 ? ((itemProfit / it.totalOmzet) * 100).toFixed(1) : '0';

      itemRows.push([
        idx + 1,
        it.name,
        it.genericName,
        it.category,
        it.unit,
        it.totalQty,
        it.totalOmzet,
        it.totalHPP,
        itemProfit,
        `${itemMargin}%`,
      ]);
    });

    const wsItems = XLSX.utils.aoa_to_sheet(itemRows);
    wsItems['!cols'] = [
      { wch: 10 }, // Peringkat
      { wch: 35 }, // Nama
      { wch: 30 }, // Zat aktif
      { wch: 22 }, // Kategori
      { wch: 14 }, // Satuan
      { wch: 18 }, // Qty
      { wch: 18 }, // Omzet
      { wch: 18 }, // HPP
      { wch: 18 }, // Laba
      { wch: 16 }, // Margin
    ];
    XLSX.utils.book_append_sheet(wb, wsItems, 'Penjualan_Per_Obat');
  }

  // SHEET 4: REKAP KANAL PEMBAYARAN (QRIS, DANA, TUNAI, EDC, TRANSFER)
  if (options.includePayments !== false) {
    const paymentMap: Record<string, { count: number; total: number; label: string }> = {
      cash: { count: 0, total: 0, label: 'Tunai (Cash Meja Kasir)' },
      qris: { count: 0, total: 0, label: 'QRIS Dinamis Apotek (ASPI / BI)' },
      dana: { count: 0, total: 0, label: 'DANA Bisnis Merchant E-Wallet' },
      debit: { count: 0, total: 0, label: 'EDC Kartu Debit Bank' },
      transfer: { count: 0, total: 0, label: 'Transfer Antar Bank Langsung' },
    };

    completedTxs.forEach((t) => {
      const m = t.paymentMethod || 'cash';
      if (!paymentMap[m]) {
        paymentMap[m] = { count: 0, total: 0, label: m.toUpperCase() };
      }
      paymentMap[m].count += 1;
      paymentMap[m].total += t.total;
    });

    const paymentRows: any[][] = [
      [settings.pharmacyName.toUpperCase()],
      [`REKAPITULASI KANAL PEMBAYARAN KASIR - ${periodTitle.toUpperCase()}`],
      [`Total Penerimaan: ${formatRp(totalNet)} dari ${completedTxs.length} transaksi`],
      [''],
      [
        'No',
        'Kanal / Metode Pembayaran',
        'Frekuensi Transaksi',
        'Porsi Transaksi (%)',
        'Total Nominal Diterima (Rp)',
        'Porsi Nominal (%)',
        'Keterangan Rekonsiliasi Bank',
      ],
    ];

    Object.entries(paymentMap).forEach(([key, val], idx) => {
      const freqPercent = completedTxs.length > 0 ? ((val.count / completedTxs.length) * 100).toFixed(1) : '0';
      const volPercent = totalNet > 0 ? ((val.total / totalNet) * 100).toFixed(1) : '0';

      paymentRows.push([
        idx + 1,
        val.label,
        val.count,
        `${freqPercent}%`,
        val.total,
        `${volPercent}%`,
        key === 'cash' ? 'Fisik Uang di Laci Kasir' : 'Settlement Masuk Rekening Bank Apotek',
      ]);
    });

    paymentRows.push([
      '',
      'TOTAL SEMUA METODE',
      completedTxs.length,
      '100%',
      totalNet,
      '100%',
      'Telah Direkonsiliasi',
    ]);

    const wsPay = XLSX.utils.aoa_to_sheet(paymentRows);
    wsPay['!cols'] = [
      { wch: 6 },
      { wch: 38 },
      { wch: 20 },
      { wch: 20 },
      { wch: 26 },
      { wch: 18 },
      { wch: 35 },
    ];
    XLSX.utils.book_append_sheet(wb, wsPay, 'Kanal_Pembayaran');
  }

  // SHEET 5: MUTASI STOK BULANAN (OPSIONAL)
  if (options.includeStock !== false && monthlyStock.length > 0) {
    const stockRows: any[][] = [
      [settings.pharmacyName.toUpperCase()],
      [`AUDIT MUTASI & KARTU STOK BULANAN - ${periodTitle.toUpperCase()}`],
      [`Total Log Mutasi: ${monthlyStock.length} Aktivitas`],
      [''],
      [
        'No',
        'Tanggal & Waktu',
        'Nama Obat & Alkes',
        'Jenis Pergerakan',
        'Perubahan Qty',
        'Satuan',
        'Stok Awal',
        'Stok Akhir',
        'Nomor Dokumen / Referensi',
        'Petugas Operator',
      ],
    ];

    monthlyStock.forEach((s, idx) => {
      stockRows.push([
        idx + 1,
        s.date,
        s.medicineName,
        s.type === 'in' ? 'Barang Masuk (In)' : s.type === 'out' ? 'Penjualan Kasir (Out)' : 'Penyesuaian Fisik',
        s.qtyChange,
        s.unit,
        s.previousStock,
        s.currentStock,
        s.refNumber,
        s.operator,
      ]);
    });

    const wsStock = XLSX.utils.aoa_to_sheet(stockRows);
    wsStock['!cols'] = [
      { wch: 6 },
      { wch: 20 },
      { wch: 35 },
      { wch: 24 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 28 },
      { wch: 24 },
    ];
    XLSX.utils.book_append_sheet(wb, wsStock, 'Mutasi_Stok');
  }

  // Clean pharmacy name for filename
  const cleanName = settings.pharmacyName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Arsip_Bulanan_Apotek_${cleanName}_${monthYear}.xlsx`;

  XLSX.writeFile(wb, filename);
};

