import React from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ReceiptModal } from './components/ReceiptModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { LockScreenModal } from './components/LockScreenModal';
import { SupervisorPinModal } from './components/SupervisorPinModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ChangeProfilePhotoModal } from './components/ChangeProfilePhotoModal';

// Views
import { PosView } from './views/PosView';
import { DashboardView } from './views/DashboardView';
import { MedicinesView } from './views/MedicinesView';
import { StockCardsView } from './views/StockCardsView';
import { PurchasesView } from './views/PurchasesView';
import { SuppliersView } from './views/SuppliersView';
import { TransactionsView } from './views/TransactionsView';
import { CustomersView } from './views/CustomersView';
import { ReportsView } from './views/ReportsView';
import { CategoriesView } from './views/CategoriesView';
import { CashiersManagementView } from './views/CashiersManagementView';
import { SettingsView } from './views/SettingsView';
import { AuthView } from './views/AuthView';
import { PosModesView } from './views/PosModesView';
import { AiPharmacistView } from './views/AiPharmacistView';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab, isLocked, autoBackupNotification, dismissAutoBackupNotification } = useApp();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'pos':
        return <PosView />;
      case 'pos-modes':
        return <PosModesView />;
      case 'ai-pharmacist':
        return <AiPharmacistView />;
      case 'dashboard':
        return <DashboardView />;
      case 'medicines':
        return <MedicinesView />;
      case 'stock-cards':
        return <StockCardsView />;
      case 'purchases':
        return <PurchasesView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'transactions':
        return <TransactionsView />;
      case 'customers':
        return <CustomersView />;
      case 'reports':
        return <ReportsView />;
      case 'categories':
        return <CategoriesView />;
      case 'cashiers':
        return <AuthView />;
      case 'settings':
        return <SettingsView />;
      case 'auth':
        return <AuthView />;
      default:
        return <PosView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <Navbar />

        {/* Dynamic View Canvas */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-slate-100 relative">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Modals */}
      <ReceiptModal />
      <BarcodeScannerModal />
      {isLocked && <LockScreenModal />}
      <SupervisorPinModal />
      <AdminLoginModal />
      <ChangeProfilePhotoModal />

      {/* Floating Auto-Backup Notification Toast */}
      {autoBackupNotification && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 flex items-start gap-3 animate-in slide-in-from-bottom-5 fade-in">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-emerald-400">
              {autoBackupNotification.type === 'daily'
                ? 'Cadangan Harian Otomatis Tersimpan'
                : 'Cadangan Mingguan Otomatis Tersimpan'}
            </p>
            <p className="text-[11px] text-slate-300 truncate mt-0.5">{autoBackupNotification.title}</p>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('settings');
                  dismissAutoBackupNotification();
                }}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline"
              >
                Lihat Riwayat Cadangan →
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissAutoBackupNotification}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
