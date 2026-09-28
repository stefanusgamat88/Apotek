import React, { useState, useMemo, useRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import {
  Printer,
  X,
  Search,
  CheckSquare,
  Square,
  FileText,
  Tag,
  Grid,
  Filter,
  Sparkles,
  Download,
  Check,
  AlertCircle,
  Pill,
  Loader2,
  FileDown,
} from 'lucide-react';
import { Medicine, PharmacySettings } from '../types';
import { downloadBarcodePDF } from '../utils/barcodePdfGenerator';

interface BarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicines: Medicine[];
  settings: PharmacySettings;
  preSelectedMedicineId?: string | null;
}

/**
 * Reusable SVG Barcode Generator using standard CODE128
 */
const BarcodeSvg: React.FC<{
  code: string;
  width?: number;
  height?: number;
  fontSize?: number;
  displayValue?: boolean;
}> = ({ code, width = 1.5, height = 40, fontSize = 10, displayValue = true }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && code) {
      try {
        JsBarcode(svgRef.current, code, {
          format: 'CODE128',
          width,
          height,
          displayValue,
          font: 'monospace',
          fontSize,
          textMargin: 2,
          margin: 4,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch (e) {
        console.warn('Gagal merender barcode CODE128:', e);
      }
    }
  }, [code, width, height, fontSize, displayValue]);

  return (
    <svg
      ref={svgRef}
      className="max-w-full h-auto mx-auto block"
      style={{ minHeight: `${height}px` }}
    />
  );
};

/**
 * Isolated Iframe Print Function
 * Bypasses parent container clipping (overflow:hidden, fixed modals, h-screen)
 * to guarantee that browser 'Save as PDF' or physical printing NEVER produces a blank page.
 */
