import {
  Medicine,
  Transaction,
  Customer,
  Supplier,
  StockMovement,
  PharmacySettings,
  GasConfig,
} from '../types';

const GAS_CONFIG_STORAGE_KEY = 'apotekpos_gas_config';

export const DEFAULT_GAS_CONFIG: GasConfig = {
  webAppUrl: '',
  spreadsheetUrl: '',
  autoSyncOnTransaction: true,
  lastSyncTime: null,
  status: 'disconnected',
};

export function getGasConfig(): GasConfig {
  try {
    const saved = localStorage.getItem(GAS_CONFIG_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_GAS_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error reading GAS config from localStorage', e);
  }
  return DEFAULT_GAS_CONFIG;
}

export function saveGasConfig(config: GasConfig): void {
  try {
    localStorage.setItem(GAS_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving GAS config to localStorage', e);
  }
}

/**
 * Mengirim request ke Google Apps Script Web App.
 * Menggunakan Content-Type: 'text/plain;charset=utf-8' agar tidak memicu CORS preflight OPTIONS,
 * dan mengikuti 302 redirect bawaan Google Apps Script secara otomatis.
 */
async function callGasEndpoint(url: string, payload: any, timeoutMs = 25000): Promise<any> {
  const cleanUrl = url.trim();
  if (!cleanUrl) {
    throw new Error('URL Google Apps Script belum diisi.');
  }

  if (!cleanUrl.startsWith('https://script.google.com/macros/s/')) {
    throw new Error(
      'Format URL tidak valid. Pastikan URL diawali dengan "https://script.google.com/macros/s/.../exec"'
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok && response.status !== 302) {
      throw new Error(`Server GAS merespons dengan HTTP ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    return json;
  } catch (error: any) {
    clearTimeout(timer);
    if (error.name === 'AbortError') {
      throw new Error('Koneksi ke Google Apps Script time out (>25 detik). Silakan coba lagi.');
    }
    // Jika CORS browser memblokir karena Web App belum diset "Anyone"
    if (error.message && error.message.includes('Failed to fetch')) {
      throw new Error(
        'Gagal menghubungi GAS. Pastikan Web App di-deploy dengan akses "Who has access: Anyone" (Siapa saja).'
      );
    }
    throw error;
  }
}

/**
 * Uji Koneksi ke Google Apps Script
 */
export async function testGasConnection(
  url: string
): Promise<{ success: boolean; message: string; sheetName?: string; sheetUrl?: string }> {
  try {
    const res = await callGasEndpoint(url, { action: 'ping' });
    if (res && res.success) {
      return {
        success: true,
        message: res.message || 'Koneksi ke Google Apps Script & Spreadsheet berhasil!',
        sheetName: res.sheetName,
        sheetUrl: res.sheetUrl,
      };
    } else {
      return {
        success: false,
        message: res?.message || 'Server GAS merespons namun tidak berhasil.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal menghubungi Web App Google Apps Script.',
    };
  }
}

/**
 * Setup Otomatis Semua Sheet & Format Tabel di Google Spreadsheet
 */
export async function setupGasSheets(
  url: string
): Promise<{ success: boolean; message: string; spreadsheetUrl?: string }> {
  try {
    const res = await callGasEndpoint(url, { action: 'setupSheets' });
    if (res && res.success) {
      return {
        success: true,
        message: res.message || 'Semua sheet database berhasil dibuat dan diformat di Google Sheets!',
        spreadsheetUrl: res.spreadsheetUrl,
      };
    } else {
      return {
        success: false,
        message: res?.message || 'Gagal menyiapkan lembar kerja spreadsheet.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Terjadi kesalahan saat membuat tabel spreadsheet.',
    };
  }
}

/**
 * Unggah Seluruh Data Apotek ke Google Sheets (Push All)
 */
export async function pushAllToGas(
  url: string,
  data: {
    medicines: Medicine[];
    transactions: Transaction[];
    customers: Customer[];
    suppliers: Supplier[];
    stockMovements: StockMovement[];
    settings: PharmacySettings;
  }
): Promise<{ success: boolean; message: string; timestamp?: string }> {
  try {
    const res = await callGasEndpoint(url, {
      action: 'syncAll',
      data,
    });

    if (res && res.success) {
      return {
        success: true,
        message:
          res.message ||
          `Berhasil mengunggah ${data.medicines.length} obat & ${data.transactions.length} transaksi ke Google Sheets!`,
        timestamp: res.timestamp || new Date().toISOString(),
      };
    } else {
      return {
        success: false,
        message: res?.message || 'Gagal menyinkronkan data ke Google Sheets.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Terjadi kesalahan saat mengunggah data ke Google Sheets.',
    };
  }
}

/**
 * Kirim 1 Transaksi Baru ke Google Sheets secara real-time
 */
export async function sendTransactionToGas(
  url: string,
  transaction: Transaction
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await callGasEndpoint(
      url,
      {
        action: 'saveTransaction',
        transaction,
      },
      15000
    );

    return {
      success: !!(res && res.success),
      message: res?.message || `Faktur ${transaction.invoiceNumber} tercatat di Google Sheets`,
    };
  } catch (err: any) {
    console.warn('Auto-sync transaksi ke GAS ditangguhkan:', err.message);
    return {
      success: false,
      message: err.message || 'Gagal mengirim transaksi ke Google Sheets',
    };
  }
}

/**
 * Tarik Seluruh Data dari Google Sheets (Pull All)
 */
export async function pullAllFromGas(
  url: string
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const res = await callGasEndpoint(url, { action: 'pullAll' }, 30000);
    if (res && res.success && res.data) {
      return {
        success: true,
        message: 'Data berhasil diambil dari Google Sheets!',
        data: res.data,
      };
    } else {
      return {
        success: false,
        message: res?.message || 'Gagal menarik data dari Google Sheets.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal menghubungi server GAS untuk penarikan data.',
    };
  }
}
