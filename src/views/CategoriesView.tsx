import React from 'react';
import { FolderTree, Layers, Pill } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CategoriesView: React.FC = () => {
  const { categories, medicines, setActiveTab } = useApp();

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Kategori & Golongan Obat
          </h2>
          <p className="text-xs text-slate-500">
            Klasifikasi regulasi obat (Obat Bebas, Obat Bebas Terbatas, Obat Keras, Sirup, Herbal, Alkes).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const medList = medicines.filter((m) => m.category === cat.name);
          const totalStock = medList.reduce((acc, m) => acc + m.stock, 0);

          return (
            <div
              key={cat.id}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${cat.color}`}>
                    {cat.name}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">{medList.length} Produk</span>
                </div>
                <p className="text-xs text-slate-600 mb-4">{cat.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Stok Fisik:</span>
                <span className="font-extrabold text-slate-800">{totalStock} Unit</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
