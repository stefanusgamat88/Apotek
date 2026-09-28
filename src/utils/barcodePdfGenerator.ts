import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
import { Medicine, PharmacySettings } from '../types';

/**
 * Generate high-resolution PNG data URL for a CODE128 barcode using off-screen HTML canvas
 */
export const generateBarcodeImage = (
  code: string,
  options?: { width?: number; height?: number; fontSize?: number }
): string | null => {
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, code, {
      format: 'CODE128',
      width: options?.width || 2,
      height: options?.height || 45,
      displayValue: true,
      font: 'monospace',
      fontSize: options?.fontSize || 12,
      textMargin: 2,
      margin: 4,
      background: '#ffffff',
      lineColor: '#000000',
    });
    return canvas.toDataURL('image/png');
  } catch (e) {
    console.warn('JsBarcode canvas error for code:', code, e);
    // Fallback: draw text barcode if code format fails
    try {
      const fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.width = 240;
      fallbackCanvas.height = 60;
      const ctx = fallbackCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 240, 60);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(code, 120, 35);
      }
      return fallbackCanvas.toDataURL('image/png');
    } catch {
      return null;
    }
  }
};

export interface GenerateBarcodePdfOptions {
  medicines: Medicine[];
  settings: PharmacySettings;
  mode: 'catalog' | 'labels';
  columnsCount?: number; // 2, 3, or 4 for catalog
  labelCopies?: number; // 1, 2, 3, 5, 10 for labels
}

/**
 * Generates and triggers download of a crisp, multi-page vector PDF containing barcode cards or labels
 */
