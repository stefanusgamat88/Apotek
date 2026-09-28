import React, { useState } from 'react';
import {
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  LogOut,
  LogIn,
  Database,
  Shield,
  Layers,
  Sparkles,
  X,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import firebaseConfig from '../../firebase-applet-config.json';

interface FirebaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseStatusModal: React.FC<FirebaseStatusModalProps> = ({ isOpen, onClose }) => {
  const {
    firebaseUser,
    isFirebaseLoading,
    loginWithGoogleAccount,
    logoutFirebaseAccount,
    syncToCloud,
    pullFromCloud,
    medicines,
    transactions,
    customers,
    cloudSyncStatus,
    isOnline,
  } = useApp();

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handlePush = async () => {
    setIsSyncing(true);
    setFeedback(null);
    try {
      const res = await syncToCloud();
      setFeedback(res);
    } catch (err) {
      setFeedback({
        success: false,
        message: err instanceof Error ? err.message : 'Gagal sinkronisasi data ke Firebase.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePull = async () => {
    setIsSyncing(true);
    setFeedback(null);
    try {
      const res = await pullFromCloud();
      setFeedback(res);
    } catch (err) {
      setFeedback({
        success: false,
        message: err instanceof Error ? err.message : 'Gagal menarik data dari Firebase.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base">Firebase Cloud Firestore</h2>
              <p className="text-xs text-emerald-100">Database Real-time & Autentikasi Cloud</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Connection Overview Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status Koneksi</span>
              <div className="flex items-center gap-1.5">
                {cloudSyncStatus === 'synced' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Terhubung & Real-time
                  </span>
                ) : cloudSyncStatus === 'syncing' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    <RotateCw className="w-3 h-3 animate-spin" />
                    Menyinkronkan...
                  </span>
                ) : !isOnline ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                    Offline
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    Belum Login Akun
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-200/70">
              <div>
                <p className="text-slate-400 font-medium">Project ID:</p>
                <p className="font-mono font-bold text-slate-800 truncate" title={firebaseConfig.projectId}>
                  {firebaseConfig.projectId}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Wilayah Cloud:</p>
                <p className="font-semibold text-slate-800">asia-southeast1</p>
              </div>
            </div>

            <div className="text-xs pt-1 border-t border-slate-200/70">
              <p className="text-slate-400 font-medium">Firestore Database ID:</p>
              <p className="font-mono text-[11px] font-semibold text-slate-700 truncate" title={firebaseConfig.firestoreDatabaseId}>
                {firebaseConfig.firestoreDatabaseId}
              </p>
            </div>
          </div>

          {/* User Auth Section */}
          <div className="p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              Autentikasi Pengguna Firebase
            </h3>

            {firebaseUser ? (
              <div className="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-xl">
                <div className="flex items-center gap-3">
                  {firebaseUser.photoURL ? (
                    <img
                      src={firebaseUser.photoURL}
                      alt={firebaseUser.displayName || 'User'}
                      className="w-10 h-10 rounded-full border border-emerald-400"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center">
                      {firebaseUser.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-tight">
                      {firebaseUser.displayName || 'Akun Google'}
                    </p>
                    <p className="text-xs text-slate-600 font-medium truncate max-w-[200px]">
                      {firebaseUser.email}
                    </p>
                    <span className="inline-block mt-0.5 px-2 py-0.2 rounded text-[10px] font-semibold bg-emerald-200/80 text-emerald-900">
                      Terverifikasi Google
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={logoutFirebaseAccount}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Login dengan Google</p>
                    <p className="text-[11px] text-slate-500">
                      Hubungkan akun Google pemilik untuk sinkronisasi otomatis ke cloud Firestore.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isFirebaseLoading}
                    onClick={loginWithGoogleAccount}
                    className="shrink-0 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Masuk dengan Google</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cloud Database Operations */}
          <div className="p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              Operasi Database Cloud
            </h3>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/70">
                <p className="font-bold text-base text-slate-800">{medicines.length}</p>
                <p className="text-[11px] text-slate-500">Obat Tersedia</p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/70">
                <p className="font-bold text-base text-slate-800">{transactions.length}</p>
                <p className="text-[11px] text-slate-500">Transaksi</p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/70">
                <p className="font-bold text-base text-slate-800">{customers.length}</p>
                <p className="text-[11px] text-slate-500">Pelanggan</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                disabled={isSyncing}
                onClick={handlePush}
                className="flex-1 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Upload Data ke Cloud</span>
              </button>

              <button
                type="button"
                disabled={isSyncing}
                onClick={handlePull}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Cloud className="w-3.5 h-3.5 text-slate-600" />
                <span>Tarik Data Terbaru</span>
              </button>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                  feedback.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {feedback.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
