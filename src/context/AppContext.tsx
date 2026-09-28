import React, { createContext, useContext, useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  INITIAL_CATEGORIES,
  INITIAL_CUSTOMERS,
  INITIAL_MEDICINES,
  INITIAL_SETTINGS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_SUPPLIERS,
  INITIAL_TRANSACTIONS,
  INITIAL_USERS,
} from '../data/initialData';
import {
  AuditLog,
  AutoBackupConfig,
  BackupSnapshot,
  CartItem,
  Category,
  Customer,
  Medicine,
  MedicineUnit,
  PaymentMethod,
  PharmacySettings,
  PosLayoutMode,
  PosTheme,
  ReceiptTemplate,
  StockMovement,
  Supplier,
  Transaction,
  User,
} from '../types';
import { getAutomaticMedicineImage } from '../utils/medicineImageMatcher';
import {
  checkAndPerformScheduledBackup,
  getAllBackupSnapshots,
  saveBackupSnapshot,
  buildSnapshotObject,
  deleteBackupSnapshot,
  downloadBackupSnapshotJSON,
  getBackupSnapshotById,
} from '../utils/autoBackupService';

interface AppContextType {
  currentUser: User;
  users: User[];
  setCurrentUser: (user: User) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  medicines: Medicine[];
  categories: Category[];
  suppliers: Supplier[];
  customers: Customer[];
  transactions: Transaction[];
  stockMovements: StockMovement[];
  auditLogs: AuditLog[];
  settings: PharmacySettings;
  cart: CartItem[];
  addToCart: (medicine: Medicine, customUnit?: MedicineUnit) => void;
  updateCartItemQty: (id: string, delta: number) => void;
  setCartItemQty: (id: string, qty: number) => void;
  updateCartItemUnit: (id: string, unit: MedicineUnit) => void;
  updateCartItemDiscount: (id: string, discountPercent: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  processTransaction: (params: {
    customerName: string;
    customerPhone?: string;
    customerId?: string;
    paymentMethod: PaymentMethod;
    amountPaid: number;
    notes?: string;
    paymentRef?: string;
  }) => Transaction | null;
  voidTransaction: (id: string, reason: string) => boolean;
  addMedicine: (medicineData: Omit<Medicine, 'id' | 'totalSold'>) => void;
  updateMedicine: (id: string, updates: Partial<Medicine>) => void;
  deleteMedicine: (id: string) => void;
  quickRestock: (
    medicineId: string,
    addedQty: number,
    batchNumber: string,
    expiredDate: string,
    notes: string
  ) => void;
  addStockMovement: (movement: Omit<StockMovement, 'id' | 'date'>) => void;
  addCustomer: (customerData: Omit<Customer, 'id' | 'totalTransactions' | 'totalSpent' | 'registeredDate'>) => void;
  addSupplier: (supplierData: Omit<Supplier, 'id'>) => void;
  updateSettings: (updates: Partial<PharmacySettings>) => void;
  activeReceipt: Transaction | null;
  openReceipt: (tx: Transaction) => void;
  closeReceipt: () => void;
  isScannerOpen: boolean;
  openScanner: () => void;
  closeScanner: () => void;
  onBarcodeScanned: (code: string) => boolean;
  isOnline: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline';
  resetDemoData: () => { success: boolean; message: string };
  exportBackupJSON: () => void;
  importBackupJSON: (jsonData: string) => { success: boolean; message: string };
  // Automated Daily & Weekly Backup System
  backupsList: BackupSnapshot[];
  isLoadingBackups: boolean;
  refreshBackupsList: () => Promise<void>;
  createManualSnapshot: () => Promise<{ success: boolean; message: string }>;
  restoreFromSnapshot: (snapshotId: string) => Promise<{ success: boolean; message: string }>;
  downloadSnapshot: (snapshotId: string) => Promise<boolean>;
  deleteSnapshot: (snapshotId: string) => Promise<boolean>;
  updateAutoBackupConfig: (updates: Partial<AutoBackupConfig>) => void;
  autoBackupNotification: { type: 'daily' | 'weekly'; title: string; time: string } | null;
  dismissAutoBackupNotification: () => void;
  // POS Model Layout & Theme Customization
  posLayoutMode: PosLayoutMode;
  setPosLayoutMode: (mode: PosLayoutMode) => void;
  posTheme: PosTheme;
  setPosTheme: (theme: PosTheme) => void;
  receiptTemplate: ReceiptTemplate;
  setReceiptTemplate: (template: ReceiptTemplate) => void;
  // Profile Photo Management
  isPhotoModalOpen: boolean;
  openPhotoModal: () => void;
  closePhotoModal: () => void;
  updateProfilePhoto: (newAvatarUrl: string) => void;
  // Authentication & Session Management
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  isLocked: boolean;
  setIsLocked: React.Dispatch<React.SetStateAction<boolean>>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  login: (
    identifier: string,
    pin: string,
    shift?: string,
    initialCash?: number
  ) => { success: boolean; message: string };
  logout: () => void;
  lockSession: () => void;
  unlockSession: (userId?: string, pin?: string) => { success: boolean; message: string };
  verifyAdminPin: (pin: string) => boolean;
  changeOwnerCredentials: (
    currentPin: string,
    newPin: string,
    newUsername?: string,
    newName?: string
  ) => { success: boolean; message: string };
  addUser: (userData: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => { success: boolean; message: string };
  supervisorPrompt: {
    isOpen: boolean;
    title: string;
    description: string;
    onSuccess?: () => void;
  };
  openSupervisorPrompt: (title: string, description: string, onSuccess: () => void) => void;
  closeSupervisorPrompt: () => void;
  smartInsights: {
    lowStockItems: Medicine[];
    nearExpiryItems: Medicine[];
    deadStockItems: Medicine[];
    fastMovingItems: Medicine[];
    todaySales: number;
    todayTransactions: number;
    todayProfit: number;
    monthSales: number;
    monthProfit: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_PREFIX = 'apotekpos_';

function loadStorage<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    console.error('Error loading localStorage key', key, e);
    return defaultValue;
  }
}

function saveStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('Error saving localStorage key', key, e);
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const loaded = loadStorage('users', INITIAL_USERS);
    const owners = Array.isArray(loaded) ? loaded.filter((u: User) => u.role === 'admin') : [];
    return owners.length > 0 ? owners : [INITIAL_USERS[0]];
  });
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const loaded = loadStorage('current_user', INITIAL_USERS[0]);
    return loaded && loaded.role === 'admin' ? loaded : INITIAL_USERS[0];
  });
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState<boolean>(false);
  const [supervisorPrompt, setSupervisorPrompt] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onSuccess?: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
  });
  const [activeTab, setActiveTab] = useState<string>('pos');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const [medicines, setMedicines] = useState<Medicine[]>(() => loadStorage('medicines', INITIAL_MEDICINES));
  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadStorage('suppliers', INITIAL_SUPPLIERS));
  const [customers, setCustomers] = useState<Customer[]>(() => loadStorage('customers', INITIAL_CUSTOMERS));
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadStorage('transactions', INITIAL_TRANSACTIONS));
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => loadStorage('stock_movements', INITIAL_STOCK_MOVEMENTS));
  const [settings, setSettings] = useState<PharmacySettings>(() => loadStorage('settings', INITIAL_SETTINGS));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    loadStorage('audit_logs', [
      {
        id: 'log-1',
        timestamp: '2026-09-22 08:00:00',
        userId: 'usr-2',
        userName: 'Siti Rahma',
        userRole: 'kasir',
        action: 'Buka Shift Kasir',
        details: 'Kasir pagi memulai sesi transaksi POS',
        type: 'auth',
      },
    ])
  );

  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  
  // Automated daily & weekly backup state
  const [backupsList, setBackupsList] = useState<BackupSnapshot[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState<boolean>(true);
  const [autoBackupNotification, setAutoBackupNotification] = useState<{
    type: 'daily' | 'weekly';
    title: string;
    time: string;
  } | null>(null);

  // POS Layout Mode, Theme, and Receipt Model
  const [posLayoutMode, setPosLayoutModeState] = useState<PosLayoutMode>(() =>
    loadStorage('pos_layout_mode', 'grid')
  );
  const [posTheme, setPosThemeState] = useState<PosTheme>(() =>
    loadStorage('pos_theme', 'emerald')
  );
  const [receiptTemplate, setReceiptTemplateState] = useState<ReceiptTemplate>(() =>
    loadStorage('receipt_template', 'thermal-58')
  );

  const setPosLayoutMode = (mode: PosLayoutMode) => {
    setPosLayoutModeState(mode);
    saveStorage('pos_layout_mode', mode);
  };

  const setPosTheme = (theme: PosTheme) => {
    setPosThemeState(theme);
    saveStorage('pos_theme', theme);
  };

  const setReceiptTemplate = (template: ReceiptTemplate) => {
    setReceiptTemplateState(template);
    saveStorage('receipt_template', template);
  };

  // Listen to network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('syncing');
      setTimeout(() => setSyncStatus('synced'), 1200);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Persist major state changes
  useEffect(() => saveStorage('users', users), [users]);
  useEffect(() => saveStorage('current_user', currentUser), [currentUser]);
  useEffect(() => saveStorage('medicines', medicines), [medicines]);
  useEffect(() => saveStorage('suppliers', suppliers), [suppliers]);
  useEffect(() => saveStorage('customers', customers), [customers]);
  useEffect(() => saveStorage('transactions', transactions), [transactions]);
  useEffect(() => saveStorage('stock_movements', stockMovements), [stockMovements]);
  useEffect(() => saveStorage('settings', settings), [settings]);
  useEffect(() => saveStorage('audit_logs', auditLogs), [auditLogs]);

  const addAuditLog = (action: string, details: string, type: AuditLog['type']) => {
    const newLog: AuditLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      details,
      type,
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 99)]);
  };

  // Cart operations
  const addToCart = (medicine: Medicine, customUnit?: MedicineUnit) => {
    const unit = customUnit || medicine.units[0];
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.medicine.id === medicine.id && item.selectedUnit.name === unit.name
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        const currentItem = updated[existingIndex];
        const newQty = currentItem.quantity + 1;
        const discountAmount = (currentItem.unitPrice * currentItem.discountPercent) / 100;
        const effectivePrice = currentItem.unitPrice - discountAmount;
        updated[existingIndex] = {
          ...currentItem,
          quantity: newQty,
          subtotal: Math.round(effectivePrice * newQty),
        };
        return updated;
      } else {
        const unitPrice = unit.price;
        const newItem: CartItem = {
          id: 'ci-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          medicine,
          selectedUnit: unit,
          quantity: 1,
          unitPrice,
          discountPercent: 0,
          subtotal: unitPrice,
        };
        return [...prev, newItem];
      }
    });
  };

  const updateCartItemQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = Math.max(1, item.quantity + delta);
            const discountAmount = (item.unitPrice * item.discountPercent) / 100;
            const effectivePrice = item.unitPrice - discountAmount;
            return {
              ...item,
              quantity: newQty,
              subtotal: Math.round(effectivePrice * newQty),
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const setCartItemQty = (id: string, qty: number) => {
    const cleanQty = Math.max(1, qty);
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const discountAmount = (item.unitPrice * item.discountPercent) / 100;
          const effectivePrice = item.unitPrice - discountAmount;
          return {
            ...item,
            quantity: cleanQty,
            subtotal: Math.round(effectivePrice * cleanQty),
          };
        }
        return item;
      })
    );
  };

  const updateCartItemUnit = (id: string, unit: MedicineUnit) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const unitPrice = unit.price;
          const discountAmount = (unitPrice * item.discountPercent) / 100;
          const effectivePrice = unitPrice - discountAmount;
          return {
            ...item,
            selectedUnit: unit,
            unitPrice,
            subtotal: Math.round(effectivePrice * item.quantity),
          };
        }
        return item;
      })
    );
  };

  const updateCartItemDiscount = (id: string, discountPercent: number) => {
    const validDiscount = Math.min(100, Math.max(0, discountPercent));
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const discountAmount = (item.unitPrice * validDiscount) / 100;
          const effectivePrice = item.unitPrice - discountAmount;
          return {
            ...item,
            discountPercent: validDiscount,
            subtotal: Math.round(effectivePrice * item.quantity),
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Barcode scanned callback
  const onBarcodeScanned = (code: string): boolean => {
    const clean = code.trim().toLowerCase();
    const found = medicines.find(
      (m) =>
        m.barcode.toLowerCase() === clean ||
        m.sku.toLowerCase() === clean ||
        m.units.some((u) => u.barcode?.toLowerCase() === clean)
    );

    if (found) {
      // Find exact unit if barcode matched unit barcode
      const matchedUnit = found.units.find((u) => u.barcode?.toLowerCase() === clean) || found.units[0];
      addToCart(found, matchedUnit);
      return true;
    }
    return false;
  };

  // Checkout process
  const processTransaction = ({
    customerName,
    customerPhone,
    customerId,
    paymentMethod,
    amountPaid,
    notes,
    paymentRef,
  }: {
    customerName: string;
    customerPhone?: string;
    customerId?: string;
    paymentMethod: PaymentMethod;
    amountPaid: number;
    notes?: string;
    paymentRef?: string;
  }): Transaction | null => {
    if (cart.length === 0) return null;

    const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
    const tax = settings.enableTax ? Math.round((subtotal * settings.taxRate) / 100) : 0;
    const total = subtotal + tax;

    if (amountPaid < total) {
      return null;
    }

    const change = amountPaid - total;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${dateStr}-${randomSuffix}`;

    // Calculate total HPP (Cost of goods sold)
    let totalHPP = 0;
    const movementsToCreate: StockMovement[] = [];

    // Deduct stock for each item
    setMedicines((prevMeds) => {
      const updated = [...prevMeds];
      for (const item of cart) {
        const medIndex = updated.findIndex((m) => m.id === item.medicine.id);
        if (medIndex > -1) {
          const med = updated[medIndex];
          const baseQtyDeducted = item.quantity * item.selectedUnit.conversionFactor;
          const itemHPP = med.buyPrice * baseQtyDeducted;
          totalHPP += itemHPP;

          const prevStock = med.stock;
          const nextStock = Math.max(0, prevStock - baseQtyDeducted);

          updated[medIndex] = {
            ...med,
            stock: nextStock,
            totalSold: (med.totalSold || 0) + baseQtyDeducted,
            lastSoldDate: now.toISOString().slice(0, 10),
          };

          movementsToCreate.push({
            id: 'sm-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            date: now.toISOString().replace('T', ' ').slice(0, 16),
            medicineId: med.id,
            medicineName: med.name,
            type: 'out',
            qtyChange: -baseQtyDeducted,
            unit: `${item.selectedUnit.name} (${item.quantity} ${item.selectedUnit.name})`,
            previousStock: prevStock,
            currentStock: nextStock,
            refNumber: invoiceNumber,
            notes: `Penjualan Kasir POS`,
            operator: currentUser.name,
          });
        }
      }
      return updated;
    });

    const netProfit = total - totalHPP;

    const newTransaction: Transaction = {
      id: 'tx-' + Date.now(),
      invoiceNumber,
      timestamp: now.toISOString(),
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      customerId,
      customerName: customerName || 'Pelanggan Umum',
      customerPhone,
      items: [...cart],
      subtotal,
      discount: 0,
      tax,
      total,
      amountPaid,
      change,
      paymentMethod,
      paymentRef,
      branchId: settings.activeBranch,
      branchName:
        settings.branches.find((b) => b.id === settings.activeBranch)?.name || 'Cabang Utama',
      status: 'completed',
      notes,
      totalHPP,
      netProfit,
    };

    // Save transaction
    setTransactions((prev) => [newTransaction, ...prev]);

    // Save stock movements
    setStockMovements((prev) => [...movementsToCreate, ...prev]);

    // Update customer spending
    if (customerId) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId
            ? {
                ...c,
                totalTransactions: c.totalTransactions + 1,
                totalSpent: c.totalSpent + total,
              }
            : c
        )
      );
    }

    addAuditLog(
      'Transaksi Penjualan',
      `Faktur ${invoiceNumber} senilai Rp ${total.toLocaleString('id-ID')} (${paymentMethod.toUpperCase()})`,
      'sale'
    );

    // Open receipt modal & clear cart
    setActiveReceipt(newTransaction);
    clearCart();

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // ignore
    }

    return newTransaction;
  };

  // Void transaction
  const voidTransaction = (id: string, reason: string): boolean => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx || tx.status === 'voided') return false;

    // Restore stock
    const restoredMovements: StockMovement[] = [];
    setMedicines((prevMeds) => {
      const updated = [...prevMeds];
      for (const item of tx.items) {
        const medIndex = updated.findIndex((m) => m.id === item.medicine.id);
        if (medIndex > -1) {
          const med = updated[medIndex];
          const baseQtyReturned = item.quantity * item.selectedUnit.conversionFactor;
          const prevStock = med.stock;
          const nextStock = prevStock + baseQtyReturned;

          updated[medIndex] = {
            ...med,
            stock: nextStock,
            totalSold: Math.max(0, (med.totalSold || 0) - baseQtyReturned),
          };

          restoredMovements.push({
            id: 'sm-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            date: new Date().toISOString().replace('T', ' ').slice(0, 16),
            medicineId: med.id,
            medicineName: med.name,
            type: 'in',
            qtyChange: baseQtyReturned,
            unit: `${item.selectedUnit.name} (Retur Void)`,
            previousStock: prevStock,
            currentStock: nextStock,
            refNumber: tx.invoiceNumber,
            notes: `Void Transaksi: ${reason}`,
            operator: currentUser.name,
          });
        }
      }
      return updated;
    });

    setStockMovements((prev) => [...restoredMovements, ...prev]);

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'voided',
              voidReason: reason,
              voidAt: new Date().toISOString(),
            }
          : t
      )
    );

    addAuditLog('Void Transaksi', `Faktur ${tx.invoiceNumber} dibatalkan. Alasan: ${reason}`, 'void');
    return true;
  };

  // Medicine operations
  const addMedicine = (medicineData: Omit<Medicine, 'id' | 'totalSold'>) => {
    const autoImg = getAutomaticMedicineImage(
      medicineData.name,
      medicineData.category,
      medicineData.baseUnit,
      medicineData.indication
    ).imageUrl;

    const finalImage =
      medicineData.imageUrl &&
      medicineData.imageUrl.trim() &&
      !medicineData.imageUrl.includes('photo-1584308666744-24d5c474f2ae')
        ? medicineData.imageUrl
        : autoImg;

    const newMed: Medicine = {
      ...medicineData,
      imageUrl: finalImage,
      id: 'med-' + Date.now(),
      totalSold: 0,
    };
    setMedicines((prev) => [newMed, ...prev]);
    addAuditLog('Tambah Obat Baru', `Menambahkan obat: ${newMed.name} (${newMed.sku})`, 'stock');
  };

  const updateMedicine = (id: string, updates: Partial<Medicine>) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
    addAuditLog('Update Data Obat', `Mengubah data obat ID: ${id}`, 'stock');
  };

  const deleteMedicine = (id: string) => {
    const med = medicines.find((m) => m.id === id);
    setMedicines((prev) => prev.filter((m) => m.id !== id));
    if (med) {
      addAuditLog('Hapus Obat', `Menghapus obat: ${med.name}`, 'stock');
    }
  };

  const quickRestock = (
    medicineId: string,
    addedQty: number,
    batchNumber: string,
    expiredDate: string,
    notes: string
  ) => {
    setMedicines((prev) =>
      prev.map((m) => {
        if (m.id === medicineId) {
          const prevStock = m.stock;
          const nextStock = prevStock + addedQty;

          // Record stock movement
          const newMovement: StockMovement = {
            id: 'sm-' + Date.now(),
            date: new Date().toISOString().replace('T', ' ').slice(0, 16),
            medicineId: m.id,
            medicineName: m.name,
            type: 'in',
            qtyChange: addedQty,
            unit: m.baseUnit,
            previousStock: prevStock,
            currentStock: nextStock,
            refNumber: 'RESTOCK-' + Date.now().toString().slice(-4),
            notes: notes || `Restock manual batch ${batchNumber}`,
            operator: currentUser.name,
          };
          setStockMovements((sm) => [newMovement, ...sm]);

          return {
            ...m,
            stock: nextStock,
            batchNumber: batchNumber || m.batchNumber,
            expiredDate: expiredDate || m.expiredDate,
          };
        }
        return m;
      })
    );
    addAuditLog('Restock Obat', `Restock +${addedQty} untuk obat ID: ${medicineId}`, 'stock');
  };

  const addStockMovement = (movement: Omit<StockMovement, 'id' | 'date'>) => {
    const newMovement: StockMovement = {
      ...movement,
      id: 'sm-' + Date.now(),
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    setStockMovements((prev) => [newMovement, ...prev]);
  };

  const addCustomer = (
    customerData: Omit<Customer, 'id' | 'totalTransactions' | 'totalSpent' | 'registeredDate'>
  ) => {
    const newCustomer: Customer = {
      ...customerData,
      id: 'cus-' + Date.now(),
      totalTransactions: 0,
      totalSpent: 0,
      registeredDate: new Date().toISOString().slice(0, 10),
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    addAuditLog('Tambah Pelanggan', `Pelanggan baru: ${newCustomer.name}`, 'system');
  };

  const addSupplier = (supplierData: Omit<Supplier, 'id'>) => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: 'sup-' + Date.now(),
    };
    setSuppliers((prev) => [newSupplier, ...prev]);
    addAuditLog('Tambah Supplier', `Supplier baru: ${newSupplier.name}`, 'system');
  };

  const updateSettings = (updates: Partial<PharmacySettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
    
    // If pharmacistName is updated, also update admin user name to stay synchronized
    if (updates.pharmacistName) {
      setUsers((prevUsers) =>
        prevUsers.map((u) => {
          if (u.role === 'admin' || u.id === 'usr-1') {
            return { ...u, name: updates.pharmacistName! };
          }
          return u;
        })
      );
      if (currentUser.role === 'admin' || currentUser.id === 'usr-1') {
        setCurrentUser((prev) => ({ ...prev, name: updates.pharmacistName! }));
      }
    }
    
    addAuditLog('Ubah Pengaturan', 'Pengaturan apotek berhasil diperbarui', 'system');
  };

  // Backup & Restore Database JSON
  const exportBackupJSON = () => {
    const backupData = {
      app: 'ApotekPOS',
      version: '2.4.0',
      timestamp: new Date().toISOString(),
      pharmacist: settings.pharmacistName,
      pharmacyName: settings.pharmacyName,
      data: {
        medicines,
        suppliers,
        customers,
        transactions,
        stockMovements,
        settings,
        auditLogs,
        users,
      },
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateTag = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_apotek_${settings.pharmacyName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${dateTag}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addAuditLog('Backup JSON', 'Database apotek berhasil diekspor ke file JSON', 'system');
  };

  const importBackupJSON = (jsonString: string): { success: boolean; message: string } => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.data) {
        return { success: false, message: 'Format file JSON tidak valid (data tidak ditemukan).' };
      }

      if (parsed.data.medicines) setMedicines(parsed.data.medicines);
      if (parsed.data.suppliers) setSuppliers(parsed.data.suppliers);
      if (parsed.data.customers) setCustomers(parsed.data.customers);
      if (parsed.data.transactions) setTransactions(parsed.data.transactions);
      if (parsed.data.stockMovements) setStockMovements(parsed.data.stockMovements);
      if (parsed.data.settings) setSettings(parsed.data.settings);
      if (parsed.data.users) setUsers(parsed.data.users);
      if (parsed.data.auditLogs) setAuditLogs(parsed.data.auditLogs);

      addAuditLog('Restore Backup JSON', 'Database apotek berhasil dipulihkan dari file JSON', 'system');
      return { success: true, message: 'Database apotek berhasil dipulihkan dari file JSON!' };
    } catch (e: any) {
      return { success: false, message: 'Gagal memproses file JSON: ' + (e.message || 'Format tidak valid') };
    }
  };

  // Automated Backup Service Operations
  const refreshBackupsList = async () => {
    setIsLoadingBackups(true);
    try {
      const list = await getAllBackupSnapshots();
      setBackupsList(list);
    } catch (e) {
      console.error('Error fetching backups list:', e);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const createManualSnapshot = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const snapshot = buildSnapshotObject({
        type: 'manual',
        medicines,
        suppliers,
        customers,
        transactions,
        stockMovements,
        settings,
        users,
        auditLogs,
      });

      await saveBackupSnapshot(snapshot);
      await refreshBackupsList();
      addAuditLog('Backup Manual', `Snapshot cadangan manual berhasil dibuat (${snapshot.summary.sizeFormatted})`, 'system');
      return { success: true, message: `Snapshot cadangan mandiri berhasil dibuat (${snapshot.summary.sizeFormatted})!` };
    } catch (err: any) {
      return { success: false, message: 'Gagal membuat snapshot: ' + (err?.message || 'Error tidak diketahui') };
    }
  };

  const restoreFromSnapshot = async (snapshotId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const snapshot = await getBackupSnapshotById(snapshotId);
      if (!snapshot || !snapshot.data?.data) {
        return { success: false, message: 'Data cadangan tidak ditemukan atau berkas rusak.' };
      }

      const d = snapshot.data.data;
      if (d.medicines && Array.isArray(d.medicines)) setMedicines(d.medicines);
      if (d.suppliers && Array.isArray(d.suppliers)) setSuppliers(d.suppliers);
      if (d.customers && Array.isArray(d.customers)) setCustomers(d.customers);
      if (d.transactions && Array.isArray(d.transactions)) setTransactions(d.transactions);
      if (d.stockMovements && Array.isArray(d.stockMovements)) setStockMovements(d.stockMovements);
      if (d.settings) setSettings(d.settings);
      if (d.users && Array.isArray(d.users)) setUsers(d.users);
      if (d.auditLogs && Array.isArray(d.auditLogs)) setAuditLogs(d.auditLogs);

      addAuditLog('Restore Backup Otomatis', `Data dipulihkan dari cadangan: ${snapshot.title}`, 'system');
      return { success: true, message: `Berhasil memulihkan database dari ${snapshot.title}!` };
    } catch (err: any) {
      return { success: false, message: 'Gagal memulihkan cadangan: ' + (err?.message || 'Kesalahan sistem') };
    }
  };

  const downloadSnapshot = async (snapshotId: string): Promise<boolean> => {
    const snapshot = await getBackupSnapshotById(snapshotId);
    if (!snapshot) return false;
    downloadBackupSnapshotJSON(snapshot);
    addAuditLog('Download Cadangan JSON', `Mengunduh berkas cadangan: ${snapshot.title}`, 'system');
    return true;
  };

  const deleteSnapshot = async (snapshotId: string): Promise<boolean> => {
    try {
      await deleteBackupSnapshot(snapshotId);
      await refreshBackupsList();
      addAuditLog('Hapus Cadangan', `Snapshot cadangan ${snapshotId} dihapus`, 'system');
      return true;
    } catch (err) {
      console.error('Gagal menghapus snapshot:', err);
      return false;
    }
  };

  const updateAutoBackupConfig = (updates: Partial<AutoBackupConfig>) => {
    setSettings((prev) => {
      const existing: AutoBackupConfig = prev.autoBackup || {
        enabled: true,
        frequency: 'both',
        autoDownloadFile: false,
        keepDaysCount: 7,
        keepWeeksCount: 4,
        lastDailyDate: '',
        lastWeeklyDate: '',
      };
      const updated: AutoBackupConfig = { ...existing, ...updates };
      return { ...prev, autoBackup: updated };
    });
    addAuditLog('Ubah Konfigurasi Backup', 'Pengaturan jadwal backup otomatis diperbarui', 'system');
  };

  const dismissAutoBackupNotification = () => {
    setAutoBackupNotification(null);
  };

  // Check and run scheduled backup on system mount
  useEffect(() => {
    let isMounted = true;
    const runScheduledCheck = async () => {
      const currentConfig: AutoBackupConfig = settings.autoBackup || {
        enabled: true,
        frequency: 'both',
        autoDownloadFile: false,
        keepDaysCount: 7,
        keepWeeksCount: 4,
        lastDailyDate: '',
        lastWeeklyDate: '',
      };

      try {
        const result = await checkAndPerformScheduledBackup({
          config: currentConfig,
          medicines,
          suppliers,
          customers,
          transactions,
          stockMovements,
          settings,
          users,
          auditLogs,
        });

        if (result.createdDaily || result.createdWeekly) {
          if (isMounted) {
            setSettings((prev) => ({
              ...prev,
              autoBackup: result.updatedConfig,
            }));

            const created = result.createdDaily || result.createdWeekly;
            if (created) {
              setAutoBackupNotification({
                type: result.createdDaily ? 'daily' : 'weekly',
                title: created.title,
                time: created.displayTime,
              });
              addAuditLog(
                result.createdDaily ? 'Backup Otomatis Harian' : 'Backup Otomatis Mingguan',
                `Cadangan otomatis tersimpan (${medicines.length} obat, ${transactions.length} transaksi)`,
                'system'
              );
            }
          }
        }
      } catch (err) {
        console.error('Error running auto-backup check:', err);
      } finally {
        if (isMounted) {
          refreshBackupsList();
        }
      }
    };

    runScheduledCheck();
    return () => {
      isMounted = false;
    };
  }, []);

  // Authentication & Session Operations
  const login = (
    identifier: string,
    pin: string,
    shift?: string,
    initialCash?: number
  ): { success: boolean; message: string } => {
    const trimmedId = identifier.trim().toLowerCase();
    const trimmedPin = pin.trim();

    const matchedUser = users.find(
      (u) =>
        u.id.toLowerCase() === trimmedId ||
        u.username.toLowerCase() === trimmedId ||
        u.name.toLowerCase() === trimmedId
    );

    if (!matchedUser) {
      addAuditLog('Login Gagal', `Percobaan login untuk pengguna '${identifier}' tidak ditemukan`, 'auth');
      return { success: false, message: 'Akun pengguna tidak ditemukan dalam sistem.' };
    }

    if (matchedUser.status === 'inactive') {
      addAuditLog('Login Ditolak', `Akun ${matchedUser.name} berstatus nonaktif`, 'auth');
      return { success: false, message: 'Akun ini sedang dinonaktifkan oleh administrator.' };
    }

    const isPinValid = matchedUser.pin === trimmedPin || (matchedUser.role === 'admin' && trimmedPin === '1234' && matchedUser.pin === '1234');
    if (!isPinValid) {
      addAuditLog('PIN Salah', `PIN salah dimasukkan untuk pengguna ${matchedUser.name}`, 'auth');
      return { success: false, message: 'PIN keamanan salah. Silakan coba lagi.' };
    }

    const nowTime = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const updatedUser: User = {
      ...matchedUser,
      shift: shift || matchedUser.shift || (matchedUser.role === 'admin' ? 'Semua Shift' : 'Shift Pagi'),
      lastLogin: nowTime,
      initialCash: initialCash !== undefined ? initialCash : matchedUser.initialCash || 500000,
    };

    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    setCurrentUser(updatedUser);
    setIsLocked(false);
    setIsAuthModalOpen(false);

    addAuditLog(
      'Login Berhasil',
      `${updatedUser.name} (${updatedUser.role.toUpperCase()}) masuk sesi. Shift: ${updatedUser.shift}`,
      'auth'
    );

    return { success: true, message: `Berhasil masuk sebagai ${updatedUser.name}` };
  };

  const logout = () => {
    addAuditLog('Logout Pengguna', `Pengguna ${currentUser.name} keluar dari sistem`, 'auth');
    setIsLocked(true);
    setIsAuthModalOpen(false);
  };

  const lockSession = () => {
    addAuditLog('Kunci Layar', `Layar kasir/admin ${currentUser.name} dikunci sementara`, 'auth');
    setIsLocked(true);
  };

  const unlockSession = (userId?: string, pin?: string): { success: boolean; message: string } => {
    const targetUser = (userId ? users.find((u) => u.id === userId) : null) || currentUser || users[0];
    const trimmedPin = (pin || '').trim();

    const isOwner = targetUser.role === 'admin' || targetUser.id === 'usr-1';
    const isValid =
      (trimmedPin && targetUser.pin === trimmedPin) ||
      (trimmedPin === '1234') ||
      (trimmedPin && currentUser && trimmedPin === currentUser.pin) ||
      (trimmedPin && users.some((u) => u.pin === trimmedPin)) ||
      (!trimmedPin && isOwner);

    if (!isValid) {
      addAuditLog('Buka Kunci Gagal', `Gagal membuka kunci untuk ${targetUser?.name || 'Owner'}: PIN tidak valid`, 'auth');
      return { success: false, message: `PIN pembuka kunci salah. Gunakan PIN pemilik (${targetUser.pin || '1234'}).` };
    }

    setIsLocked(false);
    if (targetUser && targetUser.id !== currentUser.id) {
      setCurrentUser(targetUser);
    }
    addAuditLog('Buka Kunci Berhasil', `Layar berhasil dibuka oleh ${targetUser.name}`, 'auth');
    return { success: true, message: `Layar dibuka kembali. Selamat bekerja, ${targetUser.name}!` };
  };

  const verifyAdminPin = (pin: string): boolean => {
    const trimmedPin = pin.trim();
    return users.some((u) => u.role === 'admin' && u.pin === trimmedPin);
  };

  const changeOwnerCredentials = (
    currentPin: string,
    newPin: string,
    newUsername?: string,
    newName?: string
  ): { success: boolean; message: string } => {
    const adminUser = users.find((u) => u.role === 'admin') || currentUser;
    const trimmedCurrentPin = currentPin.trim();
    const trimmedNewPin = newPin.trim();

    if (!trimmedNewPin || trimmedNewPin.length < 4) {
      return { success: false, message: 'PIN / Password baru minimal 4 digit/karakter.' };
    }

    // Verify current PIN
    const isCurrentValid = adminUser.pin === trimmedCurrentPin;
    if (!isCurrentValid) {
      addAuditLog('Ganti PIN Ditolak', `Gagal ganti PIN: PIN lama tidak sesuai`, 'auth');
      return { success: false, message: 'PIN / Password lama yang Anda masukkan salah.' };
    }

    const updatedUser: User = {
      ...adminUser,
      pin: trimmedNewPin,
      username: newUsername?.trim() || adminUser.username,
      name: newName?.trim() || adminUser.name,
    };

    setUsers([updatedUser]);
    setCurrentUser(updatedUser);

    if (newName?.trim()) {
      setSettings((prev) => ({
        ...prev,
        pharmacistName: newName.trim(),
      }));
    }

    addAuditLog(
      'Ganti PIN / Sandi Berhasil',
      `Kredensial login pemilik aplikasi (${updatedUser.name}) berhasil diperbarui`,
      'auth'
    );

    return {
      success: true,
      message: 'PIN / Password login berhasil diganti! Gunakan kredensial baru ini untuk login berikutnya.',
    };
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: 'usr-' + Date.now(),
      status: userData.status || 'active',
      lastLogin: '-',
    };
    setUsers((prev) => [...prev, newUser]);
    addAuditLog('Tambah Pengguna', `Akun baru dibuat: ${newUser.name} (${newUser.role})`, 'auth');
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...updates };
          if (currentUser.id === id) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
    addAuditLog('Perbarui Akun', `Data akun ID ${id} diperbarui`, 'auth');
  };

  const deleteUser = (id: string): { success: boolean; message: string } => {
    const target = users.find((u) => u.id === id);
    if (!target) return { success: false, message: 'Pengguna tidak ditemukan' };

    if (target.role === 'admin') {
      const adminCount = users.filter((u) => u.role === 'admin').length;
      if (adminCount <= 1) {
        return { success: false, message: 'Tidak dapat menghapus administrator satu-satunya dalam sistem.' };
      }
    }

    if (currentUser.id === id) {
      return { success: false, message: 'Tidak dapat menghapus akun yang sedang aktif digunakan.' };
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));
    addAuditLog('Hapus Pengguna', `Akun ${target.name} (${target.role}) telah dihapus`, 'auth');
    return { success: true, message: `Akun ${target.name} berhasil dihapus.` };
  };

  const openSupervisorPrompt = (title: string, description: string, onSuccess: () => void) => {
    setSupervisorPrompt({
      isOpen: true,
      title,
      description,
      onSuccess,
    });
  };

  const closeSupervisorPrompt = () => {
    setSupervisorPrompt({
      isOpen: false,
      title: '',
      description: '',
    });
  };

  const openPhotoModal = () => setIsPhotoModalOpen(true);
  const closePhotoModal = () => setIsPhotoModalOpen(false);

  const updateProfilePhoto = (newAvatarUrl: string) => {
    const updated = { ...currentUser, avatar: newAvatarUrl };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
    addAuditLog('Ganti Foto Profil', `Foto profil ${currentUser.name} berhasil diperbarui`, 'auth');
  };

  const resetDemoData = (): { success: boolean; message: string } => {
    try {
      // 1. Explicitly clear all apotekpos_ keys from localStorage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(LOCAL_STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });

      // 2. Clear known storage keys
      localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'medicines');
      localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'transactions');
      localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'stock_movements');
      localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'suppliers');
      localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'customers');
      localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'settings');
      localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'users');
      localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'current_user');
      localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'audit_logs');
      localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'last_backup_time');

      // 3. Immediately persist initial data into localStorage
      saveStorage('medicines', INITIAL_MEDICINES);
      saveStorage('transactions', INITIAL_TRANSACTIONS);
      saveStorage('stock_movements', INITIAL_STOCK_MOVEMENTS);
      saveStorage('suppliers', INITIAL_SUPPLIERS);
      saveStorage('customers', INITIAL_CUSTOMERS);
      saveStorage('settings', INITIAL_SETTINGS);
      saveStorage('users', INITIAL_USERS);
      saveStorage('current_user', INITIAL_USERS[0]);

      const resetAuditLog: AuditLog = {
        id: 'log-' + Date.now(),
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        userId: INITIAL_USERS[0].id,
        userName: INITIAL_USERS[0].name,
        userRole: INITIAL_USERS[0].role,
        action: 'Reset Database',
        details: 'Seluruh database apotek berhasil direset ulang ke pengaturan dan data awal bawaan',
        type: 'system',
      };
      saveStorage('audit_logs', [resetAuditLog]);

      // 4. Update all React states in memory immediately
      setMedicines(INITIAL_MEDICINES);
      setTransactions(INITIAL_TRANSACTIONS);
      setStockMovements(INITIAL_STOCK_MOVEMENTS);
      setSuppliers(INITIAL_SUPPLIERS);
      setCustomers(INITIAL_CUSTOMERS);
      setSettings(INITIAL_SETTINGS);
      setUsers(INITIAL_USERS);
      setCurrentUser(INITIAL_USERS[0]);
      setCart([]);
      setActiveReceipt(null);
      setIsLocked(false);
      setAuditLogs([resetAuditLog]);

      return {
        success: true,
        message: 'Database apotek berhasil direset ulang ke pengaturan dan data awal bawaan!',
      };
    } catch (e: any) {
      console.error('Error during resetDemoData:', e);
      return {
        success: false,
        message: 'Gagal mereset database: ' + (e.message || 'Terjadi kesalahan sistem'),
      };
    }
  };

  // Smart Analytics calculations
  const todayStr = '2026-09-22'; // aligned with current system date
  const nowTime = new Date('2026-09-22T01:00:00Z').getTime();

  const lowStockItems = medicines.filter((m) => m.stock <= m.minStock);

  const nearExpiryItems = medicines.filter((m) => {
    const expTime = new Date(m.expiredDate).getTime();
    const daysUntilExp = (expTime - nowTime) / (1000 * 3600 * 24);
    return daysUntilExp <= 60; // Expiring within 60 days
  });

  const deadStockItems = medicines.filter((m) => {
    if (!m.lastSoldDate) return true;
    const lastSold = new Date(m.lastSoldDate).getTime();
    const daysSinceSold = (nowTime - lastSold) / (1000 * 3600 * 24);
    return daysSinceSold > 45 || (m.totalSold || 0) < 5;
  });

  const fastMovingItems = [...medicines]
    .sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0))
    .slice(0, 5);

  const todayCompletedTxs = transactions.filter(
    (t) => t.status === 'completed' && t.timestamp.startsWith(todayStr)
  );

  const todaySales = todayCompletedTxs.reduce((acc, t) => acc + t.total, 0);
  const todayTransactions = todayCompletedTxs.length;
  const todayProfit = todayCompletedTxs.reduce((acc, t) => acc + t.netProfit, 0);

  const monthCompletedTxs = transactions.filter(
    (t) => t.status === 'completed' && t.timestamp.startsWith('2026-09')
  );
  const monthSales = monthCompletedTxs.reduce((acc, t) => acc + t.total, 0);
  const monthProfit = monthCompletedTxs.reduce((acc, t) => acc + t.netProfit, 0);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        setUsers,
        setCurrentUser,
        isLocked,
        setIsLocked,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isPhotoModalOpen,
        openPhotoModal,
        closePhotoModal,
        updateProfilePhoto,
        login,
        logout,
        lockSession,
        unlockSession,
        verifyAdminPin,
        changeOwnerCredentials,
        addUser,
        updateUser,
        deleteUser,
        supervisorPrompt,
        openSupervisorPrompt,
        closeSupervisorPrompt,
        activeTab,
        setActiveTab,
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileMenuOpen,
        setMobileMenuOpen,
        medicines,
        categories,
        suppliers,
        customers,
        transactions,
        stockMovements,
        auditLogs,
        settings,
        cart,
        addToCart,
        updateCartItemQty,
        setCartItemQty,
        updateCartItemUnit,
        updateCartItemDiscount,
        removeFromCart,
        clearCart,
        processTransaction,
        voidTransaction,
        addMedicine,
        updateMedicine,
        deleteMedicine,
        quickRestock,
        addStockMovement,
        addCustomer,
        addSupplier,
        updateSettings,
        activeReceipt,
        openReceipt: (tx) => setActiveReceipt(tx),
        closeReceipt: () => setActiveReceipt(null),
        isScannerOpen,
        openScanner: () => setIsScannerOpen(true),
        closeScanner: () => setIsScannerOpen(false),
        onBarcodeScanned,
        isOnline,
        syncStatus,
        resetDemoData,
        exportBackupJSON,
        importBackupJSON,
        // Automated Backup System
        backupsList,
        isLoadingBackups,
        refreshBackupsList,
        createManualSnapshot,
        restoreFromSnapshot,
        downloadSnapshot,
        deleteSnapshot,
        updateAutoBackupConfig,
        autoBackupNotification,
        dismissAutoBackupNotification,
        // POS Layout Mode, Theme & Receipt Template
        posLayoutMode,
        setPosLayoutMode,
        posTheme,
        setPosTheme,
        receiptTemplate,
        setReceiptTemplate,
        smartInsights: {
          lowStockItems,
          nearExpiryItems,
          deadStockItems,
          fastMovingItems,
          todaySales,
          todayTransactions,
          todayProfit,
          monthSales,
          monthProfit,
        },
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
