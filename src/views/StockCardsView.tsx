import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardList,
  Filter,
  Layers,
  Pill,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const StockCardsView: React.FC = () => {
  const { stockMovements, medicines } = useApp();
  const [search, setSearch] = useState('');
  const [selectedMedId, setSelectedMedId] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  const filteredMovements = stockMovements.filter((m) => {
    const matchSearch =
      m.medicineName.toLowerCase().includes(search.toLowerCase()) ||
      m.refNumber.toLowerCase().includes(search.toLowerCase()) ||
      m.notes.toLowerCase().includes(search.toLowerCase()) ||
      m.operator.toLowerCase().includes(search.toLowerCase());

    const matchMed = selectedMedId === 'all' || m.medicineId === selectedMedId;
    const matchType = selectedType === 'all' || m.type === selectedType;

    return matchSearch && matchMed && matchType;
  });

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Kartu Stok & Riwayat Mutasi Barang
          </h2>
          <p className="text-xs text-slate-500">
            Pencatatan resmi pergerakan fisik obat (keluar, masuk, retur, stock opname) per faktur transaksi.
          </p>
        </div>

        <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
          Total {stockMovements.length} Catatan Mutasi
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari faktur, obat, catatan..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Medicine Selector */}
          <select
            value={selectedMedId}
            onChange={(e) => setSelectedMedId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-700 focus:outline-none focus:border-emerald-500 max-w-xs"
          >
            <option value="all">Semua Obat</option>
            {medicines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Tipe Mutasi</option>
            <option value="out">Keluar (Penjualan)</option>
            <option value="in">Masuk (Penerimaan / Retur)</option>
            <option value="adjustment">Penyesuaian (Opname)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Waktu</th>
                <th className="py-3.5 px-3">Nama Obat</th>
                <th className="py-3.5 px-3">Tipe Mutasi</th>
                <th className="py-3.5 px-3 text-right">Qty Perubahan</th>
                <th className="py-3.5 px-3 text-center">Saldo Sebelum</th>
                <th className="py-3.5 px-3 text-center font-bold text-slate-800">Saldo Akhir</th>
                <th className="py-3.5 px-3">No. Referensi / Faktur</th>
                <th className="py-3.5 px-4">Operator / Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.map((item) => {
                const isOut = item.type === 'out';
                const isIn = item.type === 'in';

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {item.date}
                    </td>

                    <td className="py-3 px-3 font-bold text-slate-800">
                      {item.medicineName}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          isIn
                            ? 'bg-emerald-100 text-emerald-800'
                            : isOut
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isIn ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {isIn ? 'Stok Masuk' : isOut ? 'Stok Keluar' : 'Penyesuaian'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-black">
                      <span className={isIn ? 'text-emerald-600' : 'text-rose-600'}>
                        {item.qtyChange > 0 ? `+${item.qtyChange}` : item.qtyChange}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center text-slate-500 font-mono">
                      {item.previousStock}
                    </td>

                    <td className="py-3 px-3 text-center font-extrabold text-slate-900 font-mono">
                      {item.currentStock}
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-slate-700">
                      {item.refNumber}
                    </td>

                    <td className="py-3 px-4">
                      <p className="text-slate-700 font-medium">{item.notes}</p>
                      <p className="text-[10px] text-slate-400">Oleh: {item.operator}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
