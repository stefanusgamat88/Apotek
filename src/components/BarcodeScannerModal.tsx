import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, Search, Volume2, X, Printer } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BarcodePrintModal } from './BarcodePrintModal';

export const BarcodeScannerModal: React.FC = () => {
  const { isScannerOpen, closeScanner, onBarcodeScanned, medicines, settings } = useApp();
  const [manualCode, setManualCode] = useState('');
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'not_found'>('idle');
  const [scannedItemName, setScannedItemName] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Play a quick beep sound
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // Audio context might be restricted
    }
  };

  // Start Camera
  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera access denied or unavailable', err);
      setCameraError('Kamera tidak dapat diakses atau izin ditolak. Gunakan input manual barcode di bawah.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (isScannerOpen) {
      startCamera();
    } else {
      stopCamera();
      setScanStatus('idle');
      setManualCode('');
    }
    return () => {
      stopCamera();
    };
  }, [isScannerOpen]);

  if (!isScannerOpen) return null;

  const handleScanCode = (code: string) => {
    if (!code.trim()) return;
    const found = onBarcodeScanned(code);
    if (found) {
      playBeep();
      const med = medicines.find(
        (m) =>
          m.barcode.toLowerCase() === code.trim().toLowerCase() ||
          m.sku.toLowerCase() === code.trim().toLowerCase() ||
          m.units.some((u) => u.barcode?.toLowerCase() === code.trim().toLowerCase())
      );
      setScannedItemName(med ? med.name : 'Produk ditemukan');
      setScanStatus('success');
      setTimeout(() => {
        setScanStatus('idle');
      }, 1800);
      setManualCode('');
    } else {
      setScanStatus('not_found');
      setTimeout(() => {
        setScanStatus('idle');
      }, 2500);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScanCode(manualCode);
  };

  return (
    <div
      id="barcode-scanner-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">Scanner Barcode Kasir</h3>
              <p className="text-[11px] text-slate-400">Arahkan kamera ke barcode kemasan obat</p>
            </div>
          </div>
          <button
            onClick={closeScanner}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera View / Viewfinder */}
        <div className="relative bg-black h-64 sm:h-72 flex items-center justify-center overflow-hidden">
          {cameraActive ? (
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center px-6 text-slate-400">
              <Camera className="w-12 h-12 mx-auto mb-2 text-slate-600 animate-pulse" />
              <p className="text-xs text-slate-300 font-medium">
                {cameraError || 'Menghubungkan ke kamera smartphone / webcam...'}
              </p>
              {!cameraError && (
                <button
                  onClick={startCamera}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                >
                  Buka Kamera
                </button>
              )}
            </div>
          )}

          {/* Scanner Optical Reticle / Guide */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative w-64 h-36 border-2 border-emerald-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
              {/* Corner markers */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-l-4 border-b-4 border-emerald-400 -mb-1 -ml-1 rounded-bl" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-r-4 border-b-4 border-emerald-400 -mb-1 -mr-1 rounded-br" />

              {/* Animated Laser line */}
              <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-emerald-500 via-rose-500 to-emerald-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Feedback Toast Overlay */}
          {scanStatus === 'success' && (
            <div className="absolute inset-x-4 bottom-4 p-3 rounded-xl bg-emerald-600 text-white shadow-lg flex items-center gap-2.5 animate-in slide-in-from-bottom-2">
              <Check className="w-5 h-5 shrink-0" />
              <div className="text-xs">
                <p className="font-bold">+1 Masuk Keranjang!</p>
                <p className="truncate max-w-64 opacity-90">{scannedItemName}</p>
              </div>
            </div>
          )}

          {scanStatus === 'not_found' && (
            <div className="absolute inset-x-4 bottom-4 p-3 rounded-xl bg-rose-600 text-white shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-2 text-xs">
              <X className="w-5 h-5 shrink-0" />
              <p className="font-medium">Barcode obat tidak ditemukan dalam master data.</p>
            </div>
          )}
        </div>

        {/* Manual Barcode / USB Scanner Input */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <form onSubmit={handleManualSubmit} className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                id="input-manual-barcode"
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ketik barcode / scan dengan USB scanner..."
                autoFocus
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Scan
            </button>
          </form>

          {/* Quick Barcode Simulation Buttons & Print Sheet Link */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                Simulasi Cepat Barcode Obat:
              </p>
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold hover:underline flex items-center gap-1"
                title="Buka Lembar Barcode Siap Cetak"
              >
                <Printer className="w-3 h-3" />
                <span>Cetak Lembar Barcode</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {medicines.slice(0, 6).map((med) => (
                <button
                  key={med.id}
                  type="button"
                  onClick={() => handleScanCode(med.barcode)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-[10px] font-medium text-slate-700 transition-all text-left shadow-2xs"
                >
                  <span className="font-bold text-slate-800">{med.name.split(' ')[0]}</span>
                  <span className="text-slate-400 block font-mono text-[9px]">{med.barcode}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            title="Cetak Katalog Barcode atau Unduh File PDF"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>Katalog & PDF Barcode</span>
          </button>
          <button
            onClick={closeScanner}
            className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Barcode Print Modal */}
      <BarcodePrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        medicines={medicines}
        settings={settings}
      />
    </div>
  );
};
