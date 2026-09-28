import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertTriangle,
  Barcode,
  Clock,
  Edit2,
  Filter,
  Layers,
  PackagePlus,
  Pill,
  Plus,
  Printer,
  QrCode,
  Search,
  Tag,
  Trash2,
  Sparkles,
  Check,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Medicine, MedicineUnit } from '../types';
import { getAutomaticMedicineImage, MEDICINE_IMAGE_PRESETS } from '../utils/medicineImageMatcher';
import { detectActiveIngredient } from '../utils/medicineKnowledgeBase';
import { BarcodePrintModal } from '../components/BarcodePrintModal';

export const MedicinesView: React.FC = () => {
  const {
    medicines,
    categories,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    quickRestock,
    setActiveTab,
    settings,
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'near_expiry'>('all');

  // Barcode Print Modal state
  const [showBarcodePrintModal, setShowBarcodePrintModal] = useState<boolean>(false);
  const [selectedBarcodeMedId, setSelectedBarcodeMedId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Quick Restock Modal state
  const [restockMedicine, setRestockMedicine] = useState<Medicine | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockBatch, setRestockBatch] = useState<string>('');
  const [restockExp, setRestockExp] = useState<string>('');
  const [restockNotes, setRestockNotes] = useState<string>('');

  // Form Fields for Add/Edit
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [isGenericManuallyEdited, setIsGenericManuallyEdited] = useState(false);
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('Obat Bebas');
  const [indication, setIndication] = useState('');
  const [requiresPrescription, setRequiresPrescription] = useState(false);
  const [baseUnit, setBaseUnit] = useState<Medicine['baseUnit']>('Tablet');
  const [stock, setStock] = useState(100);
  const [minStock, setMinStock] = useState(20);
  const [buyPrice, setBuyPrice] = useState(500);
  const [sellPrice, setSellPrice] = useState(800);
  const [batchNumber, setBatchNumber] = useState('B-240901');
  const [expiredDate, setExpiredDate] = useState('2027-12-31');
  const [manufacturer, setManufacturer] = useState('Kimia Farma');
  const [locationRack, setLocationRack] = useState('Rak A-01');

  // Multi-unit configuration
  const [stripPrice, setStripPrice] = useState(7500);
  const [boxPrice, setBoxPrice] = useState(70000);
  const [hasStrip, setHasStrip] = useState(true);
  const [hasBox, setHasBox] = useState(true);

  // Dynamic Image & Icon Auto-Matcher state
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isManualImage, setIsManualImage] = useState<boolean>(false);

  // Auto-resolve active pharmaceutical ingredient based on medicine name
  const detectedIngredient = useMemo(() => {
    return detectActiveIngredient(name);
  }, [name]);

  // Handle name input change with smart auto-detection
  const handleNameChange = (newName: string) => {
    setName(newName);
    if (!isGenericManuallyEdited || !genericName.trim()) {
      const detected = detectActiveIngredient(newName);
      if (detected) {
        setGenericName(detected.genericName);
        if (detected.indication && (!indication.trim() || indication === '')) {
          setIndication(detected.indication);
        }
        if (detected.category) {
          setCategory(detected.category);
        }
        if (detected.baseUnit) {
          setBaseUnit(detected.baseUnit);
        }
        if (detected.requiresPrescription !== undefined) {
          setRequiresPrescription(detected.requiresPrescription);
        }
      }
    }
  };

  // Auto-resolve image whenever name, category, or baseUnit changes
  const autoMatched = useMemo(() => {
    return getAutomaticMedicineImage(name, category, baseUnit, indication);
  }, [name, category, baseUnit, indication]);

  // Keep imageUrl synchronized with autoMatched if user hasn't manually overridden it
  useEffect(() => {
    if (!isManualImage && isModalOpen) {
      setImageUrl(autoMatched.imageUrl);
    }
  }, [autoMatched, isManualImage, isModalOpen]);

  const filteredMedicines = medicines.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.genericName.toLowerCase().includes(search.toLowerCase()) ||
      m.sku.toLowerCase().includes(search.toLowerCase()) ||
      m.barcode.toLowerCase().includes(search.toLowerCase());

    const matchCategory = filterCategory === 'all' || m.category === filterCategory;

    let matchStatus = true;
    if (filterStatus === 'low') {
      matchStatus = m.stock <= m.minStock;
    } else if (filterStatus === 'near_expiry') {
      const days = (new Date(m.expiredDate).getTime() - new Date('2026-09-22').getTime()) / (1000 * 3600 * 24);
      matchStatus = days <= 60;
    }

    return matchSearch && matchCategory && matchStatus;
  });

  // Reset to first page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterCategory, filterStatus, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredMedicines.length / itemsPerPage));

  // Clamp current page within valid range
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedMedicines = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMedicines.slice(start, start + itemsPerPage);
  }, [filteredMedicines, currentPage, itemsPerPage]);

  const startIndex = filteredMedicines.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredMedicines.length);

  // Generate numbered pagination items with smart ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setGenericName('');
    setSku('MED-' + Math.floor(1000 + Math.random() * 9000));
    setBarcode('899' + Math.floor(1000000000 + Math.random() * 9000000000));
    setCategory('Obat Bebas');
    setIndication('');
    setRequiresPrescription(false);
    setBaseUnit('Tablet');
    setStock(100);
    setMinStock(20);
    setBuyPrice(500);
    setSellPrice(800);
    setBatchNumber('B-' + new Date().toISOString().slice(2, 7).replace('-', ''));
    setExpiredDate('2028-01-01');
    setManufacturer('Kimia Farma');
    setLocationRack('Rak A-01');
    setStripPrice(7500);
    setBoxPrice(70000);
    setHasStrip(true);
    setHasBox(true);
    setIsManualImage(false);
    setIsGenericManuallyEdited(false);
    setImageUrl(getAutomaticMedicineImage('', 'Obat Bebas', 'Tablet').imageUrl);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (med: Medicine) => {
    setEditingId(med.id);
    setName(med.name);
    setGenericName(med.genericName);
    setIsGenericManuallyEdited(true);
    setSku(med.sku);
    setBarcode(med.barcode);
    setCategory(med.category);
    setIndication(med.indication);
    setRequiresPrescription(med.requiresPrescription);
    setBaseUnit(med.baseUnit);
    setStock(med.stock);
    setMinStock(med.minStock);
    setBuyPrice(med.buyPrice);
    setSellPrice(med.sellPrice);
    setBatchNumber(med.batchNumber);
    setExpiredDate(med.expiredDate);
    setManufacturer(med.manufacturer);
    setLocationRack(med.locationRack);
    setImageUrl(med.imageUrl || getAutomaticMedicineImage(med.name, med.category, med.baseUnit, med.indication).imageUrl);
    setIsManualImage(true);

    const stripUnit = med.units.find((u) => u.name === 'Strip');
    const boxUnit = med.units.find((u) => u.name === 'Box');
    setHasStrip(!!stripUnit);
    setHasBox(!!boxUnit);
    if (stripUnit) setStripPrice(stripUnit.price);
    if (boxUnit) setBoxPrice(boxUnit.price);

    setIsModalOpen(true);
  };

  const handleSaveMedicine = (e: React.FormEvent) => {
    e.preventDefault();

    const units: MedicineUnit[] = [
      { name: baseUnit, conversionFactor: 1, price: Number(sellPrice) },
    ];
    if (hasStrip) {
      units.push({ name: 'Strip', conversionFactor: 10, price: Number(stripPrice) });
    }
    if (hasBox) {
      units.push({ name: 'Box', conversionFactor: 100, price: Number(boxPrice) });
    }

    const resolvedImage =
      imageUrl.trim() || autoMatched.imageUrl;

    const medData = {
      name,
      genericName,
      sku,
      barcode,
      category,
      indication,
      requiresPrescription,
      baseUnit,
      units,
      stock: Number(stock),
      minStock: Number(minStock),
      buyPrice: Number(buyPrice),
      sellPrice: Number(sellPrice),
      batchNumber,
      expiredDate,
      manufacturer,
      locationRack,
      imageUrl: resolvedImage,
    };

    if (editingId) {
      updateMedicine(editingId, medData);
    } else {
      addMedicine(medData);
    }

    setIsModalOpen(false);
  };

  const handleOpenRestock = (med: Medicine) => {
    setRestockMedicine(med);
    setRestockQty(50);
    setRestockBatch(med.batchNumber);
    setRestockExp(med.expiredDate);
    setRestockNotes('Restock rutin PBF distributor');
  };

  const handleConfirmRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockMedicine) return;

    quickRestock(
      restockMedicine.id,
      Number(restockQty),
      restockBatch,
      restockExp,
      restockNotes
    );

    setRestockMedicine(null);
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Katalog & Manajemen Stok Obat
          </h2>
          <p className="text-xs text-slate-500">
            Kelola master data obat, nomor batch, masa kadaluarsa & konversi multi-satuan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-open-barcode-sheet"
            onClick={() => {
              setSelectedBarcodeMedId(null);
              setShowBarcodePrintModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
            title="Cetak Lembar Barcode / Simpan PDF / Stiker Label"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Cetak & PDF Barcode</span>
          </button>
          <button
            onClick={() => setActiveTab('stock-cards')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            Lihat Kartu Stok
          </button>
          <button
            id="btn-add-medicine"
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Tambah Obat Baru
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari obat, generik, SKU, barcode..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterStatus === 'all' ? 'bg-white text-slate-800 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterStatus('low')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterStatus === 'low' ? 'bg-rose-500 text-white shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              Stok Menipis
            </button>
            <button
              onClick={() => setFilterStatus('near_expiry')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterStatus === 'near_expiry' ? 'bg-amber-500 text-white shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              Exp Dekat
            </button>
          </div>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Nama Obat & Generik</th>
                <th className="py-3.5 px-3">Golongan & Lokasi</th>
                <th className="py-3.5 px-3">Multi Satuan</th>
                <th className="py-3.5 px-3 text-center">Stok Fisik</th>
                <th className="py-3.5 px-3">Batch & Kadaluarsa</th>
                <th className="py-3.5 px-3">HPP & Harga Jual</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMedicines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Pill className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-700 text-sm">Tidak Ada Obat Ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Coba sesuaikan kata kunci pencarian atau ganti filter kategori/status.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedMedicines.map((med) => {
                  const isLow = med.stock <= med.minStock;
                  const daysToExp =
                    (new Date(med.expiredDate).getTime() - new Date('2026-09-22').getTime()) /
                    (1000 * 3600 * 24);
                  const isNearExp = daysToExp <= 60;

                  return (
                    <tr key={med.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={med.imageUrl}
                            alt={med.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 text-xs truncate">{med.name}</p>
                            <p className="text-[11px] text-slate-400 italic truncate">{med.genericName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              SKU: {med.sku} • Barcode: {med.barcode}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block ${
                              med.category === 'Obat Keras'
                                ? 'bg-rose-100 text-rose-700'
                                : med.category === 'Obat Bebas Terbatas'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {med.category}
                          </span>
                          <p className="text-[10px] text-slate-500 font-mono">{med.locationRack}</p>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {med.units.map((u) => (
                            <span
                              key={u.name}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium"
                            >
                              {u.name}: Rp {u.price.toLocaleString('id-ID')}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`font-black text-xs px-2 py-0.5 rounded-md ${
                              isLow
                                ? 'bg-rose-100 text-rose-700 animate-pulse'
                                : 'bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            {med.stock} {med.baseUnit}
                          </span>
                          <span className="text-[9px] text-slate-400 mt-0.5">Min: {med.minStock}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <p className="font-mono text-[11px] text-slate-700">{med.batchNumber}</p>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded inline-block ${
                              isNearExp
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'text-slate-500'
                            }`}
                          >
                            Exp: {med.expiredDate}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <p className="text-[11px] text-slate-400">
                            HPP: Rp {med.buyPrice.toLocaleString('id-ID')}
                          </p>
                          <p className="font-bold text-xs text-emerald-700">
                            Jual: Rp {med.sellPrice.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedBarcodeMedId(med.id);
                              setShowBarcodePrintModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            title="Cetak Barcode / Label Obat Ini"
                          >
                            <Barcode className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenRestock(med)}
                            className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold transition-colors flex items-center gap-1"
                            title="Tambah Stok Masuk / Restock"
                          >
                            <PackagePlus className="w-3.5 h-3.5" />
                            +Stok
                          </button>
                          <button
                            onClick={() => handleOpenEdit(med)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            title="Edit Obat"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteMedicine(med.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Hapus Obat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION NUMBERING BAR */}
        <div className="px-4 py-3 bg-slate-50/90 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Left info & items per page */}
          <div className="flex flex-wrap items-center gap-3 text-slate-600">
            <span>
              Menampilkan <strong className="text-slate-900 font-bold">{startIndex} - {endIndex}</strong> dari{' '}
              <strong className="text-slate-900 font-bold">{filteredMedicines.length}</strong> obat
            </span>

            <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
              <span className="text-[11px] text-slate-500">Tampilkan:</span>
              <select
                id="select-items-per-page"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 shadow-2xs"
              >
                <option value={5}>5 per hal</option>
                <option value={10}>10 per hal</option>
                <option value={20}>20 per hal</option>
                <option value={50}>50 per hal</option>
              </select>
            </div>
          </div>

          {/* Right numbering pagination controls */}
          <div className="flex items-center gap-1">
            {/* First page button */}
            <button
              id="btn-page-first"
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
              title="Halaman Pertama (1)"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Previous page button */}
            <button
              id="btn-page-prev"
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 font-semibold text-xs shadow-2xs"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sebelumnya</span>
            </button>

            {/* Numbered Page Buttons */}
            <div className="flex items-center gap-1 mx-1">
              {getPageNumbers().map((p, idx) => {
                if (p === '...') {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-400 font-bold text-xs select-none">
                      ...
                    </span>
                  );
                }
                const pageNum = p as number;
                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    id={`btn-page-${pageNum}`}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-8 h-8 px-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs scale-105'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next page button */}
            <button
              id="btn-page-next"
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 font-semibold text-xs shadow-2xs"
              title="Halaman Berikutnya"
            >
              <span className="hidden md:inline">Berikutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Last page button */}
            <button
              id="btn-page-last"
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
              title={`Halaman Terakhir (${totalPages})`}
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: Tambah / Edit Obat */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-6 my-8 animate-in zoom-in-95">
            <h3 className="font-bold text-lg text-slate-800 mb-1">
              {editingId ? 'Edit Data Obat' : 'Tambah Obat Baru ke Master Data'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Lengkapi informasi obat, nomor registrasi, satuan konversi dan harga jual.
            </p>

            <form onSubmit={handleSaveMedicine} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Nama Dagang Obat *</label>
                    <span className="text-[10px] text-slate-400">Ketik merk / nama obat</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Contoh: Antasida, Promag, Sanmol, Amoxicillin..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <span>Nama Zat Aktif / Generik *</span>
                      {detectedIngredient && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                          Otomatis
                        </span>
                      )}
                    </label>
                    {name.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          const detected = detectActiveIngredient(name);
                          if (detected) {
                            setGenericName(detected.genericName);
                            if (detected.indication) setIndication(detected.indication);
                            if (detected.category) setCategory(detected.category);
                            if (detected.baseUnit) setBaseUnit(detected.baseUnit);
                            if (detected.requiresPrescription !== undefined) setRequiresPrescription(detected.requiresPrescription);
                            setIsGenericManuallyEdited(false);
                          }
                        }}
                        className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold hover:underline flex items-center gap-1"
                        title="Deteksi ulang zat aktif dari nama obat"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        Deteksi Ulang
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={genericName}
                    onChange={(e) => {
                      setGenericName(e.target.value);
                      setIsGenericManuallyEdited(true);
                    }}
                    placeholder="Otomatis terisi dari nama obat..."
                    className={`w-full px-3 py-2 border rounded-xl focus:outline-none transition-colors font-medium text-slate-800 ${
                      detectedIngredient
                        ? 'bg-emerald-50/40 border-emerald-300 focus:border-emerald-500'
                        : 'border-slate-300 focus:border-emerald-500'
                    }`}
                  />
                  {detectedIngredient && (
                    <p className="text-[10px] text-emerald-700 font-medium mt-1 flex items-center gap-1 leading-tight">
                      <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                      Zat aktif terdeteksi otomatis dari nama "{name}"
                    </p>
                  )}
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Golongan Obat *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Barcode / EAN-13 *</label>
                  <input
                    type="text"
                    required
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Contoh: 8992772001015"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nomor Batch *</label>
                  <input
                    type="text"
                    required
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="Contoh: B-240901"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tanggal Kadaluarsa (Expired) *</label>
                  <input
                    type="date"
                    required
                    value={expiredDate}
                    onChange={(e) => setExpiredDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Stok Fisik Awal (Base Unit) *</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Batas Minimum Stok *</label>
                  <input
                    type="number"
                    required
                    value={minStock}
                    onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Harga Beli HPP (Rp) *</label>
                  <input
                    type="number"
                    required
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Harga Jual Dasar (Rp) *</label>
                  <input
                    type="number"
                    required
                    value={sellPrice}
                    onChange={(e) => setSellPrice(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Satuan Dasar *</label>
                  <select
                    value={baseUnit}
                    onChange={(e) => setBaseUnit(e.target.value as Medicine['baseUnit'])}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Kaplet">Kaplet</option>
                    <option value="Kapsul">Kapsul</option>
                    <option value="Botol">Botol</option>
                    <option value="Sachet">Sachet</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Tube">Tube</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Lokasi Rak Obat</label>
                  <input
                    type="text"
                    value={locationRack}
                    onChange={(e) => setLocationRack(e.target.value)}
                    placeholder="Contoh: Rak A-01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* FITUR OTOMATIS: Foto & Icon Obat Sesuai Nama & Jenis */}
              <div className="p-4 bg-gradient-to-br from-slate-50 via-emerald-50/20 to-white rounded-2xl border-2 border-emerald-500/30 space-y-3 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-slate-800 text-xs">
                      Foto & Ikon Visual Obat (Otomatis Sesuai Nama & Jenis)
                    </span>
                  </div>
                  {isManualImage ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsManualImage(false);
                        setImageUrl(autoMatched.imageUrl);
                      }}
                      className="text-[11px] text-emerald-700 font-bold hover:underline flex items-center gap-1 self-start sm:self-auto"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Kembalikan ke Deteksi Otomatis
                    </button>
                  ) : (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1 w-fit">
                      <Sparkles className="w-3 h-3" />
                      Aktif Menyesuaikan Nama & Golongan
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="relative group shrink-0">
                    <img
                      src={imageUrl || autoMatched.imageUrl}
                      alt="Preview Obat"
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-md bg-white"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = autoMatched.imageUrl;
                      }}
                    />
                    <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full shadow-xs">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-800 text-xs">
                        {isManualImage ? 'Kategori Sediaan Pilihan' : autoMatched.detectedType}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {category} • {baseUnit}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Sistem otomatis mendeteksi sediaan obat (Sirup, Kapsul, Tablet, Salep, dll.) langsung saat Anda mengetik nama dagang atau memilih golongan.
                    </p>
                  </div>
                </div>

                {/* Preset Fast Selector */}
                <div className="pt-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Atau Pilih Cepat Variasi Bentuk Obat:
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar p-0.5">
                    {MEDICINE_IMAGE_PRESETS.map((preset) => {
                      const isSelected = (imageUrl || autoMatched.imageUrl) === preset.imageUrl;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setImageUrl(preset.imageUrl);
                            setIsManualImage(true);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-2xs scale-102'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 hover:border-emerald-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          {preset.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Multi Satuan Config */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <p className="font-bold text-slate-800">Konfigurasi Multi Satuan (Strip / Box):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="check-has-strip"
                      checked={hasStrip}
                      onChange={(e) => setHasStrip(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <label htmlFor="check-has-strip" className="font-semibold text-slate-700">
                      Ada Satuan Strip (10 {baseUnit})
                    </label>
                  </div>
                  {hasStrip && (
                    <input
                      type="number"
                      value={stripPrice}
                      onChange={(e) => setStripPrice(parseInt(e.target.value) || 0)}
                      placeholder="Harga Jual Strip"
                      className="px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="check-has-box"
                      checked={hasBox}
                      onChange={(e) => setHasBox(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <label htmlFor="check-has-box" className="font-semibold text-slate-700">
                      Ada Satuan Box (100 {baseUnit})
                    </label>
                  </div>
                  {hasBox && (
                    <input
                      type="number"
                      value={boxPrice}
                      onChange={(e) => setBoxPrice(parseInt(e.target.value) || 0)}
                      placeholder="Harga Jual Box"
                      className="px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md"
                >
                  {editingId ? 'Simpan Perubahan' : 'Tambah Obat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Quick Restock Obat */}
      {restockMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 text-xs">
            <h3 className="font-bold text-base text-slate-800 mb-1">
              Restock Stok Masuk: {restockMedicine.name}
            </h3>
            <p className="text-slate-500 mb-4">
              Stok sekarang: <span className="font-bold text-slate-800">{restockMedicine.stock} {restockMedicine.baseUnit}</span>
            </p>

            <form onSubmit={handleConfirmRestock} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Jumlah Tambahan Stok ({restockMedicine.baseUnit}) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-emerald-700 text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nomor Batch Baru</label>
                <input
                  type="text"
                  required
                  value={restockBatch}
                  onChange={(e) => setRestockBatch(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tanggal Expired Baru</label>
                <input
                  type="date"
                  required
                  value={restockExp}
                  onChange={(e) => setRestockExp(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Catatan Penerimaan</label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  placeholder="Contoh: Faktur PBF Enseval No. 99124"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRestockMedicine(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Konfirmasi Stok Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Cetak Barcode Produk & Katalog Kasir */}
      <BarcodePrintModal
        isOpen={showBarcodePrintModal}
        onClose={() => setShowBarcodePrintModal(false)}
        medicines={medicines}
        settings={settings}
        preSelectedMedicineId={selectedBarcodeMedId}
      />
    </div>
  );
};