export const downloadBarcodePDF = ({
  medicines,
  settings,
  mode,
  columnsCount = 3,
  labelCopies = 1,
}: GenerateBarcodePdfOptions): void => {
  if (!medicines || medicines.length === 0) {
    alert('Pilih minimal satu obat untuk disimpan ke PDF.');
    return;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const marginLeft = 10;
  const marginRight = 10;
  const marginTop = 10;
  const marginBottom = 12;
  const printableWidth = pageWidth - marginLeft - marginRight; // 190 mm

  const printDateStr = new Date().toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Pre-generate barcode data URLs for performance
  const barcodeMap = new Map<string, string | null>();
  medicines.forEach((med) => {
    if (!barcodeMap.has(med.barcode)) {
      barcodeMap.set(med.barcode, generateBarcodeImage(med.barcode));
    }
  });

  if (mode === 'catalog') {
    // -------------------------------------------------------------
    // MODE 1: KATALOG LEMBAR BARCODE KASIR (A4 Grid)
    // -------------------------------------------------------------
    const cols = Math.max(2, Math.min(4, columnsCount));
    const gapX = cols === 2 ? 6 : cols === 4 ? 3 : 4;
    const cardWidth = (printableWidth - (cols - 1) * gapX) / cols;
    const cardHeight = cols === 2 ? 55 : cols === 4 ? 49 : 52;
    const gapY = 4;

    let currentY = marginTop;
    let pageNum = 1;

    // Helper: draw Kop Apotek on Page 1
    const drawKopHeader = () => {
      // Emerald accent bar
      doc.setFillColor(5, 150, 105);
      doc.rect(marginLeft, currentY, 3.5, 20, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text((settings.pharmacyName || 'APOTEK').toUpperCase(), marginLeft + 6, currentY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(
        `${settings.address || 'Alamat Apotek'} • Telp: ${settings.phone || '-'}`,
        marginLeft + 6,
        currentY + 10
      );
      doc.text(
        `SIA: ${settings.siaNumber || '-'} | SIPA: ${settings.sipaNumber || '-'} | Apoteker: ${settings.pharmacistName || '-'}`,
        marginLeft + 6,
        currentY + 14
      );

      // Title Badge Right
      const badgeWidth = 75;
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(pageWidth - marginRight - badgeWidth, currentY, badgeWidth, 20, 2, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(5, 150, 105);
      doc.text('KATALOG BARCODE PRODUK KASIR', pageWidth - marginRight - badgeWidth + 4, currentY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Total: ${medicines.length} Obat Siap Scan`, pageWidth - marginRight - badgeWidth + 4, currentY + 11);
      doc.text(`Dicetak: ${printDateStr}`, pageWidth - marginRight - badgeWidth + 4, currentY + 16);

      // Divider line
      currentY += 23;
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineWidth(0.4);
      doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);
      currentY += 4;
    };

    // Helper: draw simple page header for page 2+
    const drawSubsequentPageHeader = () => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(
        `${(settings.pharmacyName || 'APOTEK').toUpperCase()} • Katalog Barcode Produk (Lanjutan)`,
        marginLeft,
        marginTop + 4
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(printDateStr, pageWidth - marginRight, marginTop + 4, { align: 'right' });

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(marginLeft, marginTop + 6, pageWidth - marginRight, marginTop + 6);

      currentY = marginTop + 10;
    };

    drawKopHeader();

    let colIndex = 0;

    medicines.forEach((med, idx) => {
      // Check if we need to start a new page
      if (currentY + cardHeight > pageHeight - marginBottom) {
        // Draw page footer before breaking
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Halaman ${pageNum} • Format CODE128 • Sistem POS ${settings.pharmacyName}`,
          pageWidth / 2,
          pageHeight - 6,
          { align: 'center' }
        );

        doc.addPage();
        pageNum++;
        drawSubsequentPageHeader();
        colIndex = 0;
      }

      const cardX = marginLeft + colIndex * (cardWidth + gapX);
      const cardY = currentY;

      // Draw Card Container
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setFillColor(255, 255, 255);
      doc.setLineWidth(0.35);
      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 2, 2, 'FD');

      // Top row in card: Category & Rack
      doc.setFillColor(240, 253, 250); // teal-50
      doc.roundedRect(cardX + 2, cardY + 2, cardWidth - 4, 5.5, 1, 1, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 118, 110); // teal-700
      const catText = `#${idx + 1} • ${med.category}`;
      doc.text(catText, cardX + 3.5, cardY + 5.7);

      doc.setFont('courier', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.text(med.locationRack || '-', cardX + cardWidth - 3.5, cardY + 5.7, { align: 'right' });

      // Medicine Name (truncate or split)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(cols === 4 ? 7 : 7.8);
      doc.setTextColor(15, 23, 42); // slate-900
      const medNameLines = doc.splitTextToSize(med.name, cardWidth - 5);
      doc.text(medNameLines.slice(0, 2), cardX + 2.5, cardY + 11);

      // Generic Name
      let barcodeY = cardY + 17;
      if (med.genericName) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6);
        doc.setTextColor(100, 116, 139);
        const genText = doc.splitTextToSize(med.genericName, cardWidth - 5);
        doc.text(genText[0], cardX + 2.5, cardY + 15);
        barcodeY = cardY + 18.5;
      }

      // Barcode Image
      const barcodeImg = barcodeMap.get(med.barcode);
      const barcodeH = cols === 4 ? 16 : 18;
      const barcodeW = cardWidth - 8;
      if (barcodeImg) {
        doc.addImage(barcodeImg, 'PNG', cardX + 4, barcodeY, barcodeW, barcodeH);
      } else {
        doc.setFont('courier', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text(med.barcode, cardX + cardWidth / 2, barcodeY + 8, { align: 'center' });
      }

      // Price Footer in card
      const footerY = cardY + cardHeight - 8;
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.3);
      doc.line(cardX + 2, footerY, cardX + cardWidth - 2, footerY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`${med.baseUnit}:`, cardX + 3, footerY + 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(5, 150, 105); // emerald-600
      doc.text(`Rp ${med.sellPrice.toLocaleString('id-ID')}`, cardX + cardWidth - 3, footerY + 5, {
        align: 'right',
      });

      // Move colIndex
      colIndex++;
      if (colIndex >= cols) {
        colIndex = 0;
        currentY += cardHeight + gapY;
      }
    });

    // Page footer for last page
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Halaman ${pageNum} • Format CODE128 • Sistem POS ${settings.pharmacyName}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  } else {
    // -------------------------------------------------------------
    // MODE 2: STIKER LABEL BARCODE PRODUK / RAK
    // -------------------------------------------------------------
    const cols = 3;
    const gapX = 4;
    const cardWidth = (printableWidth - (cols - 1) * gapX) / cols; // ~60.6 mm
    const cardHeight = 39; // mm
    const gapY = 3.5;

    let currentY = marginTop;
    let pageNum = 1;

    // Expand items by labelCopies
    const labelItems: Medicine[] = [];
    medicines.forEach((med) => {
      for (let i = 0; i < labelCopies; i++) {
        labelItems.push(med);
      }
    });

    // Draw header on Page 1
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text((settings.pharmacyName || 'APOTEK').toUpperCase(), marginLeft, currentY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Lembar Cetak Stiker Label Barcode Produk & Rak (${labelItems.length} label) • ${printDateStr}`,
      marginLeft,
      currentY + 9
    );

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, currentY + 11, pageWidth - marginRight, currentY + 11);

    currentY += 15;
    let colIndex = 0;

    labelItems.forEach((med) => {
      if (currentY + cardHeight > pageHeight - marginBottom) {
        // Footer before page break
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Halaman ${pageNum} • Stiker Label Barcode • ${settings.pharmacyName}`,
          pageWidth / 2,
          pageHeight - 5,
          { align: 'center' }
        );

        doc.addPage();
        pageNum++;
        currentY = marginTop;
        colIndex = 0;
      }

      const cardX = marginLeft + colIndex * (cardWidth + gapX);
      const cardY = currentY;

      // Label border (solid border suitable for scissors / sticker cutter)
      doc.setDrawColor(51, 65, 85); // slate-700
      doc.setFillColor(255, 255, 255);
      doc.setLineWidth(0.4);
      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

      // Top mini header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text((settings.pharmacyName || 'APOTEK').toUpperCase().slice(0, 20), cardX + 2.5, cardY + 3.8);

      doc.setFont('courier', 'bold');
      doc.setFontSize(6);
      doc.text(med.locationRack || '-', cardX + cardWidth - 2.5, cardY + 3.8, { align: 'right' });

      // Medicine Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      const nameLines = doc.splitTextToSize(med.name, cardWidth - 5);
      doc.text(nameLines[0], cardX + 2.5, cardY + 7.5);

      // Barcode image
      const barcodeImg = barcodeMap.get(med.barcode);
      const barcodeW = cardWidth - 6;
      const barcodeH = 17;
      if (barcodeImg) {
        doc.addImage(barcodeImg, 'PNG', cardX + 3, cardY + 9.5, barcodeW, barcodeH);
      } else {
        doc.setFont('courier', 'bold');
        doc.setFontSize(7.5);
        doc.text(med.barcode, cardX + cardWidth / 2, cardY + 18, { align: 'center' });
      }

      // Bottom Row: Exp & Price
      const bottomY = cardY + cardHeight - 3;
      doc.setFont('courier', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text(`Exp: ${med.expiredDate || '-'}`, cardX + 2.5, bottomY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(`Rp ${med.sellPrice.toLocaleString('id-ID')}`, cardX + cardWidth - 2.5, bottomY, {
        align: 'right',
      });

      colIndex++;
      if (colIndex >= cols) {
        colIndex = 0;
        currentY += cardHeight + gapY;
      }
    });

    // Final page footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Halaman ${pageNum} • Stiker Label Barcode • ${settings.pharmacyName}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
  }

  // Generate clean filename
  const cleanPharmacy = (settings.pharmacyName || 'Apotek')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 20);
  const dateStamp = new Date().toISOString().slice(0, 10);
  const fileName =
    mode === 'catalog'
      ? `Katalog_Barcode_${cleanPharmacy}_${dateStamp}.pdf`
      : `Label_Barcode_${cleanPharmacy}_${dateStamp}.pdf`;

  doc.save(fileName);
};
