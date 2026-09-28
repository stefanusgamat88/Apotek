import React, { useState } from 'react';
import {
  Boxes,
  Building2,
  Calendar,
  CheckCircle2,
  PackageCheck,
  Plus,
  Receipt,
  Search,
  Truck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const PurchasesView: React.FC = () => {
  const { suppliers, medicines, quickRestock, currentUser } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(suppliers[0]?.id || '');
  const [poNumber, setPoNumber] = useState('PO-202609-' + Math.floor(100 + Math.random() * 900));
  const [selectedMedicineId, setSelectedMedicineId] = useState(medicines[0]?.id || '');
  const [qty, setQty] = useState(50);
  const [batchNo, setBatchNo] = useState('B-2409' + Math.floor(10 + Math.random() * 90));
  const [expDate, setExpDate] = useState('2028-06-30');
  const [totalCost, setTotalCost] = useState(250000);
  const [notes, setNotes] = useState('Faktur Penerimaan Barang PBF Resmi');

  // Purchase order records (initial mock)
  const [poList, setPoList] = useState([
    {
      id: 'po-1',
      poNumber: 'PO-202609-881',
      date: '2026-09-21',
      supplierName: 'PT Kimia Farma Trading & Distribution',
      itemsCount: 1,
      totalAmount: 50000,
      status: 'received',
      detail: 'Paracetamol 500 mg (100 Tablet)',
    },
    {
      id: 'po-2',
      poNumber: 'PO-202609-762',
      date: '2026-09-18',
      supplierName: 'PT Enseval Putera Megatrading',
      itemsCount: 2,
      totalAmount: 480000,
      status: 'received',
      detail: 'Promag (60 Tablet), Enervon-C (12 Botol)',
    },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const med = medicines.find((m) => m.id === selectedMedicineId);
    const sup = suppliers.find((s) => s.id === selectedSupplier);
    if (!med) return;

    quickRestock(med.id, Number(qty), batchNo, expDate, `PO ${poNumber} dari ${sup?.name || 'PBF'}`);

    const newPO = {
      id: 'po-' + Date.now(),
      poNumber,
      date: new Date().toISOString().slice(0, 10),
      supplierName: sup?.name || 'Supplier PBF',
      itemsCount: 1,
      totalAmount: Number(totalCost),
      status: 'received',
      detail: `${med.name} (${qty} ${med.baseUnit})`,
    };

    setPoList([newPO, ...poList]);
    setShowModal(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Pembelian & Stok Masuk (PBF)
          </h2>
          <p className="text-xs text-slate-500">
            Penerimaan faktur pedagang besar farmasi (PBF) untuk penambahan stok otomatis.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Input Faktur Masuk PBF
        </button>
      </div>

      {/* PO List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-4">No. PO / Faktur</th>
                <th className="py-3.5 px-3">Tanggal</th>
                <th className="py-3.5 px-3">Distributor / Supplier</th>
                <th className="py-3.5 px-3">Rincian Obat</th>
                <th className="py-3.5 px-3 text-right">Nilai Faktur</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {poList.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">{po.poNumber}</td>
                  <td className="py-3 px-3 text-slate-500">{po.date}</td>
                  <td className="py-3 px-3 font-semibold text-slate-700">{po.supplierName}</td>
                  <td className="py-3 px-3 text-slate-600">{po.detail}</td>
                  <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                    Rp {po.totalAmount.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                      Diterima Gudang
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL INPUT PO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-6 animate-in zoom-in-95 text-xs">
            <h3 className="font-bold text-base text-slate-800 mb-1">
              Catat Faktur Pembelian Stok Masuk
            </h3>
            <p className="text-slate-500 mb-4">
              Stok obat dan kartu stok akan terupdate otomatis begitu faktur disimpan.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">No. Faktur PBF *</label>
                  <input
                    type="text"
                    required
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Supplier PBF *</label>
                  <select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Pilih Obat yang Diterima *</label>
                <select
                  value={selectedMedicineId}
                  onChange={(e) => setSelectedMedicineId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                >
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Stok saat ini: {m.stock} {m.baseUnit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Qty Masuk *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={qty}
                    onChange={(e) => setQty(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">No. Batch *</label>
                  <input
                    type="text"
                    required
                    value={batchNo}
                    onChange={(e) => setBatchNo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tgl Expired *</label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Total Nilai Faktur (Rp)</label>
                <input
                  type="number"
                  value={totalCost}
                  onChange={(e) => setTotalCost(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Catatan</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Terima & Tambah Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
