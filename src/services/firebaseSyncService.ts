import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import {
  Medicine,
  Category,
  Transaction,
  Customer,
  Supplier,
  StockMovement,
  PharmacySettings,
} from '../types';

export interface FirebaseSyncStats {
  medicinesCount: number;
  transactionsCount: number;
  customersCount: number;
  suppliersCount: number;
  lastSyncTime: string | null;
}

// Write single medicine
export async function syncMedicineToFirestore(medicine: Medicine): Promise<void> {
  const path = `medicines/${medicine.id}`;
  try {
    await setDoc(doc(db, 'medicines', medicine.id), medicine);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete medicine
export async function deleteMedicineFromFirestore(medicineId: string): Promise<void> {
  const path = `medicines/${medicineId}`;
  try {
    await deleteDoc(doc(db, 'medicines', medicineId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Write single transaction
export async function saveTransactionToFirestore(tx: Transaction): Promise<void> {
  const path = `transactions/${tx.id}`;
  try {
    await setDoc(doc(db, 'transactions', tx.id), tx);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Write single stock movement
export async function saveStockMovementToFirestore(sm: StockMovement): Promise<void> {
  const path = `stockMovements/${sm.id}`;
  try {
    await setDoc(doc(db, 'stockMovements', sm.id), sm);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Write single customer
export async function saveCustomerToFirestore(customer: Customer): Promise<void> {
  const path = `customers/${customer.id}`;
  try {
    await setDoc(doc(db, 'customers', customer.id), customer);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Write single supplier
export async function saveSupplierToFirestore(supplier: Supplier): Promise<void> {
  const path = `suppliers/${supplier.id}`;
  try {
    await setDoc(doc(db, 'suppliers', supplier.id), supplier);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Write pharmacy settings
export async function saveSettingsToFirestore(settings: PharmacySettings): Promise<void> {
  const path = 'settings/pharmacy';
  try {
    await setDoc(doc(db, 'settings', 'pharmacy'), settings);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Push all current local data to Firestore in batches
export async function pushAllLocalToFirestore(data: {
  medicines: Medicine[];
  categories: Category[];
  transactions: Transaction[];
  customers: Customer[];
  suppliers: Supplier[];
  stockMovements: StockMovement[];
  settings: PharmacySettings;
}): Promise<{ success: boolean; message: string; count: number }> {
  try {
    const batch = writeBatch(db);
    let totalItems = 0;

    // Medicines (limit batch size safety)
    data.medicines.slice(0, 100).forEach((med) => {
      batch.set(doc(db, 'medicines', med.id), med);
      totalItems++;
    });

    // Categories
    data.categories.forEach((cat) => {
      batch.set(doc(db, 'categories', cat.id), cat);
      totalItems++;
    });

    // Customers
    data.customers.slice(0, 50).forEach((c) => {
      batch.set(doc(db, 'customers', c.id), c);
      totalItems++;
    });

    // Suppliers
    data.suppliers.slice(0, 50).forEach((s) => {
      batch.set(doc(db, 'suppliers', s.id), s);
      totalItems++;
    });

    // Settings
    batch.set(doc(db, 'settings', 'pharmacy'), data.settings);
    totalItems++;

    await batch.commit();

    return {
      success: true,
      message: `Berhasil sinkronisasi ${totalItems} data ke Firebase Cloud Firestore!`,
      count: totalItems,
    };
  } catch (error) {
    console.error('Error pushing data to Firestore:', error);
    handleFirestoreError(error, OperationType.WRITE, 'batch/push');
    return {
      success: false,
      message: 'Gagal mengunggah data ke Firestore: ' + (error instanceof Error ? error.message : String(error)),
      count: 0,
    };
  }
}

// Pull all data from Firestore
export async function fetchAllFromFirestore(): Promise<{
  medicines: Medicine[];
  transactions: Transaction[];
  customers: Customer[];
  suppliers: Supplier[];
  stockMovements: StockMovement[];
  settings: PharmacySettings | null;
}> {
  try {
    const medsSnap = await getDocs(collection(db, 'medicines'));
    const medicines: Medicine[] = medsSnap.docs.map((d) => d.data() as Medicine);

    const txSnap = await getDocs(collection(db, 'transactions'));
    const transactions: Transaction[] = txSnap.docs.map((d) => d.data() as Transaction);

    const custSnap = await getDocs(collection(db, 'customers'));
    const customers: Customer[] = custSnap.docs.map((d) => d.data() as Customer);

    const suppSnap = await getDocs(collection(db, 'suppliers'));
    const suppliers: Supplier[] = suppSnap.docs.map((d) => d.data() as Supplier);

    const smSnap = await getDocs(collection(db, 'stockMovements'));
    const stockMovements: StockMovement[] = smSnap.docs.map((d) => d.data() as StockMovement);

    const settingsDoc = await getDoc(doc(db, 'settings', 'pharmacy'));
    const settings = settingsDoc.exists() ? (settingsDoc.data() as PharmacySettings) : null;

    return {
      medicines,
      transactions,
      customers,
      suppliers,
      stockMovements,
      settings,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'collections/all');
    throw error;
  }
}

// Listen to real-time updates for medicines
export function subscribeToMedicines(
  onUpdate: (medicines: Medicine[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'medicines'),
    (snapshot) => {
      const items: Medicine[] = snapshot.docs.map((docSnap) => docSnap.data() as Medicine);
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'medicines');
      if (onError) onError(error);
    }
  );
}

// Listen to real-time updates for transactions
export function subscribeToTransactions(
  onUpdate: (transactions: Transaction[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'transactions'),
    (snapshot) => {
      const items: Transaction[] = snapshot.docs.map((docSnap) => docSnap.data() as Transaction);
      // Sort newest first
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'transactions');
      if (onError) onError(error);
    }
  );
}
