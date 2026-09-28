import React, { useState, useRef } from 'react';
import {
  Camera,
  Check,
  Image as ImageIcon,
  Link as LinkIcon,
  RefreshCw,
  Upload,
  User,
  X,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

// High-quality curated healthcare & pharmacy avatar presets
const PRESET_AVATARS = [
  {
    id: 'preset-1',
    label: 'Apoteker Pria Jas Putih',
    url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-2',
    label: 'Apoteker Wanita Profesional',
    url: 'https://images.unsplash.com/photo-1594824813566-7875a357bd04?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-3',
    label: 'Farmasis Muda Medis',
    url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-4',
    label: 'Dokter & Apoteker Klinis',
    url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-5',
    label: 'Apoteker Senyum Ramah',
    url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-6',
    label: 'Tenaga Teknis Kefarmasian',
    url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-7',
    label: 'Healthcare Executive',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-8',
    label: 'Super Admin Medis',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
  },
];

export const ChangeProfilePhotoModal: React.FC = () => {
  const { isPhotoModalOpen, closePhotoModal, currentUser, updateProfilePhoto } = useApp();

  const [activeTab, setActiveTab] = useState<'upload' | 'preset' | 'url'>('upload');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentUser.avatar);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successNotice, setSuccessNotice] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isPhotoModalOpen) return null;

  // Process uploaded image file: compress via HTML5 canvas to keep lightweight
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Format file harus berupa gambar (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('Ukuran file maksimal 8 MB.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize to 280x280 square for optimal sharpness & localStorage efficiency
        const canvas = document.createElement('canvas');
        const size = 280;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          setSelectedAvatar(img.src);
          setIsProcessing(false);
          return;
        }

        // Center crop
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);

        setSelectedAvatar(compressedBase64);
        setIsProcessing(false);
      };
      img.onerror = () => {
        setErrorMessage('Gagal memproses file foto.');
        setIsProcessing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setErrorMessage('Gagal membaca file dari perangkat.');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!customUrlInput.trim()) {
      setErrorMessage('Silakan masukkan tautan (URL) gambar.');
      return;
    }
    setSelectedAvatar(customUrlInput.trim());
    setErrorMessage('');
  };

  const handleSavePhoto = () => {
    if (!selectedAvatar) {
      setErrorMessage('Pilih atau unggah foto terlebih dahulu.');
      return;
    }

    updateProfilePhoto(selectedAvatar);
    setSuccessNotice('Foto profil berhasil disimpan!');

    setTimeout(() => {
      setSuccessNotice('');
      closePhotoModal();
    }, 700);
  };

  const handleResetDefault = () => {
    const defaultUrl = 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80';
    setSelectedAvatar(defaultUrl);
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/60 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">Ganti Foto Profil</h3>
              <p className="text-xs text-slate-500">
                Perbarui foto identitas akun {currentUser.name}
              </p>
            </div>
          </div>

          <button
            onClick={closePhotoModal}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 custom-scrollbar">
          {/* Live Preview Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-around gap-4">
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Pratinjau Avatar Lingkaran
              </span>
              <div className="relative group">
                <img
                  src={selectedAvatar}
                  alt="Preview Avatar"
                  className="w-20 h-20 rounded-full object-cover border-3 border-emerald-500 shadow-md bg-white"
                  onError={(e) => {
                    // Fallback on broken image
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full shadow-xs">
                  <Check className="w-3 h-3" />
                </div>
              </div>
              <span className="text-[11px] font-semibold text-slate-700">{currentUser.name}</span>
            </div>

            <div className="hidden sm:flex flex-col items-start gap-1 p-3 bg-white rounded-xl border border-slate-200 shadow-xs max-w-xs">
              <div className="flex items-center gap-2">
                <img
                  src={selectedAvatar}
                  alt="Preview Card"
                  className="w-10 h-10 rounded-xl object-cover border border-emerald-400"
                />
                <div>
                  <p className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-emerald-600 font-semibold">
                    {currentUser.role === 'admin' ? 'Owner Apotek' : 'Kasir Bertugas'}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Tampil di Navbar, Kartu Profil, Nota Struk, dan Layar Pengunci.
              </p>
            </div>
          </div>

          {/* Feedback notices */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {successNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              {successNotice}
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Unggah File
            </button>
            <button
              onClick={() => setActiveTab('preset')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'preset'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Galeri Medis
            </button>
            <button
              onClick={() => setActiveTab('url')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'url'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              Tautan URL
            </button>
          </div>

          {/* Tab 1: Upload File */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/20 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 group-hover:bg-emerald-200 text-emerald-700 flex items-center justify-center transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Klik untuk memilih foto dari perangkat Anda
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Mendukung JPG, PNG, atau WebP (Foto otomatis dioptimasi)
                  </p>
                </div>
                {isProcessing && (
                  <span className="text-xs text-emerald-600 font-semibold animate-pulse">
                    Memproses & mengoptimasi gambar...
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Preset Healthcare Avatars */}
          {activeTab === 'preset' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Pilih salah satu karakter visual apoteker atau dokter profesional:
              </p>
              <div className="grid grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                {PRESET_AVATARS.map((preset) => {
                  const isSelected = selectedAvatar === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedAvatar(preset.url);
                        setErrorMessage('');
                      }}
                      className={`relative rounded-2xl p-1.5 border-2 transition-all flex flex-col items-center group ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-14 h-14 rounded-xl object-cover"
                      />
                      <span className="text-[9px] text-slate-600 font-medium text-center line-clamp-1 mt-1">
                        {preset.label}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-emerald-600 text-white rounded-full p-0.5 shadow-xs">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: Custom Web URL */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Masukkan Tautan Gambar (Web URL)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors"
                  >
                    Terapkan
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Pastikan tautan dapat diakses secara publik dan berakhiran .jpg, .png, atau dari Unsplash.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetDefault}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Default
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closePhotoModal}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              id="btn-confirm-save-profile-photo"
              type="button"
              onClick={handleSavePhoto}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Simpan Foto Profil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
