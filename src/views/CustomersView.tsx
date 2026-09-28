import React, { useState } from 'react';
import { AlertCircle, Heart, Phone, Plus, Search, User } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CustomersView: React.FC = () => {
  const { customers, addCustomer } = useApp();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [allergies, setAllergies] = useState('');

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.allergies?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    addCustomer({
      name,
      phone,
      email,
      allergies: allergies || 'Tidak ada riwayat alergi',
    });
    setName('');
    setPhone('');
    setEmail('');
    setAllergies('');
    setShowModal(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Database Pasien & Pelanggan Apotek
          </h2>
          <p className="text-xs text-slate-500">
            Pencatatan riwayat belanja, loyalitas pasien, dan catatan krusial alergi obat.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Tambah Pasien / Pelanggan
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama pasien, no telp, riwayat alergi..."
          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Grid of customers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{c.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {c.phone || '-'}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {c.totalTransactions} Transaksi
                  </span>
                </div>
              </div>

              {/* Allergy Warning */}
              <div className="mt-3 p-2.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 text-[11px] mb-0.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Catatan Alergi Obat:
                </div>
                <p className="text-amber-900 font-medium">{c.allergies || 'Tidak ada catatan alergi'}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Total Belanja Kumulatif:</span>
              <span className="font-bold text-slate-900">
                Rp {c.totalSpent.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 text-xs">
            <h3 className="font-bold text-base text-slate-800 mb-1">Tambah Pasien Baru</h3>
            <p className="text-slate-500 mb-4">Catat profil dan riwayat alergi obat pasien.</p>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Lengkap Pasien *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Ibu Rina Wardani"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">No. WhatsApp / Telpon *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email (Opsional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pasien@email.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Riwayat Alergi Obat (Penting untuk Keselamatan Pasien)
                </label>
                <textarea
                  rows={2}
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="Contoh: Alergi Amoxicillin, Alergi Paracetamol, Asma"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-rose-700 font-medium"
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
                  Simpan Pasien
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
