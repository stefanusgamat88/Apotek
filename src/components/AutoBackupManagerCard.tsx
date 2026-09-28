import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  Database,
  Download,
  FileJson,
  FolderDown,
  HardDrive,
  History,
  Layers,
  RefreshCw,
  RotateCcw,
  Save,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AutoBackupConfig, BackupSnapshot, BackupSnapshotType } from '../types';

export const AutoBackupManagerCard: React.FC = () => {
  const {
    settings,
    backupsList,
    isLoadingBackups,
    refreshBackupsList,
    createManualSnapshot,
    restoreFromSnapshot,
    downloadSnapshot,
    deleteSnapshot,
    updateAutoBackupConfig,
  } = useApp();

  const autoBackup: AutoBackupConfig = settings.autoBackup || {
    enabled: true,
    frequency: 'both',
    autoDownloadFile: false,
    keepDaysCount: 7,
    keepWeeksCount: 4,
    lastDailyDate: '',
    lastWeeklyDate: '',
  };

  const [activeTab, setActiveTab] = useState<'all' | 'daily' | 'weekly' | 'manual'>('all');
  const [showConfigPanel, setShowConfigPanel] = useState<boolean>(false);
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState<boolean>(false);
  const [snapshotFeedback, setSnapshotFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Restore Modal State
  const [snapshotToRestore, setSnapshotToRestore] = useState<BackupSnapshot | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

  // Delete Modal State
  const [snapshotToDelete, setSnapshotToDelete] = useState<BackupSnapshot | null>(null);

  // Temporary config form state
  const [formEnabled, setFormEnabled] = useState<boolean>(autoBackup.enabled);
  const [formFrequency, setFormFrequency] = useState<'daily' | 'weekly' | 'both'>(autoBackup.frequency);
  const [formAutoDownload, setFormAutoDownload] = useState<boolean>(autoBackup.autoDownloadFile);
  const [formKeepDays, setFormKeepDays] = useState<number>(autoBackup.keepDaysCount || 7);
  const [formKeepWeeks, setFormKeepWeeks] = useState<number>(autoBackup.keepWeeksCount || 4);
  const [configSavedToast, setConfigSavedToast] = useState<boolean>(false);

  const handleSaveConfig = () => {
    updateAutoBackupConfig({
      enabled: formEnabled,
      frequency: formFrequency,
      autoDownloadFile: formAutoDownload,
      keepDaysCount: formKeepDays,
      keepWeeksCount: formKeepWeeks,
    });
    setConfigSavedToast(true);
    setTimeout(() => setConfigSavedToast(false), 3000);
  };

  const handleCreateInstantSnapshot = async () => {
    setIsCreatingSnapshot(true);
    const res = await createManualSnapshot();
    setIsCreatingSnapshot(false);
    setSnapshotFeedback(res);
    setTimeout(() => setSnapshotFeedback(null), 5000);
  };

  const handleConfirmRestore = async () => {
    if (!snapshotToRestore) return;
    setIsRestoring(true);
    const res = await restoreFromSnapshot(snapshotToRestore.id);
    setIsRestoring(false);
    setSnapshotToRestore(null);
    setSnapshotFeedback(res);
    setTimeout(() => setSnapshotFeedback(null), 6000);
  };

  const handleConfirmDelete = async () => {
    if (!snapshotToDelete) return;
    await deleteSnapshot(snapshotToDelete.id);
    setSnapshotToDelete(null);
  };

  // Filtered snapshot list
  const filteredSnapshots = backupsList.filter((s) => {
    if (activeTab === 'all') return true;
    return s.type === activeTab;
  });

  const dailyCount = backupsList.filter((s) => s.type === 'daily').length;
  const weeklyCount = backupsList.filter((s) => s.type === 'weekly').length;
  const manualCount = backupsList.filter((s) => s.type === 'manual').length;

  const latestDaily = backupsList.find((s) => s.type === 'daily');
  const latestWeekly = backupsList.find((s) => s.type === 'weekly');

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-5 p-5 sm:p-6">
      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-800 tracking-tight">
                Cadangan Data Otomatis (Harian & Mingguan)
              </h3>
              {autoBackup.enabled ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Auto-Backup Aktif
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Auto-Backup Nonaktif
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Sistem mencadangkan database apotek secara otomatis setiap hari dan minggu untuk mencegah risiko kehilangan data.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowConfigPanel(!showConfigPanel)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              showConfigPanel
                ? 'bg-slate-100 text-slate-800 border-slate-300'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>{showConfigPanel ? 'Tutup Atur Jadwal' : 'Atur Jadwal Backup'}</span>
          </button>

          <button
            type="button"
            onClick={handleCreateInstantSnapshot}
            disabled={isCreatingSnapshot}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-60"
            title="Ambil snapshot database apotek saat ini juga"
          >
            <Zap className={`w-3.5 h-3.5 ${isCreatingSnapshot ? 'animate-spin' : ''}`} />
            <span>{isCreatingSnapshot ? 'Menyimpan...' : 'Cadangkan Sekarang'}</span>
          </button>
        </div>
      </div>

      {/* Snapshot Feedback Toast */}
      {snapshotFeedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 border animate-in fade-in ${
            snapshotFeedback.success
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          {snapshotFeedback.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{snapshotFeedback.message}</span>
        </div>
      )}

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Daily Backup Status */}
        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Cadangan Harian
            </span>
            <p className="text-xs font-black text-slate-800 truncate mt-0.5">
              {latestDaily ? latestDaily.dateTag : 'Belum Ada'}
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {latestDaily ? `${latestDaily.summary.sizeFormatted} • ${latestDaily.summary.transactionsCount} Tx` : 'Otomatis dibuat tiap hari'}
            </p>
          </div>
        </div>

        {/* Card 2: Weekly Backup Status */}
        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Cadangan Mingguan
            </span>
            <p className="text-xs font-black text-slate-800 truncate mt-0.5">
              {latestWeekly ? latestWeekly.weekTag : 'Belum Ada'}
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {latestWeekly ? `${latestWeekly.summary.sizeFormatted} • Rotasi 4 Minggu` : 'Otomatis dibuat tiap minggu'}
            </p>
          </div>
        </div>

        {/* Card 3: Auto-Download File */}
        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <FolderDown className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Auto-Download Berkas
            </span>
            <p className="text-xs font-black text-slate-800 truncate mt-0.5">
              {autoBackup.autoDownloadFile ? 'Aktif (Folder Downloads)' : 'Hanya Penyimpanan Sistem'}
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {autoBackup.autoDownloadFile ? 'Salinan file .JSON diunduh' : 'Bisa diaktifkan di jadwal'}
            </p>
          </div>
        </div>

        {/* Card 4: Total Snapshots */}
        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Riwayat Snapshot
            </span>
            <p className="text-xs font-black text-slate-800 truncate mt-0.5">
              {backupsList.length} Snapshot Aman
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {dailyCount} Harian • {weeklyCount} Mingguan • {manualCount} Manual
            </p>
          </div>
        </div>
      </div>

      {/* Schedule Configuration Drawer */}
      {showConfigPanel && (
        <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-emerald-50/30 rounded-2xl border border-emerald-200/80 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              Konfigurasi Frekuensi & Perilaku Cadangan Otomatis
            </span>
            <button
              type="button"
              onClick={() => setShowConfigPanel(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Toggle Enable */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Status Pencadangan</span>
                <input
                  type="checkbox"
                  id="toggle-auto-backup"
                  checked={formEnabled}
                  onChange={(e) => setFormEnabled(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Nyalakan untuk mengaktifkan backup internal otomatis tanpa perlu menekan tombol secara manual.
              </p>
            </div>

            {/* Frequency Selection */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
              <label className="font-bold text-slate-800 block">Jadwal Siklus Cadangan</label>
              <select
                value={formFrequency}
                onChange={(e) => setFormFrequency(e.target.value as any)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-800"
              >
                <option value="both">Harian & Mingguan (Paling Aman)</option>
                <option value="daily">Harian Saja (Setiap Hari Baru)</option>
                <option value="weekly">Mingguan Saja (Setiap Pergantian Minggu)</option>
              </select>
              <p className="text-[11px] text-slate-500">
                Pilihan 'Harian & Mingguan' menyimpan snapshot harian selama 7 hari + mingguan selama 4 minggu.
              </p>
            </div>

            {/* Auto-Download File */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Unduh Berkas .JSON Otomatis</span>
                <input
                  type="checkbox"
                  id="toggle-auto-download"
                  checked={formAutoDownload}
                  onChange={(e) => setFormAutoDownload(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Secara otomatis men-download berkas .json ke folder unduhan perangkat setiap kali backup siklus tercipta.
              </p>
            </div>

            {/* Retention Daily */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
              <label className="font-bold text-slate-800 block">Simpan Cadangan Harian</label>
              <select
                value={formKeepDays}
                onChange={(e) => setFormKeepDays(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-800"
              >
                <option value={3}>3 Hari Terakhir</option>
                <option value={7}>7 Hari Terakhir (Default)</option>
                <option value={14}>14 Hari Terakhir</option>
                <option value={30}>30 Hari Terakhir</option>
              </select>
              <p className="text-[11px] text-slate-500">
                Cadangan harian yang melebihi batas waktu akan dirotasi secara otomatis agar menghemat ruang.
              </p>
            </div>

            {/* Retention Weekly */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
              <label className="font-bold text-slate-800 block">Simpan Cadangan Mingguan</label>
              <select
                value={formKeepWeeks}
                onChange={(e) => setFormKeepWeeks(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-800"
              >
                <option value={2}>2 Minggu Terakhir</option>
                <option value={4}>4 Minggu Terakhir (1 Bulan)</option>
                <option value={8}>8 Minggu Terakhir (2 Bulan)</option>
                <option value={12}>12 Minggu Terakhir (3 Bulan)</option>
              </select>
              <p className="text-[11px] text-slate-500">
                Memberikan arsip titik waktu mingguan untuk audit akuntansi atau kebutuhan riwayat.
              </p>
            </div>

            {/* Save Button Card */}
            <div className="p-3 bg-white rounded-xl border border-emerald-200 flex flex-col justify-between space-y-2">
              <span className="font-bold text-slate-800 block">Simpan Perubahan</span>
              <div className="pt-2 flex items-center justify-between gap-2">
                {configSavedToast && (
                  <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Tersimpan!
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="w-full px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all text-xs flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Terapkan Jadwal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Snapshot List Filter Tabs */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Cadangan ({backupsList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('daily')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'daily'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              Harian ({dailyCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('weekly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'weekly'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              Mingguan ({weeklyCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'manual'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Manual ({manualCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refreshBackupsList()}
              className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-medium flex items-center gap-1"
              title="Segarkan daftar cadangan"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingBackups ? 'animate-spin' : ''}`} />
              <span>Segarkan</span>
            </button>
          </div>
        </div>

        {/* Snapshots Table / Card List */}
        {isLoadingBackups ? (
          <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
            <span>Memeriksa database cadangan...</span>
          </div>
        ) : filteredSnapshots.length === 0 ? (
          <div className="py-10 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
            <Database className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">Belum ada riwayat snapshot cadangan</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Sistem akan mencadangkan otomatis saat pergantian hari/minggu baru, atau Anda dapat menekan tombol <strong>"Cadangkan Sekarang"</strong> di atas.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
            {filteredSnapshots.map((snapshot) => {
              const isDaily = snapshot.type === 'daily';
              const isWeekly = snapshot.type === 'weekly';

              const badgeColor = isDaily
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : isWeekly
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200';

              const typeLabel = isDaily ? 'Harian' : isWeekly ? 'Mingguan' : 'Manual';

              return (
                <div
                  key={snapshot.id}
                  className="p-3.5 sm:p-4 bg-white hover:bg-slate-50/80 rounded-2xl border border-slate-200/90 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isDaily
                          ? 'bg-blue-100 text-blue-700'
                          : isWeekly
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {isDaily ? (
                        <Calendar className="w-4 h-4" />
                      ) : isWeekly ? (
                        <CalendarDays className="w-4 h-4" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${badgeColor}`}>
                          {typeLabel}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800">{snapshot.title}</h4>
                        <span className="text-[11px] text-slate-400">({snapshot.displayTime})</span>
                      </div>

                      {/* Stat chips */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium">
                          💊 {snapshot.summary.medicinesCount} Obat
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium">
                          🧾 {snapshot.summary.transactionsCount} Transaksi
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium">
                          📦 {snapshot.summary.stockMovementsCount} Mutasi
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium">
                          💰 Rp {snapshot.summary.totalRevenue.toLocaleString('id-ID')}
                        </span>
                        <span className="text-slate-400 font-mono text-[10px]">
                          💾 {snapshot.summary.sizeFormatted}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end lg:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => downloadSnapshot(snapshot.id)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Unduh berkas .json ke komputer"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600" />
                      <span>Unduh .JSON</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSnapshotToRestore(snapshot)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs"
                      title="Pulihkan database dari cadangan ini"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Pulihkan Data</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSnapshotToDelete(snapshot)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Hapus cadangan ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Konfirmasi Pulihkan (Restore) Cadangan */}
      {snapshotToRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-emerald-700">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Konfirmasi Pulihkan Cadangan
                  </h3>
                  <p className="text-[11px] text-slate-400">Restore database apotek dari arsip snapshot</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSnapshotToRestore(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Pemberitahuan Penting:
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Seluruh data apotek saat ini (obat, stok, faktur kasir, mutasi) akan digantikan dengan data yang terekam pada snapshot berikut:
              </p>
            </div>

            {/* Snapshot Details */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs">{snapshotToRestore.title}</span>
                <span className="text-[10px] font-mono text-slate-400">{snapshotToRestore.summary.sizeFormatted}</span>
              </div>
              <p className="text-[11px] text-slate-500">Waktu Rekam: <strong>{snapshotToRestore.displayTime}</strong></p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 text-center">
                <div className="p-2 rounded-xl bg-white border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Katalog Obat</span>
                  <span className="font-bold text-slate-800 text-xs">{snapshotToRestore.summary.medicinesCount} item</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Faktur Penjualan</span>
                  <span className="font-bold text-slate-800 text-xs">{snapshotToRestore.summary.transactionsCount} faktur</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Mutasi Stok</span>
                  <span className="font-bold text-slate-800 text-xs">{snapshotToRestore.summary.stockMovementsCount} mutasi</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Total Omzet</span>
                  <span className="font-bold text-emerald-700 text-xs">
                    Rp {Math.round(snapshotToRestore.summary.totalRevenue / 1000)}k
                  </span>
                </div>
              </div>
            </div>

            <p className="text-slate-600 text-xs leading-relaxed">
              Apakah Anda yakin ingin memulihkan database ke titik waktu ini? Tindakan ini aman dan seluruh sistem akan segera tersinkronisasi.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSnapshotToRestore(null)}
                disabled={isRestoring}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 active:scale-95 disabled:opacity-60"
              >
                <RotateCcw className={`w-4 h-4 ${isRestoring ? 'animate-spin' : ''}`} />
                <span>{isRestoring ? 'Memulihkan Database...' : 'Ya, Pulihkan Database Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Konfirmasi Hapus Cadangan */}
      {snapshotToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-5 animate-in zoom-in-95 text-xs space-y-3">
            <div className="flex items-center gap-2.5 text-rose-600">
              <div className="w-9 h-9 rounded-2xl bg-rose-100 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-rose-600" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Hapus Snapshot Cadangan?</h3>
            </div>
            <p className="text-slate-600 text-xs">
              Cadangan <strong>"{snapshotToDelete.title}"</strong> akan dihapus dari penyimpanan internal.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSnapshotToDelete(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs active:scale-95"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
