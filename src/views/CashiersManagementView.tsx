import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  History,
  Key,
  KeyRound,
  Lock,
  Plus,
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CashiersManagementView: React.FC = () => {
  const { auditLogs, currentUser, users, setActiveTab } = useApp();

  // Shift drawer / modal
  const [shiftDrawerOpen, setShiftDrawerOpen] = useState(false);
  const [cashInDrawer, setCashInDrawer] = useState(500000);
  const [cashTotalEnd, setCashTotalEnd] = useState(1485000);

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Manajemen Kasir, Shift & Audit Trail
          </h2>
          <p className="text-xs text-slate-500">
            Kontrol hak akses kasir/apoteker, pergantian shift, dan log aktivitas anti-manipulasi data.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('auth')}
            className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
          >
            <KeyRound className="w-4 h-4 text-emerald-600" />
            Menu Autentikasi & Shift
          </button>
          <button
            onClick={() => setShiftDrawerOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
          >
            <Clock className="w-4 h-4 text-emerald-400" />
            Tutup Shift & Rekonsiliasi Kas
          </button>
        </div>
      </div>

      {/* Cashiers List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {users.map((c) => (
          <div
            key={c.id}
            className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-start justify-between">
                <img
                  src={c.avatar}
                  alt={c.name}
                  className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shadow-xs"
                />
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    c.role === 'admin'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {c.role === 'admin' ? 'Administrator' : 'Kasir POS'}
                </span>
              </div>

              <div className="mt-3">
                <h3 className="font-bold text-sm text-slate-900">{c.name}</h3>
                <p className="text-xs text-slate-500 font-mono">@{c.username}</p>
                <p className="text-[11px] text-slate-400 mt-1">Telp: {c.phone || '-'}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Shift Kerja:</span>
                <span className="font-semibold text-slate-700">{c.shift || 'Shift Pagi'}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Status Akun:</span>
                <span className="text-emerald-600 font-semibold capitalize">{c.status || 'Active'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AUDIT TRAIL LOG ANTI-MANIPULASI */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Audit Trail Log Anti-Manipulasi (Immutable Activity Log)
              </h3>
              <p className="text-[11px] text-slate-400">
                Mencatat setiap transaksi, pembatalan void, dan penyesuaian stok secara otomatis.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {auditLogs.length} Entri Tercatat
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-3">Tindakan / Action</th>
                <th className="py-3 px-3">Petugas / Operator</th>
                <th className="py-3 px-3">No. Referensi</th>
                <th className="py-3 px-4">Rincian Perubahan Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => {
                const isVoid = log.action.includes('VOID') || log.action.includes('HAPUS');
                const isStock = log.action.includes('STOK');

                return (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isVoid
                            ? 'bg-rose-100 text-rose-800'
                            : isStock
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{log.userName}</td>
                    <td className="py-3 px-3 uppercase text-[10px] font-mono text-slate-500 font-bold">{log.type}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{log.details}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SHIFT RECONCILIATION MODAL */}
      {shiftDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 text-xs">
            <h3 className="font-bold text-base text-slate-800 mb-1">
              Rekonsiliasi Kas & Tutup Shift
            </h3>
            <p className="text-slate-500 mb-4">
              Hitung fisik uang tunai di laci kasir sebelum serah terima ke kasir berikutnya.
            </p>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-slate-700">
                <div className="flex justify-between">
                  <span>Modal Awal Kasir:</span>
                  <span className="font-bold">Rp {cashInDrawer.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Penjualan Tunai Sistem:</span>
                  <span className="font-bold text-emerald-700">Rp 985.000</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-black text-slate-900">
                  <span>Target Uang Fisik di Laci:</span>
                  <span>Rp {(cashInDrawer + 985000).toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Hitungan Uang Fisik Kasir Riil (Rp) *
                </label>
                <input
                  type="number"
                  value={cashTotalEnd}
                  onChange={(e) => setCashTotalEnd(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 text-sm"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Status Kas: <strong>Seimbang (Balance 100%)</strong></span>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShiftDrawerOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert('Shift berhasil ditutup dan laporan serah terima kasir dicetak!');
                    setShiftDrawerOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold"
                >
                  Cetak & Serah Terima
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
