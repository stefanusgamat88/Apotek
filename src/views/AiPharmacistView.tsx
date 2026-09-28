import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  FileText,
  HeartPulse,
  HelpCircle,
  Info,
  Layers,
  MessageSquare,
  Minus,
  Pill,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  User,
  Users,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ClinicalScreeningResult, DrugAlternative, Medicine, PatientKIEInfo } from '../types';
import {
  askAiPharmacistChat,
  consultPatientSymptoms,
  findGenericEquivalents,
  generatePatientKIE,
  screenDrugInteractions,
} from '../utils/aiPharmacistService';

export const AiPharmacistView: React.FC = () => {
  const { medicines, cart, addToCart, setActiveTab } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'screening' | 'consultation' | 'alternatives' | 'kie' | 'chat'>('screening');

  // ================= 1. Screening State =================
  const [selectedScreeningMeds, setSelectedScreeningMeds] = useState<Medicine[]>(() => {
    if (cart.length > 0) {
      return cart.map((c) => c.medicine);
    }
    return medicines.slice(0, 2);
  });
  const [patientNotes, setPatientNotes] = useState<string>('Pasien dewasa 35 tahun, riwayat maag kronis');
  const [isScreeningLoading, setIsScreeningLoading] = useState<boolean>(false);
  const [screeningResult, setScreeningResult] = useState<ClinicalScreeningResult | null>(null);
  const [medSearchScreening, setMedSearchScreening] = useState<string>('');

  // ================= 2. Consultation State =================
  const [symptomsInput, setSymptomsInput] = useState<string>('Batuk berdahak sudah 3 hari disertai pilek dan hidung tersumbat, badan meriang');
  const [patientAge, setPatientAge] = useState<string>('Dewasa (32 Tahun)');
  const [patientAllergies, setPatientAllergies] = useState<string>('Tidak ada riwayat alergi obat');
  const [isPregnant, setIsPregnant] = useState<boolean>(false);
  const [chronicCondition, setChronicCondition] = useState<string>('Riwayat sakit lambung / gastritis');
  const [isConsulting, setIsConsulting] = useState<boolean>(false);
  const [consultationResult, setConsultationResult] = useState<{
    recommendationText: string;
    suggestedMedicines: { medicine: Medicine; dosage: string; reason: string }[];
    precautions: string[];
  } | null>(null);

  // ================= 3. Alternatives State =================
  const [targetAltMedicine, setTargetAltMedicine] = useState<Medicine | null>(() => medicines[0] || null);
  const [alternativesList, setAlternativesList] = useState<DrugAlternative[]>([]);
  const [isAlternativesLoading, setIsAlternativesLoading] = useState<boolean>(false);

  // ================= 4. KIE Education State =================
  const [targetKieMed, setTargetKieMed] = useState<Medicine | null>(() => medicines[0] || null);
  const [kieInfo, setKieInfo] = useState<PatientKIEInfo | null>(null);
  const [isKieCopied, setIsKieCopied] = useState<boolean>(false);

  // ================= 5. Chat State =================
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ai'; text: string; time: string }[]>([
    {
      sender: 'ai',
      text: 'Halo Apoteker! Saya Asisten AI ApotekPOS siap membantu konsultasi farmakologis, penyesuaian dosis anak/lansia, interaksi makanan-obat, dan skrining klinis. Ada yang ingin ditanyakan?',
      time: 'Baru saja',
    },
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // Auto-run screening on mount if meds selected
  useEffect(() => {
    if (selectedScreeningMeds.length > 0 && !screeningResult) {
      handleRunScreening();
    }
  }, []);

  // Update alternatives when target changes
  useEffect(() => {
    if (targetAltMedicine) {
      setIsAlternativesLoading(true);
      findGenericEquivalents(targetAltMedicine, medicines).then((res) => {
        setAlternativesList(res);
        setIsAlternativesLoading(false);
      });
    }
  }, [targetAltMedicine, medicines]);

  // Update KIE when target changes
  useEffect(() => {
    if (targetKieMed) {
      generatePatientKIE(targetKieMed).then((info) => {
        setKieInfo(info);
      });
    }
  }, [targetKieMed]);

  const handleRunScreening = async () => {
    setIsScreeningLoading(true);
    try {
      const res = await screenDrugInteractions(selectedScreeningMeds, patientNotes);
      setScreeningResult(res);
    } finally {
      setIsScreeningLoading(false);
    }
  };

  const handleAddMedToScreening = (med: Medicine) => {
    if (!selectedScreeningMeds.some((m) => m.id === med.id)) {
      setSelectedScreeningMeds([...selectedScreeningMeds, med]);
      setMedSearchScreening('');
    }
  };

  const handleRemoveMedFromScreening = (id: string) => {
    setSelectedScreeningMeds(selectedScreeningMeds.filter((m) => m.id !== id));
  };

  const handleLoadFromCart = () => {
    if (cart.length > 0) {
      setSelectedScreeningMeds(cart.map((c) => c.medicine));
    }
  };

  const handleRunConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomsInput.trim()) return;
    setIsConsulting(true);
    try {
      const res = await consultPatientSymptoms(
        symptomsInput,
        {
          age: patientAge,
          allergies: patientAllergies,
          isPregnant,
          chronicConditions: chronicCondition,
        },
        medicines
      );
      setConsultationResult(res);
    } finally {
      setIsConsulting(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userText = chatInput;
    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    setChatMessages((prev) => [...prev, { sender: 'user', text: userText, time: now }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const answer = await askAiPharmacistChat(userText, chatMessages, medicines);
      setChatMessages((prev) => [...prev, { sender: 'ai', text: answer, time: now }]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Maaf, terjadi kendala saat memproses jawaban. Silakan coba kembali.',
          time: now,
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleCopyKieText = () => {
    if (!kieInfo) return;
    const text = `*INFORMASI OBAT (KIE APOTEK)*\nNama Obat: ${kieInfo.medicineName} (${kieInfo.genericName})\nAturan Pakai: ${kieInfo.usageTiming}\nDurasi Minum: ${kieInfo.duration}\nCara Simpan: ${kieInfo.storage}\nCatatan Makanan/Diet: ${kieInfo.dietaryNotes.join(', ')}\nEfek Samping Umum: ${kieInfo.possibleSideEffects.join(', ')}\nInstruksi Khusus: ${kieInfo.specialInstructions}`;
    navigator.clipboard.writeText(text);
    setIsKieCopied(true);
    setTimeout(() => setIsKieCopied(false), 2000);
  };

  const filteredMedsForScreening = medSearchScreening.trim()
    ? medicines.filter(
        (m) =>
          m.name.toLowerCase().includes(medSearchScreening.toLowerCase()) ||
          m.genericName.toLowerCase().includes(medSearchScreening.toLowerCase())
      )
    : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-purple-900/50 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Apoteker Klinis & Skrining Resep Pintar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Asisten AI Farmasi & Skrining Interaksi Obat
          </h1>
          <p className="text-purple-200/90 text-xs sm:text-sm mt-2 leading-relaxed">
            Tingkatkan keselamatan pasien (*Patient Safety*) dengan deteksi otomatis interaksi obat berbahaya,
            rekomendasi swamedikasi gejala pasien, substitusi generik vs paten, dan etiket Komunikasi Informasi Edukasi (KIE).
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Engine Aktif: Gemini AI + Database Farmakope</span>
            </span>
            {cart.length > 0 && (
              <button
                id="btn-ai-load-cart"
                onClick={() => {
                  setActiveSubTab('screening');
                  handleLoadFromCart();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5"
              >
                <span>Muat {cart.length} Obat dari Keranjang POS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Ambient background sparkle decoration */}
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-purple-600/10 blur-3xl rounded-full pointer-events-none" />
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto custom-scrollbar">
        {[
          { id: 'screening', label: '1. Skrining Interaksi Obat & Resep', icon: ShieldCheck },
          { id: 'consultation', label: '2. Konsultasi Gejala (Swamedikasi)', icon: HeartPulse },
          { id: 'alternatives', label: '3. Rekomendasi Generik vs Paten', icon: RefreshCw },
          { id: 'kie', label: '4. Edukasi & Aturan Minum (KIE)', icon: FileText },
          { id: 'chat', label: '5. Tanya Jawab AI Apoteker', icon: MessageSquare },
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              id={`tab-ai-${tab.id}`}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SKRINING KLINIS & INTERAKSI OBAT */}
      {/* ========================================================================= */}
      {activeSubTab === 'screening' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Input: Medicines & Patient Context */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <Pill className="w-4 h-4 text-purple-600" />
                  <span>Daftar Obat yang Diskrining ({selectedScreeningMeds.length})</span>
                </h3>
                {cart.length > 0 && (
                  <button
                    onClick={handleLoadFromCart}
                    className="text-[11px] font-bold text-purple-600 hover:text-purple-700 underline"
                  >
                    Muat dari Keranjang
                  </button>
                )}
              </div>

              {/* Medicine Search Autocomplete */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="input-search-screen-med"
                  type="text"
                  value={medSearchScreening}
                  onChange={(e) => setMedSearchScreening(e.target.value)}
                  placeholder="Ketik nama obat untuk ditambahkan ke skrining..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-purple-500 transition-colors"
                />

                {filteredMedsForScreening.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-52 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                    {filteredMedsForScreening.slice(0, 5).map((med) => (
                      <div
                        key={med.id}
                        onClick={() => handleAddMedToScreening(med)}
                        className="p-2.5 hover:bg-purple-50 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800">{med.name}</p>
                          <p className="text-[10px] text-slate-500">{med.genericName || med.category}</p>
                        </div>
                        <span className="text-xs text-purple-600 font-bold">+ Pilih</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected List */}
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {selectedScreeningMeds.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    Belum ada obat yang dipilih. Silakan cari obat di atas atau klik tombol muat dari keranjang.
                  </p>
                ) : (
                  selectedScreeningMeds.map((med, idx) => (
                    <div
                      key={med.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{med.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{med.genericName || med.category}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMedFromScreening(med.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Hapus dari skrining"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Patient Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kondisi Pasien / Riwayat Penyakit & Alergi:
                </label>
                <textarea
                  value={patientNotes}
                  onChange={(e) => setPatientNotes(e.target.value)}
                  rows={2}
                  placeholder="Contoh: Pasien hamil 20 minggu, riwayat maag, alergi amoksisilin..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                id="btn-run-clinical-screening"
                onClick={handleRunScreening}
                disabled={selectedScreeningMeds.length === 0 || isScreeningLoading}
                className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isScreeningLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menganalisis Interaksi & Keamanan...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Jalankan Skrining Klinis AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: Results Display */}
          <div className="lg:col-span-7 space-y-4">
            {isScreeningLoading ? (
              <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center animate-bounce">
                  <HeartPulse className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Sedang Melakukan Skrining Resep Klinis</h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  Memeriksa interaksi antar zat aktif, kontraindikasi kondisi pasien, dan potensi duplikasi dosis ganda...
                </p>
              </div>
            ) : screeningResult ? (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
                {/* Status Alert Banner */}
                <div
                  className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                    screeningResult.severity === 'danger'
                      ? 'bg-rose-50 border-rose-300 text-rose-900'
                      : screeningResult.severity === 'high'
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : screeningResult.severity === 'moderate'
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  {screeningResult.severity === 'danger' ? (
                    <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                  ) : screeningResult.severity === 'high' ? (
                    <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm uppercase tracking-wide">
                        {screeningResult.severity === 'danger'
                          ? 'Peringatan Bahaya Mayor'
                          : screeningResult.severity === 'high'
                          ? 'Perhatian Klinis Moderat'
                          : screeningResult.severity === 'moderate'
                          ? 'Catatan Farmasi Terdeteksi'
                          : 'Kombinasi Resep Aman'}
                      </span>
                    </div>
                    <p className="text-xs mt-1 leading-relaxed">{screeningResult.summary}</p>
                  </div>
                </div>

                {/* 1. Drug Interactions */}
                {screeningResult.interactions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                      <span>Interaksi Antar Obat ({screeningResult.interactions.length})</span>
                    </h4>
                    <div className="space-y-2.5">
                      {screeningResult.interactions.map((int, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-rose-950">
                              {int.drugA} ⚡ {int.drugB}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                int.severity === 'major'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-amber-500 text-white'
                              }`}
                            >
                              {int.severity}
                            </span>
                          </div>
                          <p className="text-slate-700">{int.effect}</p>
                          <div className="p-2 rounded-xl bg-white/80 border border-rose-100 font-semibold text-rose-900 flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                            <span>Solusi: {int.recommendation}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Duplications */}
                {screeningResult.duplications.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-500" />
                      <span>Duplikasi Zat Aktif / Dosis Ganda</span>
                    </h4>
                    {screeningResult.duplications.map((dup, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs space-y-1"
                      >
                        <p className="font-bold text-amber-950">
                          Zat Aktif: {dup.activeIngredient} (Ditemukan di {dup.medicines.join(' & ')})
                        </p>
                        <p className="text-slate-700">{dup.warning}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. Cautions & Warnings */}
                {screeningResult.cautions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                      Perhatian Terhadap Golongan & Pasien
                    </h4>
                    <div className="space-y-1.5">
                      {screeningResult.cautions.map((c, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                          <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Recommendations */}
                {screeningResult.recommendations.length > 0 && (
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                      Rekomendasi Tindakan Apoteker
                    </h4>
                    <div className="space-y-1.5">
                      {screeningResult.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-800 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Direct Action: Return to POS */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setActiveTab('pos')}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <span>Lanjutkan Transaksi di Kasir POS</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: KONSULTASI GEJALA (SWAMEDIKASI) */}
      {/* ========================================================================= */}
      {activeSubTab === 'consultation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <HeartPulse className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Input Keluhan & Profil Pasien</h3>
                <p className="text-[11px] text-slate-500">AI akan merekomendasikan obat OTC yang tersedia di stok</p>
              </div>
            </div>

            <form onSubmit={handleRunConsultation} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keluhan / Gejala Utama Pasien:
                </label>
                <textarea
                  value={symptomsInput}
                  onChange={(e) => setSymptomsInput(e.target.value)}
                  rows={3}
                  placeholder="Contoh: Sakit kepala sebelah berdenyut, mual, meriang..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Usia Pasien:</label>
                  <input
                    type="text"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    placeholder="Contoh: 28 tahun / Anak 5 th"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Kehamilan:</label>
                  <button
                    type="button"
                    onClick={() => setIsPregnant(!isPregnant)}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                      isPregnant
                        ? 'bg-rose-50 border-rose-400 text-rose-700'
                        : 'bg-slate-50 border-slate-300 text-slate-600'
                    }`}
                  >
                    {isPregnant ? 'Sedang Hamil / Menyusui' : 'Tidak Hamil'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Riwayat Alergi Obat:</label>
                <input
                  type="text"
                  value={patientAllergies}
                  onChange={(e) => setPatientAllergies(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  placeholder="Contoh: Alergi penisilin, asam mefenamat"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Penyakit Kronis / Penyerta:</label>
                <input
                  type="text"
                  value={chronicCondition}
                  onChange={(e) => setChronicCondition(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  placeholder="Contoh: Maag / Asam Lambung, Hipertensi"
                />
              </div>

              <button
                type="submit"
                id="btn-submit-consultation"
                disabled={isConsulting}
                className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isConsulting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mencocokkan Obat dari Stok Apotek...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Rekomendasikan Obat Swamedikasi</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Recommendation Output */}
          <div className="lg:col-span-7 space-y-4">
            {isConsulting ? (
              <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
                <p className="text-xs text-slate-500">Mencari obat terbaik yang tersedia di stok apotek...</p>
              </div>
            ) : consultationResult ? (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-950">
                  <span className="font-extrabold uppercase tracking-wide text-purple-700 block mb-1">
                    Analisis Klinis Apoteker:
                  </span>
                  <p className="leading-relaxed">{consultationResult.recommendationText}</p>
                </div>

                {/* Suggested Medicines */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">
                    Pilihan Obat yang Direkomendasikan & Tersedia di Apotek
                  </h4>
                  <div className="space-y-3">
                    {consultationResult.suggestedMedicines.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-purple-300 transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{item.medicine.name}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-emerald-100 text-emerald-700">
                                Stok: {item.medicine.stock} {item.medicine.baseUnit}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{item.medicine.genericName}</p>
                          </div>
                          <span className="font-extrabold text-sm text-purple-700">
                            Rp {item.medicine.sellPrice.toLocaleString('id-ID')}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                          <p className="font-semibold text-slate-800">
                            Aturan Pakai: <span className="text-purple-700 font-bold">{item.dosage}</span>
                          </p>
                          <p className="text-slate-600 text-[11px]">{item.reason}</p>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            id={`btn-add-consultation-to-cart-${idx}`}
                            onClick={() => addToCart(item.medicine)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Masukkan ke Keranjang Kasir</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Precautions */}
                {consultationResult.precautions.length > 0 && (
                  <div className="border-t border-slate-100 pt-3 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                      Peringatan & Rujukan Dokter:
                    </span>
                    {consultationResult.precautions.map((p, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: REKOMENDASI GENERIK VS PATEN (ALTERNATIF) */}
      {/* ========================================================================= */}
      {activeSubTab === 'alternatives' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-purple-600" />
              <span>Pilih Obat Acuan (Stok Habis / Diminta Pasien)</span>
            </h3>

            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {medicines.map((m) => {
                const isSelected = targetAltMedicine?.id === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setTargetAltMedicine(m)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{m.name}</span>
                      <span className="text-[11px] font-bold text-purple-700">
                        Rp {m.sellPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{m.genericName || m.category}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>Stok: {m.stock} {m.baseUnit}</span>
                      <span>{m.category}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-8 space-y-4">
            {targetAltMedicine && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-purple-600">Obat yang Dicari Alternatifnya:</span>
                    <h4 className="font-extrabold text-slate-900 text-base">{targetAltMedicine.name}</h4>
                    <p className="text-xs text-slate-500">Zat Aktif: {targetAltMedicine.genericName}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Harga Satuan</span>
                    <p className="text-base font-extrabold text-slate-900">
                      Rp {targetAltMedicine.sellPrice.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">
                    Daftar Obat Pengganti (Bioekivalen & Golongan Setara)
                  </h4>

                  {isAlternativesLoading ? (
                    <div className="py-12 text-center text-xs text-slate-400">Mencari alternatif setara...</div>
                  ) : alternativesList.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      Tidak ditemukan obat pengganti dengan zat aktif yang sama di database apotek saat ini.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {alternativesList.map((alt, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 shadow-xs transition-all space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm">{alt.medicine.name}</span>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                    alt.type === 'identical_active'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {alt.type === 'identical_active' ? 'Zat Aktif Identik (Sama)' : 'Golongan Terapi Sama'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">{alt.medicine.genericName}</p>
                            </div>

                            <div className="text-right">
                              <span className="text-sm font-extrabold text-slate-900">
                                Rp {alt.medicine.sellPrice.toLocaleString('id-ID')}
                              </span>
                              {alt.priceDiff < 0 ? (
                                <p className="text-[10px] text-emerald-600 font-bold">
                                  Hemat Rp {Math.abs(alt.priceDiff).toLocaleString('id-ID')}
                                </p>
                              ) : alt.priceDiff > 0 ? (
                                <p className="text-[10px] text-amber-600 font-bold">
                                  + Rp {alt.priceDiff.toLocaleString('id-ID')}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            {alt.reason}
                          </p>

                          <div className="flex items-center justify-between pt-1 text-xs">
                            <span className="text-slate-500 font-medium">
                              Sisa Stok: <strong className="text-slate-800">{alt.medicine.stock} {alt.medicine.baseUnit}</strong> (Rak: {alt.medicine.locationRack})
                            </span>
                            <button
                              onClick={() => addToCart(alt.medicine)}
                              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Pilih untuk Kasir</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: EDUKASI & KIE ATURAN MINUM PASIEN */}
      {/* ========================================================================= */}
      {activeSubTab === 'kie' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Pilih Obat untuk Buat Informasi KIE</span>
            </h3>

            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {medicines.map((m) => {
                const isSelected = targetKieMed?.id === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setTargetKieMed(m)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900">{m.name}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{m.genericName || m.category}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-8 space-y-4">
            {kieInfo && (
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                      Etiket Edukasi Pasien (KIE Farmasi)
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{kieInfo.medicineName}</h3>
                    <p className="text-xs text-slate-500">{kieInfo.genericName}</p>
                  </div>

                  <button
                    onClick={handleCopyKieText}
                    className="px-3.5 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs flex items-center gap-1.5 transition-colors border border-purple-200"
                  >
                    {isKieCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tersalin ke Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Teks untuk WhatsApp Pasien</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] font-bold uppercase text-emerald-700 block mb-1">
                      Aturan & Waktu Minum (Signa):
                    </span>
                    <p className="text-sm font-extrabold text-emerald-950">{kieInfo.usageTiming}</p>
                    <p className="text-xs text-emerald-800 mt-1">Durasi pemakaian: {kieInfo.duration}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                    <span className="text-[10px] font-bold uppercase text-blue-700 block mb-1">
                      Cara Penyimpanan:
                    </span>
                    <p className="text-xs font-semibold text-blue-950">{kieInfo.storage}</p>
                  </div>
                </div>

                {/* Dietary Notes */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">
                    Anjuran Makanan / Pantangan Minuman
                  </h4>
                  <div className="space-y-1">
                    {kieInfo.dietaryNotes.map((d, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Side Effects */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">
                    Efek Samping Umum yang Wajar
                  </h4>
                  <div className="space-y-1">
                    {kieInfo.possibleSideEffects.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special Instructions */}
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <span className="text-[10px] font-bold uppercase text-amber-800 block mb-1">
                    Instruksi Khusus Apoteker:
                  </span>
                  <p className="text-xs text-amber-950 leading-relaxed">{kieInfo.specialInstructions}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: TANYA JAWAB KLINIS AI APOTEKER (CHAT) */}
      {/* ========================================================================= */}
      {activeSubTab === 'chat' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-md">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Apoteker AI Chat Assistant</h3>
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Siap menjawab pertanyaan dosis, interaksi, & farmakologi klinis</span>
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                setChatMessages([
                  {
                    sender: 'ai',
                    text: 'Riwayat percakapan telah dibersihkan. Ada kasus atau pertanyaan klinis lain yang ingin didiskusikan?',
                    time: 'Baru saja',
                  },
                ])
              }
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Bersihkan Chat
            </button>
          </div>

          {/* Quick prompt suggestions */}
          <div className="px-4 py-2 bg-slate-50/60 border-b border-slate-100 flex items-center gap-2 overflow-x-auto custom-scrollbar">
            <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">Contoh Cepat:</span>
            {[
              'Dosis Paracetamol sirup untuk anak 4 th BB 16 kg?',
              'Bolehkah Amoxicillin diminum dengan susu atau antasida?',
              'Obat maag yang aman untuk ibu hamil trimester pertama?',
              'Perbedaan Cetirizine dan Loratadine?',
            ].map((q, idx) => (
              <button
                key={idx}
                onClick={() => setChatInput(q)}
                className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-purple-300 text-[11px] text-slate-600 hover:text-purple-700 whitespace-nowrap transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    msg.sender === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-900 text-purple-300 shadow-sm'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-purple-600 text-white rounded-tr-none'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                  <div
                    className={`text-[9px] mt-1.5 text-right ${
                      msg.sender === 'user' ? 'text-purple-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}

            {isChatLoading && (
              <div className="flex items-center gap-3 text-slate-400 text-xs">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-purple-300 flex items-center justify-center">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <span>AI Apoteker sedang menganalisis data farmakope...</span>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              id="input-chat-ai-pharmacist"
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Tanyakan dosis, interaksi obat, atau rekomendasi terapi apotek..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              id="btn-submit-chat-ai"
              disabled={!chatInput.trim() || isChatLoading}
              className="p-3 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white transition-colors cursor-pointer shrink-0"
              title="Kirim Pertanyaan"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
