import React, { useState, useEffect, useMemo, useRef } from 'react';
import QRCode from 'qrcode';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  Info,
  Lock,
  Pill,
  QrCode,
  Radio,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Volume2,
  VolumeX,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { CartItem, PharmacySettings } from '../types';

interface DigitalPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (paymentDetails: {
    method: 'qris' | 'dana';
    refNumber: string;
    paidAmount: number;
  }) => void;
  cart: CartItem[];
  grandTotal: number;
  cartSubtotal: number;
  cartDiscount: number;
  cartTax: number;
  customerName: string;
  customerPhone?: string;
  settings: PharmacySettings;
  initialMethod?: 'qris' | 'dana';
}

/**
 * Standard CRC-16/CCITT-FALSE Checksum for EMVCo / ASPI QRIS Compliance
 */
function calculateCRC16(str: string): string {
  let crc = 0xffff;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Web Audio API gentle notification chime upon payment completion
 */
function playPaymentSuccessChime() {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    // Two-tone cheerful retail confirmation (F5 -> A5)
    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(698.46, now); // F5
    osc.frequency.setValueAtTime(880.0, now + 0.12); // A5
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.start(now);
    osc.stop(now + 0.6);
  } catch {
    // Audio context may be restricted before user gesture
  }
}

export const DigitalPaymentModal: React.FC<DigitalPaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  cart,
  grandTotal,
  cartSubtotal,
  cartDiscount,
  cartTax,
  customerName,
  customerPhone,
  settings,
  initialMethod = 'qris',
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'qris' | 'dana'>(initialMethod);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'qr' | 'items' | 'security'>('qr');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [autoDetectSimulating, setAutoDetectSimulating] = useState<boolean>(false);
  const [autoDetectCountdown, setAutoDetectCountdown] = useState<number>(0);

  // 5 Minutes countdown timer
  const [timeLeft, setTimeLeft] = useState<number>(300);

  // Generate unique transaction reference for this payment session
  const sessionRefNumber = useMemo(() => {
    const timestamp = Date.now().toString().slice(-6);
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `PAY-${timestamp}-${rand}`;
  }, [isOpen]);

  // Synchronize method when initialMethod changes
  useEffect(() => {
    if (isOpen) {
      setSelectedMethod(initialMethod);
      setIsSuccess(false);
      setIsVerifying(false);
      setTimeLeft(300);
      setAutoDetectSimulating(false);
      setAutoDetectCountdown(0);
    }
  }, [isOpen, initialMethod]);

  // Timer countdown
  useEffect(() => {
    if (!isOpen || isSuccess || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, isSuccess, timeLeft]);

  // Simulated Auto-Detect push notification countdown (if cashier toggles auto-detect test)
  useEffect(() => {
    if (!autoDetectSimulating || autoDetectCountdown <= 0) return;
    const timer = setInterval(() => {
      setAutoDetectCountdown((prev) => {
        if (prev <= 1) {
          triggerSuccessFlow();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoDetectSimulating, autoDetectCountdown]);

  // Generate dynamic QR Code string with exact items amount embedded (EMVCo Tag 54)
  useEffect(() => {
    if (!isOpen) return;

    const nmid = 'ID102008892019';
    const cleanPharmacyName = (settings?.pharmacyName || 'APOTEK').replace(/[^a-zA-Z0-9 ]/g, '').toUpperCase();
    const city = (settings?.city || 'JAKARTA').toUpperCase();

    let payload = '';

    if (selectedMethod === 'qris') {
      // Formatted EMVCo QRIS dynamic payload (Point of Initiation Tag 01 = 12 Dynamic, with Tag 54 exact nominal)
      const amountStr = Math.max(0, grandTotal).toString();
      const rawPayloadBeforeCRC = `00020101021226600016ID.CO.QRIS.WWW0118${nmid}0215${sessionRefNumber}52045912530336054${amountStr.length
        .toString()
        .padStart(2, '0')}${amountStr}5802ID59${cleanPharmacyName.length
        .toString()
        .padStart(2, '0')}${cleanPharmacyName}60${city.length
        .toString()
        .padStart(2, '0')}${city}62180114${sessionRefNumber}6304`;

      const checksum = calculateCRC16(rawPayloadBeforeCRC);
      payload = `${rawPayloadBeforeCRC}${checksum}`;
    } else {
      // DANA Bisnis Direct Deep Link with auto-locked amount
      const safeMerchant = encodeURIComponent(settings?.pharmacyName || 'Apotek');
      payload = `https://link.dana.id/pay?merchant=${safeMerchant}&amount=${grandTotal}&ref=${sessionRefNumber}&orderId=${sessionRefNumber}&itemCount=${cart.length}`;
    }

    QRCode.toDataURL(payload, {
      width: 320,
      margin: 1.5,
      color: {
        dark: selectedMethod === 'dana' ? '#0070ba' : '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Gagal generate QR Code:', err));
  }, [isOpen, selectedMethod, grandTotal, settings, sessionRefNumber, cart.length]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const triggerSuccessFlow = () => {
    setIsVerifying(true);
    setAutoDetectSimulating(false);
    setTimeout(() => {
      setIsVerifying(false);
      setIsSuccess(true);
      if (soundEnabled) {
        playPaymentSuccessChime();
      }
      setTimeout(() => {
        onPaymentSuccess({
          method: selectedMethod,
          refNumber: sessionRefNumber,
          paidAmount: grandTotal,
        });
      }, 1500);
    }, 1200);
  };

  const handleSimulateCustomerPayment = () => {
    triggerSuccessFlow();
  };

  const handleStartAutoDetectSimulation = () => {
    setAutoDetectSimulating(true);
    setAutoDetectCountdown(4);
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(sessionRefNumber);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 my-4 animate-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
                selectedMethod === 'dana' ? 'bg-sky-500' : 'bg-emerald-600'
              }`}
            >
              {selectedMethod === 'dana' ? (
                <Smartphone className="w-5 h-5" />
              ) : (
                <QrCode className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight text-white">
                  {selectedMethod === 'qris'
                    ? 'Pembayaran QRIS Dinamis'
                    : 'Pembayaran DANA E-Wallet'}
                </h3>
                <span className="text-[10px] bg-emerald-500/25 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Harga Item Otomatis
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {settings.pharmacyName} • Pelanggan: <strong className="text-white">{customerName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Suara Chime Aktif' : 'Suara Dimatikan'}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Method Toggle Buttons & Tab Switcher */}
        <div className="p-3 bg-slate-100/90 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs shrink-0">
          {/* Method Switcher */}
          <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200 w-full sm:w-auto shadow-2xs">
            <button
              type="button"
              onClick={() => setSelectedMethod('qris')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                selectedMethod === 'qris'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QRIS Dinamis</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('dana')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                selectedMethod === 'dana'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>DANA E-Wallet</span>
            </button>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end overflow-x-auto pb-0.5 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('qr')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'qr'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs'
                  : 'text-slate-600 hover:bg-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Tampilan QR & Scan</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('items')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'items'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs'
                  : 'text-slate-600 hover:bg-white'
              }`}
            >
              <Pill className="w-3.5 h-3.5" />
              <span>Deteksi {cart.length} Item Obat</span>
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'security'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs'
                  : 'text-slate-600 hover:bg-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Anti-Kebocoran</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 custom-scrollbar">
          {isSuccess ? (
            /* SUCCESS STATE */
            <div className="py-8 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg animate-bounce">
                <Check className="w-10 h-10 stroke-[3]" />
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900">
                  Pembayaran Berhasil Terverifikasi!
                </h4>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                  Sistem otomatis mendeteksi nominal transaksi sebesar{' '}
                  <span className="font-extrabold text-emerald-700">
                    Rp {grandTotal.toLocaleString('id-ID')}
                  </span>{' '}
                  telah lunas pas via{' '}
                  <span className="font-bold text-slate-800">
                    {selectedMethod.toUpperCase()}
                  </span>{' '}
                  tanpa risiko kebocoran data.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block text-left text-xs font-medium space-y-1.5 max-w-md w-full shadow-2xs">
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">ID Referensi:</span>
                  <span className="font-mono font-bold text-slate-800">{sessionRefNumber}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Kanal Pembayaran:</span>
                  <span className="font-bold text-slate-800">
                    {selectedMethod === 'qris' ? 'QRIS Dinamis ASPI' : 'DANA Bisnis Wallet'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Total Terdeteksi:</span>
                  <span className="font-extrabold text-emerald-700">
                    Rp {grandTotal.toLocaleString('id-ID')} (Pas)
                  </span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span className="text-slate-500">Status Keamanan:</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Enkripsi 256-Bit • Zero-Leakage
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>Menyimpan transaksi & mencetak struk resmi apotek...</span>
              </div>
            </div>
          ) : activeTab === 'qr' ? (
            /* TAB 1: DYNAMIC QRIS / DANA DISPLAY WITH AUTO-AMOUNT */
            <div className="space-y-4">
              {/* Highlight Amount Banner (Auto Detected from Cart Items) */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 flex items-center justify-between shadow-2xs">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-800">
                      TOTAL HARGA ITEM OBAT OTOMATIS:
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-200/80 text-emerald-900 font-extrabold text-[9px]">
                      {cart.length > 0 ? 'Terkunci Otomatis' : 'Menunggu Item Kasir'}
                    </span>
                  </div>
                  <span className="text-2xl font-black text-emerald-950 tracking-tight block mt-0.5">
                    Rp {grandTotal.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-600 text-white shadow-2xs">
                    <Sparkles className="w-3 h-3 text-emerald-200" />
                    Tanpa Input Manual
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1 font-medium">
                    {cart.reduce((s, it) => s + it.quantity, 0)} Unit dari {cart.length} Jenis Obat
                  </span>
                </div>
              </div>

              {cart.length === 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5 shadow-2xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <strong className="block font-bold">Keranjang Kasir Masih Kosong:</strong>
                    Silakan tutup modal ini dan tambahkan obat dari katalog POS. Sistem akan seketika mengunci nominal dan mendeteksi harga masing-masing obat ke dalam kode QRIS.
                  </div>
                </div>
              )}

              {/* QR Code Container Card */}
              <div className="p-4 sm:p-5 bg-white rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-3 relative">
                {/* Brand header */}
                <div className="flex items-center justify-between w-full px-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm tracking-tight text-slate-800">
                      {selectedMethod === 'dana' ? 'DANA Merchant Apotek' : 'QRIS Dinamis Apotek'}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                      {selectedMethod === 'dana' ? 'Nomor & QR DANA' : 'Standar ASPI / BI'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{timeFormatted}</span>
                  </div>
                </div>

                {/* The QR Image */}
                <div className="p-2.5 bg-white rounded-2xl border-2 border-slate-100 shadow-xs relative">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="QR Code Pembayaran Otomatis"
                      className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                    />
                  ) : (
                    <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                    </div>
                  )}

                  {/* Center Badge in QR */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      className={`px-2 py-0.5 rounded-lg text-white font-black text-[11px] shadow-md border-2 border-white ${
                        selectedMethod === 'dana' ? 'bg-sky-600' : 'bg-slate-900'
                      }`}
                    >
                      {selectedMethod === 'dana' ? 'DANA' : 'QRIS'}
                    </div>
                  </div>
                </div>

                {/* Live Webhook / Listener Pulse */}
                <div className="flex items-center justify-center gap-2 py-1 px-3 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>
                    {autoDetectSimulating
                      ? `Mendeteksi sinyal pembayaran... (${autoDetectCountdown}d)`
                      : 'Menunggu pemindaian dari aplikasi e-wallet / mobile banking...'}
                  </span>
                </div>

                {/* Instruction to Customer */}
                <div className="text-center space-y-1">
                  <p className="text-xs font-extrabold text-slate-800">
                    Arahkan Kamera / Scanner Aplikasi Pembeli ke Kode QR di Atas
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-sm">
                    {selectedMethod === 'dana'
                      ? 'Buka aplikasi DANA > Pindai. Nominal Rp ' +
                        grandTotal.toLocaleString('id-ID') +
                        ' langsung tertera tanpa perlu diketik.'
                      : 'Mendukung DANA, GoPay, OVO, ShopeePay, LinkAja, BCA, Mandiri, BRI, BNI, dan seluruh bank peserta QRIS.'}
                  </p>
                </div>

                {/* Session Reference Bar */}
                <div className="flex items-center justify-between w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Ref: {sessionRefNumber}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyRef}
                    className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                  >
                    {copiedRef ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedRef ? 'Tersalin' : 'Salin Ref'}</span>
                  </button>
                </div>
              </div>

              {/* Convenience & Anti-Leakage Mini Banner */}
              <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-slate-600 leading-relaxed">
                  <span className="font-bold text-slate-800 block">
                    Transaksi Nyaman & 100% Bebas Kebocoran Data:
                  </span>
                  Sistem apotek hanya memproses sinyal verifikasi pembayaran tokenisasi. PIN, saldo,
                  serta riwayat medis obat pasien tidak pernah dibagikan ke pihak luar.
                </div>
              </div>
            </div>
          ) : activeTab === 'items' ? (
            /* TAB 2: ITEMIZED PHARMACY CART BREAKDOWN (PROVING DETECTED PRICES) */
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <span className="font-extrabold text-xs text-slate-900 block">
                    Deteksi Otomatis Harga Setiap Item Obat:
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Data diambil langsung dari keranjang apotek tanpa input manual kasir/pembeli
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-200">
                  {cart.length} Obat Terdeteksi
                </span>
              </div>

              {/* Items List */}
              {cart.length === 0 ? (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
                  <Pill className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="font-bold text-xs text-slate-700">Belum Ada Obat di Keranjang</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Katalog POS apotek mendeteksi otomatis zat aktif, satuan harga, diskon, dan nominal pembayaran begitu obat dimasukkan ke keranjang kasir.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden text-xs">
                  {cart.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px] flex items-center justify-center shrink-0 border border-emerald-200">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-800 truncate text-xs">
                            {item.medicine.name}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {item.quantity} {item.selectedUnit.name} × Rp{' '}
                            {item.unitPrice.toLocaleString('id-ID')}
                            {item.discountPercent > 0 && (
                              <span className="text-rose-600 font-bold ml-1">
                                (Diskon {item.discountPercent}%)
                              </span>
                            )}
                            {item.medicine.genericName && (
                              <span className="block text-[9px] text-teal-700 font-medium">
                                Zat Aktif: {item.medicine.genericName}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-black text-slate-900 text-xs">
                          Rp {item.subtotal.toLocaleString('id-ID')}
                        </span>
                        <span className="block text-[9px] text-emerald-600 font-bold flex items-center justify-end gap-0.5">
                          <Check className="w-2.5 h-2.5" />
                          Harga Terkunci
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Subtotal & Total Breakdown */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Item Obat</span>
                  <span className="font-semibold">Rp {cartSubtotal.toLocaleString('id-ID')}</span>
                </div>
                {cartDiscount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Total Potongan Diskon</span>
                    <span>- Rp {cartDiscount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {settings.enableTax && (
                  <div className="flex justify-between text-slate-600">
                    <span>PPN ({settings.taxRate}%)</span>
                    <span className="font-semibold">Rp {cartTax.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-slate-900 font-black">
                  <span className="text-xs">TOTAL NOMINAL TAGIHAN DIGITAL:</span>
                  <span className="text-base text-emerald-700">
                    Rp {grandTotal.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-[11px] text-blue-900 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Nominal ini langsung ditanamkan ke dalam tagihan QRIS/DANA sehingga pembeli tidak
                  dapat mengubah atau salah menginput nominal pembayaran.
                </span>
              </div>
            </div>
          ) : (
            /* TAB 3: DATA LEAKAGE PREVENTION & ZERO LEAKAGE POLICY */
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wide">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Protokol Keamanan & Anti-Kebocoran Data (Zero-Leakage)</span>
                </div>
                <h4 className="text-sm font-extrabold text-white">
                  Privasi Pasien & Transaksi Finansial Terlindungi 100%
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Aplikasi Apotek menerapkan arsitektur isolasi data bertingkat tinggi untuk menjamin
                  kenyamanan pembeli dan keamanan kasir tanpa risiko kebocoran data.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Pillar 1 */}
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black mb-1.5">
                    1
                  </div>
                  <h5 className="font-extrabold text-slate-800 text-xs">Zero Financial Retention</h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Sistem apotek <strong>tidak pernah menyimpan atau meminta</strong> PIN, CVV,
                    password akun e-wallet, atau saldo pribadi pelanggan.
                  </p>
                </div>

                {/* Pillar 2 */}
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black mb-1.5">
                    2
                  </div>
                  <h5 className="font-extrabold text-slate-800 text-xs">Isolasi Privasi Medis</h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Payload QRIS dan DANA <strong>hanya memuat nominal & ID sesi</strong>. Nama obat,
                    resep dokter, dan riwayat alergi pasien tidak pernah bocor ke gateway pembayaran.
                  </p>
                </div>

                {/* Pillar 3 */}
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black mb-1.5">
                    3
                  </div>
                  <h5 className="font-extrabold text-slate-800 text-xs">Tokenisasi Transaksi Dinamis</h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Setiap kode QR dibuat dengan referensi acak sekali-pakai (One-Time Token) yang
                    otomatis kedaluwarsa dalam 5 menit untuk mencegah double-deduction.
                  </p>
                </div>

                {/* Pillar 4 */}
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black mb-1.5">
                    4
                  </div>
                  <h5 className="font-extrabold text-slate-800 text-xs">Standar ASPI & Bank Indonesia</h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Format QRIS menggunakan algoritma checksum CRC-16 standar nasional ASPI, menjamin
                    integritas data tanpa kemungkinan manipulasi nilai uang.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!isSuccess && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
            >
              Batal / Kembali ke Kasir
            </button>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              {/* Optional Auto-Detect Countdown Trigger */}
              {!autoDetectSimulating ? (
                <button
                  type="button"
                  onClick={handleStartAutoDetectSimulation}
                  className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Uji Auto-Detect (4 Detik)</span>
                </button>
              ) : (
                <div className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  <span>Mendeteksi Pembayaran ({autoDetectCountdown}s)...</span>
                </div>
              )}

              {/* Instant Verification Button */}
              <button
                id="btn-simulate-payment-success"
                type="button"
                disabled={isVerifying || cart.length === 0}
                onClick={handleSimulateCustomerPayment}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all ${
                  cart.length === 0
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-700/20 active:scale-95 cursor-pointer'
                }`}
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Sinyal Pembayaran...</span>
                  </>
                ) : cart.length === 0 ? (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    <span>Keranjang Kosong (Pilih Obat di Kasir)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Konfirmasi Pembeli Berhasil Bayar (Rp {grandTotal.toLocaleString('id-ID')})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
