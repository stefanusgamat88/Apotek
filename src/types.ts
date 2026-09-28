export type UserRole = 'admin' | 'kasir';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  pin: string;
  username: string;
  shift?: string;
  phone?: string;
  status?: 'active' | 'inactive';
  lastLogin?: string;
  initialCash?: number;
}

export interface MedicineUnit {
  name: 'Tablet' | 'Kaplet' | 'Kapsul' | 'Strip' | 'Box' | 'Botol' | 'Sachet' | 'Pcs' | 'Tube';
  conversionFactor: number; // e.g. 1 Box = 10 Strip, 1 Strip = 10 Tablet. Base unit factor is 1.
  price: number; // Selling price for this unit
  barcode?: string;
}

export interface Medicine {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  genericName: string;
  category: string;
  indication: string;
  requiresPrescription: boolean;
  baseUnit: 'Tablet' | 'Kaplet' | 'Kapsul' | 'Botol' | 'Sachet' | 'Pcs' | 'Tube';
  units: MedicineUnit[];
  stock: number; // in base units
  minStock: number;
  buyPrice: number; // HPP modal base unit
  sellPrice: number; // Default selling price base unit
  batchNumber: string;
  expiredDate: string; // YYYY-MM-DD
  manufacturer: string;
  locationRack: string;
  imageUrl?: string;
  totalSold: number;
  lastSoldDate?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  count?: number;
}

export interface CartItem {
  id: string;
  medicine: Medicine;
  selectedUnit: MedicineUnit;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  subtotal: number;
  prescriptionNote?: string;
}

export type PaymentMethod = 'cash' | 'qris' | 'dana' | 'debit' | 'transfer';

export interface Transaction {
  id: string;
  invoiceNumber: string;
  timestamp: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  change: number;
  paymentMethod: PaymentMethod;
  paymentRef?: string;
  branchId: string;
  branchName: string;
  status: 'completed' | 'voided';
  voidReason?: string;
  voidAt?: string;
  notes?: string;
  totalHPP: number; // for exact profit calculation
  netProfit: number;
}

export interface StockMovement {
  id: string;
  date: string;
  medicineId: string;
  medicineName: string;
  type: 'in' | 'out' | 'adjustment';
  qtyChange: number; // positive or negative in base unit
  unit: string;
  previousStock: number;
  currentStock: number;
  refNumber: string; // e.g. INV-... or PO-...
  notes: string;
  operator: string;
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  paymentTerms: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  date: string;
  supplierId: string;
  supplierName: string;
  items: {
    medicineId: string;
    medicineName: string;
    unit: string;
    qty: number;
    unitCost: number;
    batchNumber: string;
    expiredDate: string;
    subtotal: number;
  }[];
  totalAmount: number;
  status: 'received' | 'pending';
  receivedAt?: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  allergies?: string;
  totalTransactions: number;
  totalSpent: number;
  registeredDate: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  type: 'auth' | 'sale' | 'stock' | 'system' | 'void';
}

export interface AutoBackupConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'both';
  autoDownloadFile: boolean; // Unduh otomatis file .json ke penyimpanan lokal/PC
  keepDaysCount: number; // Jumlah riwayat harian yang disimpan (cth: 7 hari)
  keepWeeksCount: number; // Jumlah riwayat mingguan yang disimpan (cth: 4 minggu)
  lastDailyDate?: string; // Format YYYY-MM-DD
  lastWeeklyDate?: string; // Format YYYY-Www
  lastBackupTimestamp?: string;
  lastBackupType?: 'daily' | 'weekly' | 'manual';
}

export type PosLayoutMode = 'grid' | 'table' | 'clinical';
export type PosTheme = 'emerald' | 'blue' | 'purple' | 'slate';
export type ReceiptTemplate = 'thermal-58' | 'thermal-80' | 'invoice-a4';

export interface ClinicalScreeningResult {
  hasAlert: boolean;
  severity: 'safe' | 'low' | 'moderate' | 'high' | 'danger';
  summary: string;
  interactions: {
    drugA: string;
    drugB: string;
    severity: 'minor' | 'moderate' | 'major';
    effect: string;
    recommendation: string;
  }[];
  duplications: {
    activeIngredient: string;
    medicines: string[];
    warning: string;
  }[];
  dosageWarnings: {
    medicineName: string;
    warning: string;
    safeRange: string;
  }[];
  cautions: string[];
  recommendations: string[];
}

export interface DrugAlternative {
  medicine: Medicine;
  type: 'identical_active' | 'same_therapeutic_class';
  reason: string;
  priceDiff: number; // negative means cheaper
}

export interface PatientKIEInfo {
  medicineName: string;
  genericName: string;
  usageTiming: string; // e.g. "3x Sehari, 1 tablet, 30 menit sebelum makan"
  duration: string;
  storage: string;
  dietaryNotes: string[];
  possibleSideEffects: string[];
  specialInstructions: string;
}

export type BackupSnapshotType = 'daily' | 'weekly' | 'manual';

export interface BackupSnapshotSummary {
  medicinesCount: number;
  transactionsCount: number;
  stockMovementsCount: number;
  customersCount: number;
  suppliersCount: number;
  usersCount: number;
  totalRevenue: number;
  sizeBytes: number;
  sizeFormatted: string;
}

export interface BackupSnapshot {
  id: string;
  type: BackupSnapshotType;
  title: string;
  createdAt: string; // ISO string
  displayTime: string; // e.g. "Minggu, 27 Sep 2026, 09:45 WIB"
  dateTag: string; // "2026-09-27"
  weekTag: string; // "2026-W39"
  summary: BackupSnapshotSummary;
  data: {
    app: string;
    version: string;
    timestamp: string;
    pharmacist: string;
    pharmacyName: string;
    data: {
      medicines: Medicine[];
      suppliers: Supplier[];
      customers: Customer[];
      transactions: Transaction[];
      stockMovements: StockMovement[];
      settings: PharmacySettings;
      auditLogs: AuditLog[];
      users: User[];
    };
  };
}

export interface PharmacySettings {
  pharmacyName: string;
  pharmacyTagline: string;
  address: string;
  city: string;
  phone: string;
  siaNumber: string; // Surat Izin Apotek
  sipaNumber: string; // Surat Izin Praktik Apoteker
  pharmacistName: string;
  printerPaperWidth: '58mm' | '80mm';
  taxRate: number; // e.g. 11%
  enableTax: boolean;
  receiptFooter: string;
  activeBranch: string;
  branches: { id: string; name: string; address: string }[];
  transactionLimit: number; // e.g. 150 trial / plan
  autoBackup?: AutoBackupConfig;
}

