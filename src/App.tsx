import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ReceiptModal } from './components/ReceiptModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { LockScreenModal } from './components/LockScreenModal';
import { SupervisorPinModal } from './components/SupervisorPinModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ChangeProfilePhotoModal } from './components/ChangeProfilePhotoModal';
import { GasSyncModal } from './components/GasSyncModal';

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
  const {
    activeTab,
    setActiveTab,
    isLocked,
    isGasModalOpen,
    closeGasModal,
  } = useApp();

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
      <GasSyncModal isOpen={isGasModalOpen} onClose={closeGasModal} />
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