const printElementViaIframe = (elementId: string, title: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return;
  }

  // Remove any previously attached print iframes
  const existingIframe = document.getElementById('barcode-print-iframe');
  if (existingIframe) {
    existingIframe.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'barcode-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.zIndex = '-9999';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  // Clone the printable element node
  const cloned = element.cloneNode(true) as HTMLElement;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
            font-size: 11px;
            width: 100% !important;
          }
          .break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          svg {
            max-width: 100% !important;
            height: auto !important;
            display: block !important;
            margin: 0 auto !important;
          }
          rect {
            shape-rendering: crispEdges !important;
          }
        </style>
      </head>
      <body>
        <div style="width: 100%; margin: 0; padding: 0; background: #ffffff;">
          ${cloned.outerHTML}
        </div>
      </body>
    </html>
  `;

  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Allow browser time to parse DOM and styles before printing
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.warn('Iframe print error, falling back to window.print():', e);
      window.print();
    } finally {
      setTimeout(() => {
        iframe.remove();
      }, 3000);
    }
  }, 350);
};

export const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({
  isOpen,
  onClose,
  medicines,
  settings,
  preSelectedMedicineId,
}) => {
  const [printMode, setPrintMode] = useState<'catalog' | 'labels'>('catalog');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [labelCopies, setLabelCopies] = useState<number>(1);
  const [columnsCount, setColumnsCount] = useState<number>(3); // 2, 3, or 4 for catalog
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // Initialize selected medicines
  useEffect(() => {
    if (isOpen) {
      if (preSelectedMedicineId) {
        setSelectedIds([preSelectedMedicineId]);
      } else {
        // Default select all medicines
        setSelectedIds(medicines.map((m) => m.id));
      }
    }
  }, [isOpen, preSelectedMedicineId, medicines]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(medicines.map((m) => m.category));
    return Array.from(set);
  }, [medicines]);

  // Filtered medicines
  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.genericName.toLowerCase().includes(search.toLowerCase()) ||
        m.barcode.toLowerCase().includes(search.toLowerCase()) ||
        m.sku.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory === 'all' || m.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [medicines, search, selectedCategory]);

  // Items to print (intersection of selectedIds and medicines)
  const itemsToPrint = useMemo(() => {
    return medicines.filter((m) => selectedIds.includes(m.id));
  }, [medicines, selectedIds]);

  if (!isOpen) return null;

  const handleSelectAllFiltered = () => {
    const idsToAdd = filteredMedicines.map((m) => m.id);
    const combined = Array.from(new Set([...selectedIds, ...idsToAdd]));
    setSelectedIds(combined);
  };

  const handleDeselectAllFiltered = () => {
    const idsToRemove = new Set(filteredMedicines.map((m) => m.id));
    setSelectedIds(selectedIds.filter((id) => !idsToRemove.has(id)));
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    printElementViaIframe('printable-barcode-sheet', `Katalog_Barcode_${settings.pharmacyName}`);
    setTimeout(() => {
      setIsPrinting(false);
    }, 1000);
  };

  const handleDownloadPDF = () => {
    if (itemsToPrint.length === 0) return;
    setIsExportingPdf(true);
    setTimeout(() => {
      try {
        downloadBarcodePDF({
          medicines: itemsToPrint,
          settings,
          mode: printMode,
          columnsCount,
          labelCopies,
        });
      } catch (err) {
        console.error('Error generating barcode PDF:', err);
        alert('Terjadi kesalahan saat membuat file PDF. Silakan coba lagi.');
      } finally {
        setIsExportingPdf(false);
      }
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      {/* Printable Document Styles */}
      <style>{`
        @media print {
          html, body {
            height: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #root, #root > div, main, .fixed, .overflow-y-auto, .overflow-hidden {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            position: static !important;
            transform: none !important;
            filter: none !important;
          }
          .no-print {
            display: none !important;
          }
          #printable-barcode-sheet {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[94vh] animate-in zoom-in-95">
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight text-white">
                  Cetak Lembar Barcode Produk Apotek
                </h3>
                <span className="text-[10px] bg-emerald-500/25 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Anti Blank Putih • Siap Scan
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {settings.pharmacyName} • Format Barcode Standar CODE128 / ASPI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-direct-download-pdf-top"
              type="button"
              onClick={handleDownloadPDF}
              disabled={itemsToPrint.length === 0 || isExportingPdf}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Unduh file PDF resmi langsung ke komputer / perangkat"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              <span>Unduh File PDF ({itemsToPrint.length * (printMode === 'labels' ? labelCopies : 1)})</span>
            </button>

            <button
              id="btn-trigger-print"
              type="button"
              onClick={handlePrint}
              disabled={itemsToPrint.length === 0 || isPrinting}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50 border border-slate-700"
              title="Buka dialog cetak printer fisik atau Simpan sebagai PDF"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Dialog Cetak</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="p-3 bg-slate-100/90 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 text-xs shrink-0 no-print">
          {/* Print Mode Selector */}
          <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs w-full md:w-auto">
            <button
              type="button"
              onClick={() => setPrintMode('catalog')}
              className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                printMode === 'catalog'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Katalog Meja Kasir (A4)</span>
            </button>
            <button
              type="button"
              onClick={() => setPrintMode('labels')}
              className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                printMode === 'labels'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Stiker Label Produk / Rak</span>
            </button>
          </div>

          {/* Mode-specific Settings */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            {printMode === 'catalog' ? (
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500">Kolom:</span>
                {[2, 3, 4].map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setColumnsCount(col)}
                    className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center transition-colors ${
                      columnsCount === col
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-600">Rangkap per Obat:</span>
                <select
                  value={labelCopies}
                  onChange={(e) => setLabelCopies(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-0.5 font-bold text-slate-800 text-xs focus:outline-none"
                >
                  <option value={1}>1 Label</option>
                  <option value={2}>2 Label</option>
                  <option value={3}>3 Label</option>
                  <option value={5}>5 Label</option>
                  <option value={10}>10 Label</option>
                </select>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-[11px] shadow-2xs"
              >
                Pilih Semua ({filteredMedicines.length})
              </button>
              <button
                type="button"
                onClick={handleDeselectAllFiltered}
                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 font-semibold text-[11px] shadow-2xs"
              >
                Kosongkan
              </button>
            </div>
          </div>
        </div>

        {/* Content Body: Left Filter List & Right Live Print Preview */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* LEFT: Medicine Selection Sidebar */}
          <div className="w-full lg:w-72 xl:w-80 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 no-print">
            {/* Search & Category Filter */}
            <div className="p-3 border-b border-slate-200 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari obat / barcode..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Semua Kategori ({medicines.length})</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Checklist items list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {filteredMedicines.map((med) => {
                const isChecked = selectedIds.includes(med.id);
                return (
                  <div
                    key={med.id}
                    onClick={() => toggleSelect(med.id)}
                    className={`p-2 rounded-xl border text-xs cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                      isChecked
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-[11px] leading-tight">{med.name}</p>
                        <p className="text-[9px] text-slate-400 font-mono truncate">
                          {med.barcode} • {med.category}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 shrink-0">
                      Rp {med.sellPrice.toLocaleString('id-ID')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom summary in sidebar */}
            <div className="p-3 bg-white border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Terpilih:</span>
              <span className="font-extrabold text-emerald-700">
                {selectedIds.length} dari {medicines.length} Obat
              </span>
            </div>
          </div>

          {/* RIGHT: Document Preview (This element is printed on window.print) */}
          <div className="flex-1 bg-slate-200/80 p-4 sm:p-6 overflow-y-auto custom-scrollbar flex justify-center">
            <div
              id="printable-barcode-sheet"
              className="w-full max-w-4xl bg-white shadow-xl rounded-2xl border border-slate-300 p-6 sm:p-8 min-h-[700px] text-slate-900"
            >
              {/* Printable Header */}
              <div className="border-b-2 border-slate-800 pb-3 mb-5 flex items-start justify-between">
                <div>
                  <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-900">
                    {settings.pharmacyName}
                  </h1>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {printMode === 'catalog'
                      ? 'KATALOG LEMBAR BARCODE CEPAT KASIR (CHEAT SHEET POS)'
                      : 'LEMBAR STIKER LABEL BARCODE PRODUK & RAK'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Dicetak: {new Date().toLocaleString('id-ID')} • Total: {itemsToPrint.length} Obat
                  </p>
                </div>

                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 bg-slate-900 text-white rounded text-[10px] font-bold tracking-wider uppercase">
                    SIAP SCAN KASIR
                  </span>
                  <p className="text-[9px] text-slate-500 mt-1 font-mono">Standar CODE128 / ASPI</p>
                </div>
              </div>

              {/* Empty state if no items selected */}
              {itemsToPrint.length === 0 ? (
                <div className="py-20 text-center text-slate-400 space-y-2">
                  <AlertCircle className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="font-bold text-slate-600 text-sm">Belum Ada Obat Dipilih</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Centang obat di kolom sebelah kiri untuk menampilkan barcode pada lembar cetak.
                  </p>
                </div>
              ) : printMode === 'catalog' ? (
                /* MODE 1: CATALOG SHEET (A4 Grid Table with Multiple Units) */
                <div
                  className={`grid gap-3.5 ${
                    columnsCount === 2
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : columnsCount === 4
                      ? 'grid-cols-2 sm:grid-cols-4'
                      : 'grid-cols-1 sm:grid-cols-3'
                  }`}
                >
                  {itemsToPrint.map((med, idx) => (
                    <div
                      key={med.id}
                      className="p-3 rounded-xl border border-slate-300 bg-white flex flex-col justify-between shadow-2xs hover:border-slate-400 transition-all break-inside-avoid"
                    >
                      {/* Top Medicine Meta */}
                      <div>
                        <div className="flex items-start justify-between gap-1.5 mb-1">
                          <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            #{idx + 1} • {med.category}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500 font-bold">
                            {med.locationRack}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-xs text-slate-900 leading-snug line-clamp-2">
                          {med.name}
                        </h4>
                        {med.genericName && (
                          <p className="text-[10px] text-slate-500 italic truncate mt-0.5">
                            {med.genericName}
                          </p>
                        )}
                      </div>

                      {/* Barcode Visual */}
                      <div className="py-2 my-1 text-center bg-slate-50/60 rounded-lg border border-slate-100 flex items-center justify-center">
                        <BarcodeSvg code={med.barcode} width={1.4} height={36} fontSize={10} />
                      </div>

                      {/* Price per unit tags */}
                      <div className="pt-1.5 border-t border-slate-100 text-[10px] space-y-0.5">
                        <div className="flex justify-between items-center text-slate-600 font-bold">
                          <span>{med.baseUnit}:</span>
                          <span className="text-emerald-700 font-black">
                            Rp {med.sellPrice.toLocaleString('id-ID')}
                          </span>
                        </div>
                        {med.units.slice(0, 2).map((u) => (
                          <div key={u.name} className="flex justify-between items-center text-slate-500 text-[9px]">
                            <span>{u.name}:</span>
                            <span className="font-mono">Rp {u.price.toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* MODE 2: PRODUCT LABELS / SHELF STICKERS (Repeating Stickers for printing on label sheets) */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {itemsToPrint.flatMap((med) =>
                    Array.from({ length: labelCopies }).map((_, copyIdx) => (
                      <div
                        key={`${med.id}-${copyIdx}`}
                        className="p-2.5 rounded-lg border-2 border-slate-800 bg-white text-center flex flex-col justify-between break-inside-avoid text-slate-900"
                        style={{ minHeight: '125px' }}
                      >
                        {/* Header */}
                        <div>
                          <div className="flex justify-between items-center text-[8px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 pb-0.5 mb-1">
                            <span className="truncate max-w-[90px]">{settings.pharmacyName}</span>
                            <span className="font-mono">{med.locationRack}</span>
                          </div>
                          <p className="font-black text-[11px] leading-tight text-slate-900 truncate">
                            {med.name}
                          </p>
                          <p className="text-[8px] text-slate-500 truncate">{med.genericName}</p>
                        </div>

                        {/* Barcode */}
                        <div className="my-1 flex items-center justify-center">
                          <BarcodeSvg code={med.barcode} width={1.2} height={28} fontSize={9} />
                        </div>

                        {/* Footer Details */}
                        <div className="pt-1 border-t border-slate-200 flex justify-between items-baseline">
                          <span className="text-[8px] font-mono text-slate-500">
                            Exp: {med.expiredDate}
                          </span>
                          <span className="font-black text-xs text-slate-900">
                            Rp {med.sellPrice.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Printable Footer */}
              <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono">
                Lembar ini digenerate secara otomatis oleh Sistem POS {settings.pharmacyName}.
                Dapat langsung dipindai menggunakan barcode scanner laser atau kamera scanner apotek.
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0 no-print">
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span>
              Format PDF & Print resolusi tinggi (CODE128 ASPI) • Bebas blank putih saat disimpan ke PDF.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              Tutup
            </button>
            <button
              id="btn-dialog-print-footer"
              type="button"
              onClick={handlePrint}
              disabled={itemsToPrint.length === 0 || isPrinting}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold shadow-2xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              title="Buka dialog cetak printer bawaan browser"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Dialog Print Browser</span>
            </button>
            <button
              id="btn-direct-download-pdf-footer"
              type="button"
              onClick={handleDownloadPDF}
              disabled={itemsToPrint.length === 0 || isExportingPdf}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold shadow-md shadow-emerald-700/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              title="Unduh langsung file PDF resmi tanpa perlu dialog print"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <FileDown className="w-4 h-4 text-emerald-100" />
              )}
              <span>Unduh File PDF ({itemsToPrint.length * (printMode === 'labels' ? labelCopies : 1)})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
