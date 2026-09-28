import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Boxes,
  Building2,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileSpreadsheet,
  FolderTree,
  KeyRound,
  LayoutGrid,
  Lock,
  LogOut,
  Pill,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Users,
  Wifi,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileMenuOpen,
    setMobileMenuOpen,
    currentUser,
    users,
    setCurrentUser,
    smartInsights,
    settings,
    updateSettings,
    transactions,
    syncStatus,
    lockSession,
    setIsAuthModalOpen,
  } = useApp();

  const totalAlerts = smartInsights.lowStockItems.length + smartInsights.nearExpiryItems.length;

  const menuItems = [
    { id: 'pos', label: 'Kasir POS', icon: ShoppingCart, role: 'all', badge: null, highlight: true },
    {
      id: 'pos-modes',
      label: 'Pusat Ganti Mode',
      icon: LayoutGrid,
      role: 'all',
      badge: '3 Model',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    },
    {
      id: 'ai-pharmacist',
      label: 'AI Apoteker',
      icon: Sparkles,
      role: 'all',
      badge: 'Cerdas',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
    {
      id: 'dashboard',
      label: 'Dashboard Bisnis',
      icon: BarChart3,
      role: 'all',
      badge: 'Owner',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'medicines',
      label: 'Data Obat',
      icon: Pill,
      role: 'all',
      badge: smartInsights.lowStockItems.length > 0 ? `${smartInsights.lowStockItems.length} Menipis` : null,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    { id: 'categories', label: 'Kategori Obat', icon: FolderTree, role: 'all', badge: null },
    { id: 'stock-cards', label: 'Kartu Stok', icon: ClipboardList, role: 'all', badge: null },
    { id: 'purchases', label: 'Pembelian (Stok Masuk)', icon: Boxes, role: 'all', badge: null },
    { id: 'suppliers', label: 'Supplier', icon: Building2, role: 'all', badge: null },
    { id: 'transactions', label: 'Transaksi', icon: CreditCard, role: 'all', badge: null },
    { id: 'customers', label: 'Pelanggan', icon: Users, role: 'all', badge: null },
    { id: 'reports', label: 'Laporan Lengkap', icon: FileSpreadsheet, role: 'all', badge: null },
    {
      id: 'auth',
      label: 'Ganti PIN / Sandi',
      icon: KeyRound,
      role: 'all',
      badge: 'Pemilik',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    { id: 'settings', label: 'Pengaturan & Backup', icon: Settings, role: 'all', badge: 'Backup', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  ];

  const handleMenuClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="main-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-300 ease-in-out md:static
          ${sidebarCollapsed ? 'w-20' : 'w-68'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30 shrink-0">
              <Pill className="w-6 h-6" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-white text-base tracking-tight truncate flex items-center gap-1.5">
                  ApotekPOS
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                    PRO
                  </span>
                </span>
                <span className="text-xs text-slate-400 truncate">{settings.pharmacyName}</span>
              </div>
            )}
          </div>

          <button
            id="btn-collapse-sidebar"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={sidebarCollapsed ? 'Perbesar Sidebar' : 'Ciutkan Sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Branch Selector (Desktop & Expanded) */}
        {!sidebarCollapsed && (
          <div className="px-4 py-2.5 bg-slate-950/20 border-b border-slate-800/60">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-emerald-400" />
                Cabang Apotek
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">Online</span>
            </div>
            <select
              id="branch-selector"
              value={settings.activeBranch}
              onChange={(e) => updateSettings({ activeBranch: e.target.value })}
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-slate-200 py-1.5 px-2 focus:outline-none focus:border-emerald-500"
            >
              {settings.branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1 custom-scrollbar">
          {/* Prominent Tombol Login Admin (if current role is cashier) */}
          {currentUser.role !== 'admin' && (
            <div className="mb-3">
              {!sidebarCollapsed ? (
                <button
                  id="btn-sidebar-admin-login-cta"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 hover:from-purple-900 hover:to-indigo-900 border border-purple-500/50 text-left flex items-center justify-between text-xs text-white shadow-lg shadow-purple-950/40 transition-all group"
                  title="Klik untuk membuka login admin sebelum masuk dashboard"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-purple-500/30 text-purple-300 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-[11px] text-purple-200 truncate">Tombol Login Admin</span>
                      <span className="text-[9px] text-slate-400 truncate">Masuk Dashboard & Laba</span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-purple-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>
              ) : (
                <button
                  id="btn-sidebar-admin-login-collapsed"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full p-2 rounded-xl bg-purple-950 border border-purple-500/50 text-purple-300 hover:bg-purple-900 flex items-center justify-center transition-colors"
                  title="Tombol Login Admin (Sebelum Masuk Dashboard)"
                >
                  <ShieldCheck className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {menuItems.map((item) => {
            const isAccessible = item.role === 'all' || currentUser.role === 'admin';
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            if (!isAccessible) {
              return null;
            }

            return (
              <button
                key={item.id}
                id={`menu-item-${item.id}`}
                onClick={() => handleMenuClick(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative
                  ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }
                  ${sidebarCollapsed ? 'justify-center px-2' : ''}
                `}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                  }`}
                />

                {!sidebarCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}

                {!sidebarCollapsed && item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                      item.badgeColor || 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Active Indicator Bar on Collapsed */}
                {sidebarCollapsed && isActive && (
                  <div className="absolute right-0 top-2 bottom-2 w-1 bg-emerald-400 rounded-l" />
                )}
              </button>
            );
          })}
        </div>

        {/* Quota / Transaction Limit Meter */}
        {!sidebarCollapsed && (
          <div className="px-4 py-3 mx-3 mb-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">Transaksi Bulan Ini</span>
              <span className="text-emerald-400 font-bold">
                {transactions.length} / {settings.transactionLimit}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (transactions.length / settings.transactionLimit) * 100)}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
              <span className="flex items-center gap-1">
                <Wifi className={`w-3 h-3 ${syncStatus === 'synced' ? 'text-emerald-400' : 'text-amber-400'}`} />
                {syncStatus === 'synced' ? 'Cloud Sync Aktif' : 'Menyinkronkan...'}
              </span>
              <span className="text-slate-400">PWA Ready</span>
            </div>
          </div>
        )}

        {/* User Card & Role Switcher */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} gap-2`}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-9 h-9 rounded-full object-cover border-2 border-emerald-500/40 shrink-0"
              />
              {!sidebarCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-white truncate">{currentUser.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Owner / Apoteker
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">Personal POS</span>
                  </div>
                </div>
              )}
            </div>

            {!sidebarCollapsed && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  id="btn-sidebar-lock"
                  onClick={lockSession}
                  title="Kunci Layar (Lock Screen POS)"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                >
                  <Lock className="w-4 h-4" />
                </button>
                <button
                  id="btn-switch-role"
                  onClick={() => setActiveTab('auth')}
                  title="Menu Login & Keamanan"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition-colors"
                >
                  <KeyRound className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
