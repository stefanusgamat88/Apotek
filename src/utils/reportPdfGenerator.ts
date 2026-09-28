import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, PharmacySettings } from '../types';

export interface ReportFilterInfo {
  periodLabel: string;
  startDate?: string;
  endDate?: string;
  cashierName?: string;
  paymentMethod?: string;
  statusLabel?: string;
}

export interface FinancialMetrics {
  totalGrossSales: number;
  totalDiscount: number;
  totalNetSales: number;
  totalHPP: number;
  grossProfit: number;
  netProfit: number;
  marginPercent: string;
  transactionCount: number;
  averageOrderValue: number;
}

/**
 * Format currency to Indonesian Rupiah string (e.g., "Rp 150.000")
 */
export const formatRupiah = (val: number): string => {
  return 'Rp ' + Math.round(val).toLocaleString('id-ID');
};

/**
 * Generates and downloads a formal Sales Report PDF (Laporan Penjualan)
 */
export const generateSalesReportPDF = (
  transactions: Transaction[],
  settings: PharmacySettings,
  filters: ReportFilterInfo,
  metrics: FinancialMetrics,
  printedBy: string = 'Administrator / Apoteker'
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // 1. TOP HEADER & KOP APOTEK
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(14, 10, 4, 22, 'F'); // Accent left bar

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(settings.pharmacyName.toUpperCase(), 22, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(`${settings.address} • Telp: ${settings.phone}`, 22, 22);
  doc.text(`SIA: ${settings.siaNumber || '-'} | SIPA Apoteker: ${settings.sipaNumber || '-'} | Apoteker PJ: ${settings.pharmacistName}`, 22, 27);

  // Document Title Badge on Right
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(pageWidth - 95, 10, 81, 22, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text('LAPORAN PENJUALAN KASIR', pageWidth - 90, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Periode: ${filters.periodLabel}`, pageWidth - 90, 22);
  doc.text(`Dicetak: ${currentDate} ${currentTime}`, pageWidth - 90, 27);

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 36, pageWidth - 14, 36);

  // 2. FINANCIAL SUMMARY METRIC BOXES
  const boxY = 40;
  const boxWidth = (pageWidth - 28 - 15) / 4;
  const boxHeight = 16;

  // Box 1: Omzet Bersih
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(167, 243, 208); // emerald-200
  doc.roundedRect(14, boxY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text('TOTAL PENJUALAN BERSIH', 18, boxY + 5.5);
  doc.setFontSize(11);
  doc.setTextColor(6, 78, 59);
  doc.text(formatRupiah(metrics.totalNetSales), 18, boxY + 12.5);

  // Box 2: Total HPP Modal
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14 + boxWidth + 5, boxY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL HPP (MODAL PEMBELIAN)', 18 + boxWidth + 5, boxY + 5.5);
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(formatRupiah(metrics.totalHPP), 18 + boxWidth + 5, boxY + 12.5);

  // Box 3: Laba Bersih & Margin
  doc.setFillColor(240, 253, 250);
  doc.setDrawColor(153, 246, 228);
  doc.roundedRect(14 + (boxWidth + 5) * 2, boxY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(13, 148, 136);
  doc.text(`LABA BERSIH (MARGIN ${metrics.marginPercent}%)`, 18 + (boxWidth + 5) * 2, boxY + 5.5);
  doc.setFontSize(11);
  doc.setTextColor(15, 118, 110);
  doc.text(formatRupiah(metrics.netProfit), 18 + (boxWidth + 5) * 2, boxY + 12.5);

  // Box 4: Total Transaksi & AOV
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14 + (boxWidth + 5) * 3, boxY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('TRANSAKSI & RATA-RATA (AOV)', 18 + (boxWidth + 5) * 3, boxY + 5.5);
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(`${metrics.transactionCount} Struk • ${formatRupiah(metrics.averageOrderValue)}`, 18 + (boxWidth + 5) * 3, boxY + 12.5);

  // 3. TABLE OF TRANSACTIONS
  const tableData = transactions.map((t, index) => {
    const timeFormatted = new Date(t.timestamp).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const itemsSummary = t.items.map((it) => `${it.medicine.name} (${it.quantity} ${it.selectedUnit.name})`).join(', ');

    return [
      (index + 1).toString(),
      t.invoiceNumber,
      timeFormatted,
      t.customerName || 'Umum',
      t.cashierName,
      t.paymentMethod.toUpperCase(),
      itemsSummary,
      formatRupiah(t.subtotal),
      t.discount > 0 ? formatRupiah(t.discount) : '-',
      formatRupiah(t.total),
      formatRupiah(t.netProfit),
      t.status === 'completed' ? 'LUNAS' : 'VOID',
    ];
  });

  autoTable(doc, {
    startY: 61,
    head: [
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
    ],
    body: tableData,
    foot: [
      [
        '',
        'GRAND TOTAL',
        `${transactions.length} Faktur`,
        '',
        '',
        '',
        '',
        formatRupiah(metrics.totalGrossSales),
        metrics.totalDiscount > 0 ? formatRupiah(metrics.totalDiscount) : '-',
        formatRupiah(metrics.totalNetSales),
        formatRupiah(metrics.netProfit),
        '',
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [5, 150, 105], // Emerald 600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { fontStyle: 'bold', cellWidth: 24 },
      2: { cellWidth: 24 },
      3: { cellWidth: 22 },
      4: { cellWidth: 18 },
      5: { halign: 'center', cellWidth: 16 },
      6: { cellWidth: 'auto' }, // flexible
      7: { halign: 'right', cellWidth: 20 },
      8: { halign: 'right', cellWidth: 16 },
      9: { halign: 'right', fontStyle: 'bold', cellWidth: 22 },
      10: { halign: 'right', textColor: [5, 150, 105], fontStyle: 'bold', cellWidth: 20 },
      11: { halign: 'center', cellWidth: 14 },
    },
    styles: {
      overflow: 'linebreak',
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Page numbering footer
      const str = `Halaman ${data.pageNumber} dari ${doc.getNumberOfPages()}`;
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(str, pageWidth - 14, pageHeight - 8, { align: 'right' });
      doc.text(`Dokumen Resmi ${settings.pharmacyName} • Arsip Terverifikasi Sistem`, 14, pageHeight - 8);
    },
  });

  // 4. SIGNATURE SECTION AT END OF DOCUMENT
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY || 160;
  let signY = finalY + 12;

  // If signature exceeds page, add page
  if (signY + 35 > pageHeight) {
    doc.addPage();
    signY = 20;
  }

  const signColWidth = 65;
  const leftSignX = 20;
  const rightSignX = pageWidth - 20 - signColWidth;

  // Left Sign: Kasir / Staf Administrasi
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Dibuat & Diverifikasi Oleh,', leftSignX, signY);
  doc.text('Kasir / Petugas Administrasi', leftSignX, signY + 4);
  doc.line(leftSignX, signY + 22, leftSignX + signColWidth, signY + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`(${printedBy})`, leftSignX, signY + 26);

  // Right Sign: Apoteker Pengelola Apotek
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`${settings.city || 'Kota'}, ${currentDate}`, rightSignX, signY);
  doc.text('Mengetahui & Menyetujui,', rightSignX, signY + 4);
  doc.text('Apoteker Pengelola Apotek (APA)', rightSignX, signY + 8);
  doc.line(rightSignX, signY + 22, rightSignX + signColWidth, signY + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`apt. ${settings.pharmacistName}`, rightSignX, signY + 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`SIPA: ${settings.sipaNumber || '-'}`, rightSignX, signY + 30);

  // Download PDF
  const filename = `Laporan_Penjualan_${settings.pharmacyName.replace(/\s+/g, '_')}_${filters.periodLabel.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
};

/**
 * Generates and downloads a formal Profit & Loss / Income Statement PDF (Laporan Laba Rugi)
 */
export const generateProfitLossPDF = (
  transactions: Transaction[],
  settings: PharmacySettings,
  filters: ReportFilterInfo,
  metrics: FinancialMetrics,
  printedBy: string = 'Administrator / Apoteker'
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // 1. HEADER KOP APOTEK
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(14, 12, 4, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(settings.pharmacyName.toUpperCase(), 22, 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${settings.address} • Telp: ${settings.phone}`, 22, 24);
  doc.text(`SIA: ${settings.siaNumber || '-'} | SIPA: ${settings.sipaNumber || '-'} | Apoteker PJ: ${settings.pharmacistName}`, 22, 29);

  // Badge Judul
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(pageWidth - 85, 12, 71, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(5, 150, 105);
  doc.text('LAPORAN LABA RUGI', pageWidth - 81, 18);
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('INCOME STATEMENT RESMI', pageWidth - 81, 23);
  doc.text(`Periode: ${filters.periodLabel}`, pageWidth - 81, 27);
  doc.text(`Dicetak: ${currentDate} ${currentTime}`, pageWidth - 81, 31);

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 38, pageWidth - 14, 38);

  // 2. FORMAL INCOME STATEMENT BREAKDOWN TABLE
  // Calculated estimated operational cost (packaging/etiket 0.8% of sales, payment gateway fee 0.2%)
  const packagingCost = Math.round(metrics.totalNetSales * 0.008);
  const paymentFeeCost = Math.round(metrics.totalNetSales * 0.002);
  const totalOperatingExpenses = packagingCost + paymentFeeCost;
  const netOperatingProfit = metrics.grossProfit - totalOperatingExpenses;
  const netOperatingMargin = metrics.totalNetSales > 0 ? ((netOperatingProfit / metrics.totalNetSales) * 100).toFixed(1) : '0';

  const incomeStatementData = [
    // PENDAPATAN
    ['1. PENDAPATAN OPERASIONAL USAHA', '', ''],
    ['   Penjualan Kotor Obat & Alkes (Gross Sales)', formatRupiah(metrics.totalGrossSales), ''],
    ['   Potongan & Diskon Promosi Penjualan (-)', `(${formatRupiah(metrics.totalDiscount)})`, ''],
    ['   TOTAL PENDAPATAN BERSIH (NET REVENUE)', '', formatRupiah(metrics.totalNetSales)],
    // HPP
    ['2. BEBAN POKOK PENJUALAN (HPP)', '', ''],
    ['   Harga Pokok Pembelian Obat Terjual (COGS PBF)', '', `(${formatRupiah(metrics.totalHPP)})`],
    // LABA KOTOR
    ['3. LABA KOTOR APOTEK (GROSS PROFIT)', '', formatRupiah(metrics.grossProfit)],
    ['   Persentase Margin Laba Kotor', '', `${metrics.marginPercent}%`],
    // BEBAN OPERASIONAL ESTIMASI
    ['4. BEBAN OPERASIONAL PENJUALAN', '', ''],
    ['   Beban Kemasan, Klip & Plastik Etiket Obat (0.8%)', formatRupiah(packagingCost), ''],
    ['   Beban Administrasi Transaksi & MDR QRIS (0.2%)', formatRupiah(paymentFeeCost), ''],
    ['   Total Beban Operasional Terkait', '', `(${formatRupiah(totalOperatingExpenses)})`],
    // LABA BERSIH
    ['5. LABA BERSIH OPERASIONAL BERSIH (NET PROFIT)', '', formatRupiah(netOperatingProfit)],
    ['   Persentase Margin Bersih Akhir', '', `${netOperatingMargin}%`],
  ];

  autoTable(doc, {
    startY: 42,
    head: [['URAIAN KEUANGAN APOTEK', 'SUBTOTAL', 'TOTAL AKUMULASI (RP)']],
    body: incomeStatementData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 105 },
      1: { halign: 'right', cellWidth: 38 },
      2: { halign: 'right', fontStyle: 'bold', cellWidth: 39 },
    },
    styles: {
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    margin: { left: 14, right: 14 },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    didParseCell: (data: any) => {
      // Highlight bold summary rows
      const rowIndex = data.row.index;
      if ([0, 3, 4, 6, 7, 8, 11, 12, 13].includes(rowIndex)) {
        data.cell.styles.fontStyle = 'bold';
      }
      if (rowIndex === 3 || rowIndex === 6) {
        data.cell.styles.fillColor = [240, 253, 244]; // Light green
        if (data.column.index === 2) {
          data.cell.styles.textColor = [5, 150, 105];
        }
      }
      if (rowIndex === 12 || rowIndex === 13) {
        data.cell.styles.fillColor = [236, 253, 245];
        if (data.column.index === 2) {
          data.cell.styles.textColor = [6, 95, 70];
          data.cell.styles.fontSize = 8.5;
        }
      }
    },
  });

  // 3. TRANSACTION MARGIN DETAIL TABLE
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table1FinalY = (doc as any).lastAutoTable?.finalY || 120;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Rincian Margin Laba per Faktur Penjualan', 14, table1FinalY + 8);

  const marginDetailData = transactions.map((t, idx) => {
    const margin = t.total > 0 ? ((t.netProfit / t.total) * 100).toFixed(1) : '0';
    const itemsSummary = t.items.map((it) => it.medicine.name).join(', ');

    return [
      (idx + 1).toString(),
      t.invoiceNumber,
      new Date(t.timestamp).toLocaleDateString('id-ID'),
      itemsSummary,
      formatRupiah(t.total),
      formatRupiah(t.totalHPP),
      formatRupiah(t.netProfit),
      `${margin}%`,
    ];
  });

  autoTable(doc, {
    startY: table1FinalY + 11,
    head: [['No', 'No. Faktur', 'Tanggal', 'Item Obat Terjual', 'Omzet Jual', 'HPP Modal', 'Laba Bersih', 'Margin %']],
    body: marginDetailData,
    foot: [
      [
        '',
        'TOTAL',
        '',
        `${transactions.length} Transaksi`,
        formatRupiah(metrics.totalNetSales),
        formatRupiah(metrics.totalHPP),
        formatRupiah(metrics.netProfit),
        `${metrics.marginPercent}%`,
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 2,
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 7 },
      1: { fontStyle: 'bold', cellWidth: 22 },
      2: { cellWidth: 18 },
      3: { cellWidth: 'auto' },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'right', cellWidth: 22 },
      6: { halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105], cellWidth: 22 },
      7: { halign: 'right', fontStyle: 'bold', cellWidth: 15 },
    },
    styles: {
      overflow: 'linebreak',
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      const str = `Halaman ${data.pageNumber} dari ${doc.getNumberOfPages()}`;
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(str, pageWidth - 14, pageHeight - 8, { align: 'right' });
      doc.text(`Dokumen Resmi ${settings.pharmacyName} • Rekap Finansial Laba Rugi`, 14, pageHeight - 8);
    },
  });

  // 4. SIGNATURE SECTION
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY2 = (doc as any).lastAutoTable?.finalY || 210;
  let signY = finalY2 + 12;

  if (signY + 35 > pageHeight) {
    doc.addPage();
    signY = 20;
  }

  const signColWidth = 65;
  const leftSignX = 20;
  const rightSignX = pageWidth - 20 - signColWidth;

  // Left Sign: Kasir / Bagian Keuangan
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Dipersiapkan Oleh,', leftSignX, signY);
  doc.text('Bagian Keuangan & Kasir', leftSignX, signY + 4);
  doc.line(leftSignX, signY + 22, leftSignX + signColWidth, signY + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`(${printedBy})`, leftSignX, signY + 26);

  // Right Sign: Apoteker Pengelola Apotek
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`${settings.city || 'Kota'}, ${currentDate}`, rightSignX, signY);
  doc.text('Mengetahui & Menyetujui,', rightSignX, signY + 4);
  doc.text('Apoteker Pengelola Apotek (APA)', rightSignX, signY + 8);
  doc.line(rightSignX, signY + 22, rightSignX + signColWidth, signY + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`apt. ${settings.pharmacistName}`, rightSignX, signY + 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`SIPA: ${settings.sipaNumber || '-'}`, rightSignX, signY + 30);

  // Download PDF
  const filename = `Laporan_Laba_Rugi_${settings.pharmacyName.replace(/\s+/g, '_')}_${filters.periodLabel.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
};
