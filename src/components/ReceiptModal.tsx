import React, { useRef } from 'react';
import { CheckCircle2, MessageCircle, Printer, Share2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ReceiptModal: React.FC = () => {
  const { activeReceipt, closeReceipt, settings } = useApp();
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!activeReceipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (!activeReceipt) return;
    const itemsText = activeReceipt.items
      .map(
        (it) =>
          `• ${it.medicine.name} (${it.quantity} ${it.selectedUnit.name}) : Rp ${it.subtotal.toLocaleString('id-ID')}`
      )
      .join('\n');

    const text = `*STRUK PEMBELIAN RESMI*\n*${settings.pharmacyName.toUpperCase()}*\n${settings.address}\nTelp: ${settings.phone}\n${settings.siaNumber}\n--------------------------------\nNo. Faktur: ${activeReceipt.invoiceNumber}\nTanggal: ${new Date(activeReceipt.timestamp).toLocaleString('id-ID')}\nKasir: ${activeReceipt.cashierName}\nPelanggan: ${activeReceipt.customerName}\n--------------------------------\n${itemsText}\n--------------------------------\n*TOTAL: Rp ${activeReceipt.total.toLocaleString('id-ID')}*\nBayar: Rp ${activeReceipt.amountPaid.toLocaleString('id-ID')} (${activeReceipt.paymentMethod.toUpperCase()})${activeReceipt.paymentRef ? `\nRef: ${activeReceipt.paymentRef}` : ''}\nKembali: Rp ${activeReceipt.change.toLocaleString('id-ID')}\n--------------------------------\n${settings.receiptFooter}`;

    const phone = activeReceipt.customerPhone ? activeReceipt.customerPhone.replace(/[^0-9]/g, '') : '';
    const cleanPhone = phone.startsWith('0') ? '62' + phone.substring(1) : phone;
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');
  };

  const is80mm = settings.printerPaperWidth === '80mm';

  return (
    <div
      id="receipt-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200">
        {/* Top Success Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">Transaksi Berhasil!</h3>
              <p className="text-xs text-emerald-100">
                Faktur #{activeReceipt.invoiceNumber}
              </p>
            </div>
          </div>
          <button
            onClick={closeReceipt}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Receipt Visual Preview */}
        <div className="p-4 sm:p-6 bg-slate-100/70 overflow-y-auto max-h-[60vh] flex justify-center">
          <div
            ref={receiptRef}
            id="thermal-receipt"
            className={`bg-white p-5 shadow-md border border-slate-200 text-slate-900 font-mono text-xs rounded-lg select-all
              ${is80mm ? 'w-80 max-w-full' : 'w-72 max-w-full'}
            `}
          >
            {/* Header Apotek */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                {settings.pharmacyName}
              </h2>
              <p className="text-[10px] text-slate-600 leading-tight mt-0.5">{settings.pharmacyTagline}</p>
              <p className="text-[10px] text-slate-500 leading-tight mt-1">{settings.address}</p>
              <p className="text-[10px] text-slate-500">{settings.phone}</p>
              <div className="mt-1 pt-1 border-t border-dotted border-slate-200 text-[9px] text-slate-500">
                <p>{settings.siaNumber}</p>
                <p>{settings.sipaNumber}</p>
                <p className="font-semibold text-slate-700">Apoteker: {settings.pharmacistName}</p>
              </div>
            </div>

            {/* Meta Transaksi */}
            <div className="py-2.5 text-[10px] space-y-1 border-b border-dashed border-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Faktur:</span>
                <span className="font-bold">{activeReceipt.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu:</span>
                <span>{new Date(activeReceipt.timestamp).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kasir:</span>
                <span className="font-medium">{activeReceipt.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pelanggan:</span>
                <span className="font-medium">{activeReceipt.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cabang:</span>
                <span>{activeReceipt.branchName}</span>
              </div>
            </div>

            {/* Rincian Produk */}
            <div className="py-2.5 space-y-2 border-b border-dashed border-slate-300">
              <div className="flex justify-between font-bold text-[10px] text-slate-600 border-b border-dotted border-slate-200 pb-1">
                <span>ITEM</span>
                <span>TOTAL</span>
              </div>
              {activeReceipt.items.map((item, idx) => (
                <div key={idx} className="text-[11px] space-y-0.5">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-800 truncate max-w-[180px]">
                      {item.medicine.name}
                    </span>
                    <span className="font-semibold">Rp {item.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>
                      {item.quantity} {item.selectedUnit.name} @ Rp {item.unitPrice.toLocaleString('id-ID')}
                      {item.discountPercent > 0 && ` (Disc ${item.discountPercent}%)`}
                    </span>
                    <span className="text-[9px] text-slate-400">Batch: {item.medicine.batchNumber}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Ringkasan Pembayaran */}
            <div className="py-2.5 space-y-1.5 border-b border-dashed border-slate-300 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>Rp {activeReceipt.subtotal.toLocaleString('id-ID')}</span>
              </div>
              {activeReceipt.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Diskon:</span>
                  <span>-Rp {activeReceipt.discount.toLocaleString('id-ID')}</span>
                </div>
              )}
              {activeReceipt.tax > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>PPN ({settings.taxRate}%):</span>
                  <span>Rp {activeReceipt.tax.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-1 border-t border-dotted border-slate-200">
                <span>TOTAL AKHIR:</span>
                <span className="text-emerald-700">Rp {activeReceipt.total.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-slate-700 pt-1">
                <span className="font-semibold uppercase">Bayar ({activeReceipt.paymentMethod}):</span>
                <span>Rp {activeReceipt.amountPaid.toLocaleString('id-ID')}</span>
              </div>
              {activeReceipt.paymentRef && (
                <div className="flex justify-between text-slate-500 text-[10px] font-mono">
                  <span>Ref:</span>
                  <span>{activeReceipt.paymentRef}</span>
                </div>
              )}
              {(activeReceipt.paymentMethod === 'qris' || activeReceipt.paymentMethod === 'dana') && (
                <div className="text-[9px] text-emerald-800 font-semibold text-center py-0.5 bg-emerald-50 rounded border border-emerald-200">
                  ✓ Terdeteksi Otomatis (Tanpa Input Manual • Zero-Leakage)
                </div>
              )}
              <div className="flex justify-between text-slate-700 font-bold">
                <span>Kembalian:</span>
                <span>Rp {activeReceipt.change.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Barcode Mock & Footer */}
            <div className="pt-3 text-center space-y-2">
              <div className="flex justify-center">
                <div className="h-9 w-44 bg-slate-900 rounded flex items-center justify-center p-1">
                  {/* Visual Barcode bars */}
                  <div className="flex items-center gap-0.5 h-full w-full justify-center bg-white px-1">
                    {[1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 1, 2, 4, 1, 2, 1].map((w, i) => (
                      <div
                        key={i}
                        className="bg-slate-950 h-6"
                        style={{ width: `${w * 1.5}px` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-slate-400 font-mono tracking-widest">
                *{activeReceipt.invoiceNumber}*
              </p>
              <p className="text-[10px] text-slate-600 italic leading-tight pt-1">
                "{settings.receiptFooter}"
              </p>
              <p className="text-[9px] text-slate-400">
                Dicetak: {new Date().toLocaleTimeString('id-ID')} - ApotekPOS v2.4
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              id="btn-print-receipt"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition-all hover:scale-102"
            >
              <Printer className="w-4 h-4" />
              Cetak Struk ({settings.printerPaperWidth})
            </button>

            <button
              id="btn-share-whatsapp"
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-xs sm:text-sm font-semibold transition-colors"
              title="Kirim Struk ke WhatsApp Pelanggan"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Kirim</span> WhatsApp
            </button>
          </div>

          <button
            id="btn-new-transaction"
            onClick={closeReceipt}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition-colors ml-auto"
          >
            Transaksi Baru
          </button>
        </div>
      </div>
    </div>
  );
};
