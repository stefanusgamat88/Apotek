import {
  AutoBackupConfig,
  BackupSnapshot,
  BackupSnapshotType,
  Customer,
  Medicine,
  PharmacySettings,
  StockMovement,
  Supplier,
  Transaction,
  User,
  AuditLog,
} from '../types';

const DB_NAME = 'ApotekPOS_DB';
const DB_VERSION = 1;
const STORE_NAME = 'backups';
const FALLBACK_STORAGE_KEY = 'apotekpos_auto_backups_data';

// Helper to get local date tag (YYYY-MM-DD)
export function getLocalDateTag(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to get ISO week string (YYYY-Www)
export function getISOWeekString(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

// Format Indonesian friendly date
export function formatIndonesianDate(d: Date = new Date()): string {
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' WIB';
}

// IndexedDB instance initializer
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB tidak didukung pada browser ini'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('dateTag', 'dateTag', { unique: false });
        store.createIndex('weekTag', 'weekTag', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Save snapshot to IndexedDB with localStorage fallback
export async function saveBackupSnapshot(snapshot: BackupSnapshot): Promise<void> {
  try {
    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(snapshot);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Gagal menyimpan ke IndexedDB, beralih ke localStorage:', err);
    try {
      const raw = localStorage.getItem(FALLBACK_STORAGE_KEY);
      const list: BackupSnapshot[] = raw ? JSON.parse(raw) : [];
      const filtered = list.filter((b) => b.id !== snapshot.id);
      filtered.unshift(snapshot);
      // keep max 12 items in fallback storage to prevent quota exceed
      const pruned = filtered.slice(0, 12);
      localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(pruned));
    } catch (lsErr) {
      console.error('Penyimpanan cadangan lokal penuh:', lsErr);
    }
  }
}

// Retrieve all stored backup snapshots (sorted latest first)
export async function getAllBackupSnapshots(): Promise<BackupSnapshot[]> {
  try {
    const db = await openIndexedDB();
    const snapshots = await new Promise<BackupSnapshot[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as BackupSnapshot[]);
      req.onerror = () => reject(req.error);
    });

    if (snapshots && snapshots.length > 0) {
      return snapshots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } catch (err) {
    console.warn('IndexedDB tidak dapat diakses, mencoba membaca dari fallback localStorage:', err);
  }

  // Fallback
  try {
    const raw = localStorage.getItem(FALLBACK_STORAGE_KEY);
    if (raw) {
      const list: BackupSnapshot[] = JSON.parse(raw);
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } catch (lsErr) {
    console.error('Gagal membaca fallback backup:', lsErr);
  }

  return [];
}

// Get single snapshot by ID
export async function getBackupSnapshotById(id: string): Promise<BackupSnapshot | null> {
  try {
    const db = await openIndexedDB();
    return await new Promise<BackupSnapshot | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    const all = await getAllBackupSnapshots();
    return all.find((b) => b.id === id) || null;
  }
}

// Delete single snapshot by ID
export async function deleteBackupSnapshot(id: string): Promise<void> {
  try {
    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Gagal menghapus dari IndexedDB:', err);
  }

  // Also clean up from fallback
  try {
    const raw = localStorage.getItem(FALLBACK_STORAGE_KEY);
    if (raw) {
      const list: BackupSnapshot[] = JSON.parse(raw);
      const filtered = list.filter((b) => b.id !== id);
      localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (e) {
    // ignore
  }
}

// Prune old snapshots exceeding retention counts
export async function pruneOldSnapshots(maxDaily: number = 7, maxWeekly: number = 4): Promise<void> {
  try {
    const all = await getAllBackupSnapshots();
    const dailySnapshots = all.filter((s) => s.type === 'daily');
    const weeklySnapshots = all.filter((s) => s.type === 'weekly');
    const manualSnapshots = all.filter((s) => s.type === 'manual');

    // Items to remove
    const toDelete: string[] = [];

    if (dailySnapshots.length > maxDaily) {
      const excess = dailySnapshots.slice(maxDaily);
      excess.forEach((s) => toDelete.push(s.id));
    }

    if (weeklySnapshots.length > maxWeekly) {
      const excess = weeklySnapshots.slice(maxWeekly);
      excess.forEach((s) => toDelete.push(s.id));
    }

    // Keep max 10 manual snapshots
    if (manualSnapshots.length > 10) {
      const excess = manualSnapshots.slice(10);
      excess.forEach((s) => toDelete.push(s.id));
    }

    for (const id of toDelete) {
      await deleteBackupSnapshot(id);
    }
  } catch (err) {
    console.error('Gagal membersihkan cadangan lama:', err);
  }
}

// Generate complete snapshot data object
export function buildSnapshotObject(params: {
  type: BackupSnapshotType;
  medicines: Medicine[];
  suppliers: Supplier[];
  customers: Customer[];
  transactions: Transaction[];
  stockMovements: StockMovement[];
  settings: PharmacySettings;
  users: User[];
  auditLogs: AuditLog[];
}): BackupSnapshot {
  const now = new Date();
  const dateTag = getLocalDateTag(now);
  const weekTag = getISOWeekString(now);

  let id = '';
  let title = '';

  const dayName = now.toLocaleDateString('id-ID', { weekday: 'long' });
  const formattedDayMonth = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  if (params.type === 'daily') {
    id = `backup_daily_${dateTag}`;
    title = `Cadangan Harian Otomatis (${dayName}, ${formattedDayMonth})`;
  } else if (params.type === 'weekly') {
    const weekNum = weekTag.split('-W')[1] || '';
    const monthYear = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    id = `backup_weekly_${weekTag}`;
    title = `Cadangan Mingguan Otomatis (Minggu ke-${weekNum} • ${monthYear})`;
  } else {
    id = `backup_manual_${Date.now()}`;
    title = `Cadangan Manual Mandiri (${formattedDayMonth} ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})`;
  }

  const payloadData = {
    app: 'ApotekPOS',
    version: '2.5.0',
    timestamp: now.toISOString(),
    pharmacist: params.settings.pharmacistName,
    pharmacyName: params.settings.pharmacyName,
    data: {
      medicines: params.medicines,
      suppliers: params.suppliers,
      customers: params.customers,
      transactions: params.transactions,
      stockMovements: params.stockMovements,
      settings: params.settings,
      auditLogs: params.auditLogs,
      users: params.users,
    },
  };

  const jsonString = JSON.stringify(payloadData);
  const sizeBytes = new Blob([jsonString]).size;
  const totalRevenue = params.transactions
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + t.total, 0);

  return {
    id,
    type: params.type,
    title,
    createdAt: now.toISOString(),
    displayTime: formatIndonesianDate(now),
    dateTag,
    weekTag,
    summary: {
      medicinesCount: params.medicines.length,
      transactionsCount: params.transactions.length,
      stockMovementsCount: params.stockMovements.length,
      customersCount: params.customers.length,
      suppliersCount: params.suppliers.length,
      usersCount: params.users.length,
      totalRevenue,
      sizeBytes,
      sizeFormatted: formatBytes(sizeBytes),
    },
    data: payloadData,
  };
}

// Download snapshot to device as .json file
export function downloadBackupSnapshotJSON(snapshot: BackupSnapshot): void {
  const jsonStr = JSON.stringify(snapshot.data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanPharmacy = (snapshot.data.pharmacyName || 'apotek')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');
  const typeTag = snapshot.type === 'daily' ? 'harian' : snapshot.type === 'weekly' ? 'mingguan' : 'manual';
  a.download = `backup_${typeTag}_${cleanPharmacy}_${snapshot.dateTag}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Orchestrator: Check and perform scheduled daily & weekly backups
export async function checkAndPerformScheduledBackup(params: {
  config: AutoBackupConfig;
  medicines: Medicine[];
  suppliers: Supplier[];
  customers: Customer[];
  transactions: Transaction[];
  stockMovements: StockMovement[];
  settings: PharmacySettings;
  users: User[];
  auditLogs: AuditLog[];
}): Promise<{
  createdDaily?: BackupSnapshot;
  createdWeekly?: BackupSnapshot;
  updatedConfig: AutoBackupConfig;
}> {
  const { config } = params;
  if (!config || !config.enabled) {
    return { updatedConfig: config };
  }

  const now = new Date();
  const todayDateTag = getLocalDateTag(now);
  const currentWeekTag = getISOWeekString(now);

  let createdDaily: BackupSnapshot | undefined;
  let createdWeekly: BackupSnapshot | undefined;
  const nextConfig: AutoBackupConfig = { ...config };

  // 1. Check Daily Backup
  const shouldRunDaily =
    (config.frequency === 'daily' || config.frequency === 'both') &&
    config.lastDailyDate !== todayDateTag;

  if (shouldRunDaily) {
    const dailySnapshot = buildSnapshotObject({
      type: 'daily',
      medicines: params.medicines,
      suppliers: params.suppliers,
      customers: params.customers,
      transactions: params.transactions,
      stockMovements: params.stockMovements,
      settings: params.settings,
      users: params.users,
      auditLogs: params.auditLogs,
    });

    await saveBackupSnapshot(dailySnapshot);
    createdDaily = dailySnapshot;
    nextConfig.lastDailyDate = todayDateTag;
    nextConfig.lastBackupTimestamp = now.toISOString();
    nextConfig.lastBackupType = 'daily';

    if (config.autoDownloadFile) {
      try {
        downloadBackupSnapshotJSON(dailySnapshot);
      } catch (err) {
        console.warn('Gagal unduh otomatis file backup:', err);
      }
    }
  }

  // 2. Check Weekly Backup
  const shouldRunWeekly =
    (config.frequency === 'weekly' || config.frequency === 'both') &&
    config.lastWeeklyDate !== currentWeekTag;

  if (shouldRunWeekly) {
    const weeklySnapshot = buildSnapshotObject({
      type: 'weekly',
      medicines: params.medicines,
      suppliers: params.suppliers,
      customers: params.customers,
      transactions: params.transactions,
      stockMovements: params.stockMovements,
      settings: params.settings,
      users: params.users,
      auditLogs: params.auditLogs,
    });

    await saveBackupSnapshot(weeklySnapshot);
    createdWeekly = weeklySnapshot;
    nextConfig.lastWeeklyDate = currentWeekTag;
    nextConfig.lastBackupTimestamp = now.toISOString();
    nextConfig.lastBackupType = 'weekly';

    if (config.autoDownloadFile && !createdDaily) {
      try {
        downloadBackupSnapshotJSON(weeklySnapshot);
      } catch (err) {
        console.warn('Gagal unduh otomatis file backup:', err);
      }
    }
  }

  // Prune older snapshots beyond retention limits
  if (createdDaily || createdWeekly) {
    await pruneOldSnapshots(config.keepDaysCount || 7, config.keepWeeksCount || 4);
  }

  return {
    createdDaily,
    createdWeekly,
    updatedConfig: nextConfig,
  };
}
