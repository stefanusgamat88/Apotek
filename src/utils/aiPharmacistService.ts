import { GoogleGenAI } from '@google/genai';
import { ClinicalScreeningResult, DrugAlternative, Medicine, PatientKIEInfo } from '../types';
import { DRUG_KNOWLEDGE_BASE } from './medicineKnowledgeBase';

// Helper to safely get the Gemini API Key
const getApiKey = (): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      return import.meta.env.VITE_GEMINI_API_KEY;
    }
  } catch {
    // Ignore error
  }

  try {
    if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      return process.env.GEMINI_API_KEY;
    }
  } catch {
    // Ignore error
  }

  return '';
};

// Known critical drug interactions for offline pharmacological engine
interface KnownInteractionRule {
  drugPatternsA: RegExp[];
  drugPatternsB: RegExp[];
  severity: 'minor' | 'moderate' | 'major';
  effect: string;
  recommendation: string;
}

const KNOWN_INTERACTIONS: KnownInteractionRule[] = [
  {
    drugPatternsA: [/\bantasida\b/i, /\bmylanta\b/i, /\bpromag\b/i, /\baluminium\b/i, /\bmagnesium\b/i],
    drugPatternsB: [/\bciprofloxacin\b/i, /\blevofloxacin\b/i, /\btetracycline\b/i, /\bdoxycycline\b/i],
    severity: 'major',
    effect: 'Kation polivalen (Al3+, Mg2+) membentuk khelat kelat tidak larut dengan antibiotik kuinon/tetrasiklin, menurunkan absorpsi antibiotik hingga >70%.',
    recommendation: 'Beri jeda minimal 2 jam sebelum atau 4 jam setelah konsumsi antasida.',
  },
  {
    drugPatternsA: [/\bparacetamol\b/i, /\bpanadol\b/i, /\bbiogesic\b/i, /\bsanmol\b/i],
    drugPatternsB: [/\balcohol\b/i, /\balkohol\b/i, /\bwarfarin\b/i],
    severity: 'moderate',
    effect: 'Penggunaan paracetamol dosis tinggi (>2g/hari) jangka panjang dapat meningkatkan efek antikoagulan warfarin dan risiko pendarahan.',
    recommendation: 'Gunakan dosis efektif terendah dan monitor nilai INR pasien secara berkala.',
  },
  {
    drugPatternsA: [/\bomeprazole\b/i, /\blansoprazole\b/i, /\besomeprazole\b/i],
    drugPatternsB: [/\bclopidogrel\b/i],
    severity: 'major',
    effect: 'Omeprazole menghambat enzim CYP2C19 yang memetabolisme clopidogrel menjadi bentuk aktif, menurunkan efikasi antiplatelet clopidogrel.',
    recommendation: 'Ganti PPI dengan Pantoprazole atau H2-blocker (Famotidine) yang memiliki inhibisi CYP2C19 lebih minimal.',
  },
  {
    drugPatternsA: [/\bamlodipine\b/i],
    drugPatternsB: [/\bsimvastatin\b/i],
    severity: 'moderate',
    effect: 'Amlodipine menghambat CYP3A4 sehingga meningkatkan konsentrasi plasma Simvastatin, meningkatkan risiko miopati dan rhabdomyolysis.',
    recommendation: 'Batasi dosis Simvastatin maksimal 20 mg/hari jika dikombinasikan dengan Amlodipine.',
  },
  {
    drugPatternsA: [/\bibuprofen\b/i, /\bketorolac\b/i, /\bmeloxicam\b/i, /\basam mefenamat\b/i],
    drugPatternsB: [/\bcaptopril\b/i, /\blisinopril\b/i, /\bramipril\b/i, /\bcandesartan\b/i, /\bvalsartan\b/i],
    severity: 'moderate',
    effect: 'NSAID mengurangi efek hipotensif ACE inhibitor/ARB dan meningkatkan risiko penurunan fungsi ginjal akut serta hiperkalemia.',
    recommendation: 'Pantau tekanan darah dan fungsi ginjal. Hindari konsumsi rutin NSAID jangka panjang.',
  },
  {
    drugPatternsA: [/\bibuprofen\b/i, /\basam mefenamat\b/i, /\bketoprofen\b/i],
    drugPatternsB: [/\bprednisone\b/i, /\bdexamethasone\b/i, /\bmetilprednisolon\b/i],
    severity: 'major',
    effect: 'Kombinasi NSAID dan Kortikosteroid meningkatkan risiko erosi lambung, tukak peptik, dan perdarahan gastrointestinal hingga 4 kali lipat.',
    recommendation: 'Wajib tambahkan gastroprotektor (PPI seperti Omeprazole atau sukralfat) dan konsumsi selalu sesudah makan.',
  },
  {
    drugPatternsA: [/\bmetformin\b/i],
    drugPatternsB: [/\bkontras\b/i, /\bglimepiride\b/i],
    severity: 'minor',
    effect: 'Kombinasi dengan antidiabetes lain meningkatkan potensi hipoglikemia bila asupan karbohidrat tidak teratur.',
    recommendation: 'Edukasi pasien mengenali tanda hipoglikemia (keringat dingin, gemetar, pusing) dan selalu sediakan permen manis.',
  },
  {
    drugPatternsA: [/\bcetirizine\b/i, /\bctm\b/i, /\bchlorpheniramine\b/i],
    drugPatternsB: [/\balprazolam\b/i, /\bdiazepam\b/i, /\balcohol\b/i],
    severity: 'moderate',
    effect: 'Efek sedasi dan depresi sistem saraf pusat (SSP) meningkat secara sinergis.',
    recommendation: 'Ingatkan pasien untuk tidak mengemudikan kendaraan bermotor atau mengoperasikan mesin berat.',
  },
];

/**
 * Screen drug interactions and clinical safety using Gemini API with offline fallback
 */
export async function screenDrugInteractions(
  medicines: Medicine[],
  patientNotes?: string
): Promise<ClinicalScreeningResult> {
  if (medicines.length === 0) {
    return {
      hasAlert: false,
      severity: 'safe',
      summary: 'Belum ada obat yang dimasukkan untuk diskrining klinis.',
      interactions: [],
      duplications: [],
      dosageWarnings: [],
      cautions: [],
      recommendations: ['Pilih minimal 1 atau 2 obat untuk melakukan skrining klinis otomatis.'],
    };
  }

  const apiKey = getApiKey();

  // 1. Try Gemini API first if API key is present
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Anda adalah Apoteker Klinis Senior profesional di apotek Indonesia. 
Analisis daftar obat pasien berikut untuk skrining resep dan farmasi klinis:

DAFTAR OBAT:
${medicines
  .map(
    (m, i) =>
      `${i + 1}. ${m.name} (Zat Aktif: ${m.genericName || '-'}, Kategori: ${m.category}, Sediaan: ${m.baseUnit})`
  )
  .join('\n')}

CATATAN PASIEN:
${patientNotes || 'Tidak ada catatan klinis khusus'}

Berikan hasil analisis dalam format JSON murni TANPA markdown formatting tambahan:
{
  "hasAlert": boolean,
  "severity": "safe" | "low" | "moderate" | "high" | "danger",
  "summary": "Ringkasan klinis bahasa Indonesia 1-2 kalimat",
  "interactions": [
    {
      "drugA": "Nama obat A",
      "drugB": "Nama obat B",
      "severity": "minor" | "moderate" | "major",
      "effect": "Mekanisme efek interaksi klinis",
      "recommendation": "Rekomendasi solutif untuk apoteker"
    }
  ],
  "duplications": [
    {
      "activeIngredient": "Zat aktif yang terduplikasi",
      "medicines": ["Obat 1", "Obat 2"],
      "warning": "Peringatan bahaya duplikasi zat aktif"
    }
  ],
  "dosageWarnings": [
    {
      "medicineName": "Nama obat",
      "warning": "Peringatan dosis",
      "safeRange": "Rentang dosis lazim"
    }
  ],
  "cautions": ["Peringatan klinis 1", "Peringatan klinis 2"],
  "recommendations": ["Rekomendasi apoteker 1", "Rekomendasi apoteker 2"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      if (response && response.text) {
        const parsed = JSON.parse(response.text.trim());
        return parsed as ClinicalScreeningResult;
      }
    } catch (err) {
      console.warn('Gemini API call failed, switching to local offline clinical engine:', err);
    }
  }

  // 2. Offline Pharmacological Rule Engine
  return runOfflineClinicalScreening(medicines, patientNotes);
}

/**
 * High-precision offline rule engine for clinical safety
 */
function runOfflineClinicalScreening(
  medicines: Medicine[],
  patientNotes?: string
): ClinicalScreeningResult {
  const interactions: ClinicalScreeningResult['interactions'] = [];
  const duplications: ClinicalScreeningResult['duplications'] = [];
  const dosageWarnings: ClinicalScreeningResult['dosageWarnings'] = [];
  const cautions: string[] = [];
  const recommendations: string[] = [];

  // Check 1: Drug-Drug Interactions
  for (let i = 0; i < medicines.length; i++) {
    for (let j = i + 1; j < medicines.length; j++) {
      const medA = medicines[i];
      const medB = medicines[j];
      const nameAndActiveA = `${medA.name} ${medA.genericName}`.toLowerCase();
      const nameAndActiveB = `${medB.name} ${medB.genericName}`.toLowerCase();

      for (const rule of KNOWN_INTERACTIONS) {
        const matchA_1 = rule.drugPatternsA.some((p) => p.test(nameAndActiveA));
        const matchB_1 = rule.drugPatternsB.some((p) => p.test(nameAndActiveB));

        const matchA_2 = rule.drugPatternsA.some((p) => p.test(nameAndActiveB));
        const matchB_2 = rule.drugPatternsB.some((p) => p.test(nameAndActiveA));

        if ((matchA_1 && matchB_1) || (matchA_2 && matchB_2)) {
          // Avoid duplicate entries
          const exists = interactions.some(
            (int) =>
              (int.drugA === medA.name && int.drugB === medB.name) ||
              (int.drugA === medB.name && int.drugB === medA.name)
          );
          if (!exists) {
            interactions.push({
              drugA: medA.name,
              drugB: medB.name,
              severity: rule.severity,
              effect: rule.effect,
              recommendation: rule.recommendation,
            });
          }
        }
      }
    }
  }

  // Check 2: Active Ingredient Duplications
  const activeMap: Record<string, string[]> = {};
  medicines.forEach((m) => {
    const rawActive = m.genericName.toLowerCase().split(/[,+/]/);
    rawActive.forEach((act) => {
      const trimmed = act.trim().replace(/\b\d+(\.\d+)?\s*(mg|g|ml|mcg|iu)\b/g, '').trim();
      if (trimmed.length > 3) {
        if (!activeMap[trimmed]) activeMap[trimmed] = [];
        activeMap[trimmed].push(m.name);
      }
    });
  });

  Object.entries(activeMap).forEach(([active, medList]) => {
    const uniqueMeds = Array.from(new Set(medList));
    if (uniqueMeds.length > 1) {
      duplications.push({
        activeIngredient: active.toUpperCase(),
        medicines: uniqueMeds,
        warning: `Duplikasi zat aktif terdeteksi antara ${uniqueMeds.join(
          ' dan '
        )}. Pasien berisiko menerima dosis berlebih (overdosis) tanpa disadari.`,
      });
      recommendations.push(
        `Sarankan pasien memilih salah satu saja antara ${uniqueMeds.join(
          ' atau '
        )} untuk mencegah toksisitas zat aktif ${active.toUpperCase()}.`
      );
    }
  });

  // Check 3: Categorical & Patient Context Warnings
  const hardMedicines = medicines.filter(
    (m) => m.category === 'Obat Keras' || m.requiresPrescription
  );
  if (hardMedicines.length > 0) {
    cautions.push(
      `Terdapat ${hardMedicines.length} item Golongan Obat Keras (${hardMedicines
        .map((m) => m.name)
        .join(', ')}). Pastikan diserahkan dengan validasi resep dokter resmi.`
    );
  }

  // Check patient notes
  if (patientNotes) {
    const lowerNotes = patientNotes.toLowerCase();
    if (lowerNotes.includes('hamil') || lowerNotes.includes('menyusui')) {
      cautions.push('Status: Ibu Hamil / Menyusui. Pastikan profil keamanan kategori FDA (A/B/C/D/X) dan hindari obat NSAID trimester ke-3 serta golongan tetrasiklin/kuinolon.');
    }
    if (lowerNotes.includes('maag') || lowerNotes.includes('gerd') || lowerNotes.includes('lambung')) {
      const nsaids = medicines.filter((m) =>
        /ibuprofen|asam mefenamat|meloxicam|natrium diklofenak|aspirin/i.test(`${m.name} ${m.genericName}`)
      );
      if (nsaids.length > 0) {
        cautions.push(
          `Pasien memiliki riwayat sakit maag / asam lambung tinggi, sedangkan terdapat obat NSAID (${nsaids
            .map((m) => m.name)
            .join(', ')}). Wajib diminum segera setelah makan dan pertimbangkan pelindung lambung.`
        );
      }
    }
    if (lowerNotes.includes('alergi')) {
      cautions.push(`Perhatian Alergi Pasien: "${patientNotes}". Konfirmasi kembali riwayat hipersensitivitas penisilin, sulfa, atau analgesik.`);
    }
  }

  // Summary & Severity determination
  let severity: ClinicalScreeningResult['severity'] = 'safe';
  let hasAlert = false;

  if (interactions.some((i) => i.severity === 'major') || duplications.length > 0) {
    severity = 'danger';
    hasAlert = true;
  } else if (interactions.some((i) => i.severity === 'moderate')) {
    severity = 'high';
    hasAlert = true;
  } else if (interactions.length > 0 || cautions.length > 0) {
    severity = 'moderate';
    hasAlert = true;
  }

  if (recommendations.length === 0) {
    recommendations.push('Berikan informasi cara penggunaan (Signa) yang jelas dan informasikan waktu minum (sebelum/sesudah makan).');
    recommendations.push('Ingatkan pasien untuk menyimpan obat di tempat sejuk, kering, dan terhindar dari sinar matahari langsung.');
  }

  let summary = 'Kombinasi obat aman diberikan dengan instruksi aturan minum standar.';
  if (severity === 'danger') {
    summary = 'PERINGATAN KRITIS: Ditemukan interaksi obat mayor atau duplikasi zat aktif yang memerlukan intervensi dan penyesuaian oleh apoteker.';
  } else if (severity === 'high') {
    summary = 'PERHATIAN KLINIS: Ditemukan interaksi tingkat moderat. Diperlukan penyesuaian jeda waktu minum atau pemantauan efek samping.';
  } else if (hasAlert) {
    summary = 'Skrining klinis selesai dengan catatan khusus terkait golongan obat keras atau kondisi riwayat pasien.';
  }

  return {
    hasAlert,
    severity,
    summary,
    interactions,
    duplications,
    dosageWarnings,
    cautions,
    recommendations,
  };
}

/**
 * AI Patient Symptoms Consultation & OTC Recommendation
 */
export async function consultPatientSymptoms(
  symptoms: string,
  patientProfile: {
    age?: string;
    allergies?: string;
    isPregnant?: boolean;
    chronicConditions?: string;
  },
  inventory: Medicine[]
): Promise<{
  recommendationText: string;
  suggestedMedicines: { medicine: Medicine; dosage: string; reason: string }[];
  precautions: string[];
}> {
  const apiKey = getApiKey();

  // If Gemini API is available, leverage model gemini-3.8-flash
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const inventorySnippet = inventory
        .filter((m) => m.stock > 0)
        .slice(0, 40)
        .map((m) => `- ID: ${m.id} | ${m.name} (${m.category}) | Stok: ${m.stock} | Indikasi: ${m.indication || m.genericName}`)
        .join('\n');

      const prompt = `Anda adalah Apoteker Ahli Swamedikasi (Self-Medication Specialist).
Pasien datang dengan keluhan:
KELUHAN: "${symptoms}"
USIA/PROFIL: ${patientProfile.age || 'Dewasa'}
RIWAYAT ALERGI: ${patientProfile.allergies || 'Tidak ada'}
STATUS KEHAMILAN: ${patientProfile.isPregnant ? 'Sedang Hamil / Menyusui' : 'Tidak Hamil'}
PENYAKIT PENYERTA: ${patientProfile.chronicConditions || 'Tidak ada'}

DAFTAR STOK OBAT APOTEK YANG TERSEDIA:
${inventorySnippet}

Pilihlah obat OTC (Obat Bebas / Bebas Terbatas) yang paling sesuai dan tersedia di stok untuk mengatasi keluhan pasien.
Kembalikan respon dalam format JSON:
{
  "recommendationText": "Penjelasan klinis dan edukasi untuk pasien dalam bahasa Indonesia",
  "suggestedMedicineIds": [
    {
      "id": "ID obat dari daftar",
      "dosage": "Aturan pakai jelas (contoh: 3x1 tablet sesudah makan)",
      "reason": "Alasan pemilihan obat ini"
    }
  ],
  "precautions": ["Peringatan kapan harus ke dokter jika gejala memburuk", "Tips gaya hidup/makanan pendukung"]
}`;

      const res = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      if (res && res.text) {
        const parsed = JSON.parse(res.text.trim());
        const suggestedMedicines = (parsed.suggestedMedicineIds || [])
          .map((item: { id: string; dosage: string; reason: string }) => {
            const found = inventory.find((m) => m.id === item.id);
            return found ? { medicine: found, dosage: item.dosage, reason: item.reason } : null;
          })
          .filter(Boolean) as { medicine: Medicine; dosage: string; reason: string }[];

        return {
          recommendationText: parsed.recommendationText || 'Rekomendasi swamedikasi apoteker berdasarkan keluhan pasien.',
          suggestedMedicines,
          precautions: parsed.precautions || ['Jika gejala tidak membaik dalam 3 hari, konsultasikan ke dokter.'],
        };
      }
    } catch (err) {
      console.warn('Gemini symptom consultation error, falling back to local clinical engine:', err);
    }
  }

  // Offline Symptoms Matcher
  const lowerSymptoms = symptoms.toLowerCase();
  const matchedMedicines: { medicine: Medicine; dosage: string; reason: string }[] = [];
  const precautions: string[] = [
    'Konsumsi banyak air putih dan istirahat yang cukup.',
    'Bila gejala berlanjut lebih dari 3 hari atau timbul demam tinggi >39°C, segera periksakan diri ke dokter atau faskes terdekat.',
  ];

  inventory.forEach((med) => {
    if (med.stock <= 0) return;
    const info = `${med.name} ${med.genericName} ${med.indication}`.toLowerCase();

    // Flu & Batuk
    if ((lowerSymptoms.includes('batuk') || lowerSymptoms.includes('flu') || lowerSymptoms.includes('pilek')) &&
        (info.includes('flu') || info.includes('batuk') || info.includes('dextromethorphan') || info.includes('paracetamol'))) {
      if (matchedMedicines.length < 3 && !matchedMedicines.some((m) => m.medicine.id === med.id)) {
        matchedMedicines.push({
          medicine: med,
          dosage: 'Dewasa: 3 kali sehari 1 kaplet sesudah makan.',
          reason: 'Meredakan gejala hidung tersumbat, bersin, dan meredakan batuk serta demam.',
        });
      }
    }

    // Maag & Lambung
    if ((lowerSymptoms.includes('maag') || lowerSymptoms.includes('lambung') || lowerSymptoms.includes('mual') || lowerSymptoms.includes('perih')) &&
        (info.includes('antasida') || info.includes('maag') || info.includes('aluminium') || info.includes('magnesium') || info.includes('promag') || info.includes('mylanta'))) {
      if (matchedMedicines.length < 3 && !matchedMedicines.some((m) => m.medicine.id === med.id)) {
        matchedMedicines.push({
          medicine: med,
          dosage: 'Kunyah 1-2 tablet, 1 jam sebelum makan atau 2 jam sesudah makan dan menjelang tidur.',
          reason: 'Menetralkan kelebihan asam lambung dan melapisi mukosa lambung yang perih.',
        });
      }
    }

    // Nyeri & Demam
    if ((lowerSymptoms.includes('demam') || lowerSymptoms.includes('pusing') || lowerSymptoms.includes('sakit kepala') || lowerSymptoms.includes('sakit gigi')) &&
        (info.includes('paracetamol') || info.includes('panadol') || info.includes('biogesic') || info.includes('sanmol'))) {
      if (matchedMedicines.length < 3 && !matchedMedicines.some((m) => m.medicine.id === med.id)) {
        matchedMedicines.push({
          medicine: med,
          dosage: '1 tablet 3-4 kali sehari bila perlu (sesudah makan). Maksimal 4000 mg sehari.',
          reason: 'Analgesik-antipiretik lini pertama yang aman dan efektif menurunkan demam serta meredakan nyeri.',
        });
      }
    }

    // Diare
    if ((lowerSymptoms.includes('diare') || lowerSymptoms.includes('mencret') || lowerSymptoms.includes('buang air')) &&
        (info.includes('oralit') || info.includes('attapulgite') || info.includes('diapet') || info.includes('entrostro'))) {
      if (matchedMedicines.length < 3 && !matchedMedicines.some((m) => m.medicine.id === med.id)) {
        matchedMedicines.push({
          medicine: med,
          dosage: '2 tablet setelah buang air besar pertama, lanjutkan 1 tablet tiap BAB berikutnya.',
          reason: 'Menyerap racun dan bakteri penyebab diare serta memadatkan feses.',
        });
      }
    }
  });

  return {
    recommendationText: `Berdasarkan keluhan "${symptoms}", berikut adalah pilihan obat swamedikasi yang aman dan tersedia di apotek:`,
    suggestedMedicines: matchedMedicines.length > 0 ? matchedMedicines : inventory.slice(0, 2).map((m) => ({
      medicine: m,
      dosage: 'Sesuai petunjuk kemasan.',
      reason: 'Pilihan obat umum di apotek.',
    })),
    precautions,
  };
}

/**
 * Find generic or alternative equivalents for out-of-stock medicines
 */
export async function findGenericEquivalents(
  targetMedicine: Medicine,
  inventory: Medicine[]
): Promise<DrugAlternative[]> {
  const results: DrugAlternative[] = [];
  const targetActive = targetMedicine.genericName.toLowerCase().trim();

  // Search exact active ingredient
  inventory.forEach((item) => {
    if (item.id === targetMedicine.id) return;
    const itemActive = item.genericName.toLowerCase().trim();

    // 1. Identical active ingredient
    if (targetActive && (itemActive.includes(targetActive) || targetActive.includes(itemActive))) {
      results.push({
        medicine: item,
        type: 'identical_active',
        reason: `Memiliki zat aktif yang sama (${item.genericName}). Bioekivalen dan memberikan efek terapeutik setara.`,
        priceDiff: item.sellPrice - targetMedicine.sellPrice,
      });
    }
    // 2. Same therapeutic category with stock
    else if (item.category === targetMedicine.category && item.stock > 0 && results.length < 5) {
      results.push({
        medicine: item,
        type: 'same_therapeutic_class',
        reason: `Golongan terapeutik sama (${item.category}). Dapat dipertimbangkan sebagai substitusi alternatif.`,
        priceDiff: item.sellPrice - targetMedicine.sellPrice,
      });
    }
  });

  return results.sort((a, b) => (a.type === 'identical_active' ? -1 : 1));
}

/**
 * Generate Patient KIE (Komunikasi, Informasi & Edukasi) label instructions
 */
export async function generatePatientKIE(
  medicine: Medicine,
  dosageInstructions?: string
): Promise<PatientKIEInfo> {
  const generic = medicine.genericName.toLowerCase();
  let usageTiming = dosageInstructions || '3 Kali Sehari 1 Tablet Sesudah Makan';
  let storage = 'Simpan pada suhu ruangan di bawah 30°C, kering, dan terlindung dari sinar matahari langsung.';
  const dietaryNotes: string[] = [];
  const possibleSideEffects: string[] = ['Reaksi ringan jarang terjadi bila diminum sesuai dosis'];
  let specialInstructions = 'Habiskan obat sesuai anjuran jika berupa antibiotik. Hentikan pemakaian jika timbul gejala alergi (gatal/ruam).';

  if (generic.includes('paracetamol')) {
    usageTiming = dosageInstructions || '3-4 Kali Sehari 1 Tablet (Bila Sakit / Demam)';
    dietaryNotes.push('Hindari konsumsi alkohol selama penggunaan paracetamol.');
    possibleSideEffects.push('Aman bagi lambung, jarang menyebabkan efek samping.');
    specialInstructions = 'Beri jeda minimal 4-6 jam antar dosis. Jangan melebihi 8 tablet (4000 mg) dalam 24 jam.';
  } else if (generic.includes('antasida') || generic.includes('magnesium') || generic.includes('aluminium')) {
    usageTiming = dosageInstructions || '3 Kali Sehari 1 Tablet Dikunyah, 1 Jam Sebelum Makan & Mau Tidur';
    dietaryNotes.push('Beri jeda 2 jam bila meminum antibiotik atau suplemen zat besi.');
    possibleSideEffects.push('Dapat menyebabkan sedikit rasa kembung atau konstipasi ringan.');
    specialInstructions = 'Tablet wajib dikunyah halus sebelum ditelan untuk hasil netralisasi asam lambung yang maksimal.';
  } else if (generic.includes('amoxicillin') || generic.includes('ciprofloxacin') || generic.includes('cef')) {
    usageTiming = dosageInstructions || '3 Kali Sehari 1 Tablet Tiap 8 Jam';
    dietaryNotes.push('Minum dengan segelas air putih penuh.');
    possibleSideEffects.push('Mual ringan, gangguan pencernaan sesaat.');
    specialInstructions = 'PENTING: Antibiotik WAJIB dihabiskan sampai tuntas sesuai durasi resep dokter meskipun badan sudah merasa sehat.';
  } else if (generic.includes('cetirizine') || generic.includes('ctm')) {
    usageTiming = dosageInstructions || '1 Kali Sehari 1 Tablet pada Malam Hari';
    dietaryNotes.push('Hindari minuman beralkohol.');
    possibleSideEffects.push('Dapat menyebabkan rasa kantuk ringan.');
    specialInstructions = 'Sebaiknya diminum malam hari menjelang tidur. Hindari mengemudikan kendaraan setelah minum obat.';
  }

  return {
    medicineName: medicine.name,
    genericName: medicine.genericName || medicine.name,
    usageTiming,
    duration: '3 - 5 Hari (atau hingga keluhan reda)',
    storage,
    dietaryNotes: dietaryNotes.length > 0 ? dietaryNotes : ['Minum dengan air putih hangat secukupnya.'],
    possibleSideEffects,
    specialInstructions,
  };
}

/**
 * Interactive Apoteker AI Chat for clinical QA
 */
export async function askAiPharmacistChat(
  query: string,
  history: { sender: 'user' | 'ai'; text: string }[],
  inventory: Medicine[]
): Promise<string> {
  const apiKey = getApiKey();

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const inventoryList = inventory
        .slice(0, 30)
        .map((m) => `${m.name} (${m.genericName || '-'}) - Stok: ${m.stock} - Harga: Rp ${m.sellPrice.toLocaleString('id-ID')}`)
        .join('\n');

      const chatPrompt = `Anda adalah Apoteker Klinis AI Pintar yang bertugas di ApotekPOS Indonesia.
Anda ramah, sangat teliti secara medis dan farmakologis, serta selalu memberikan rekomendasi berbasis bukti (evidence-based pharmacy).
Gunakan bahasa Indonesia yang profesional, ramah, dan mudah dipahami.
Berikan dosis jelas, rute pemberian, aturan waktu makan, dan kontraindikasi penting.

KONTEKS STOK OBAT APOTEK KITA SAAT INI:
${inventoryList}

RIWAYAT PERCAKAPAN:
${history.map((h) => `${h.sender === 'user' ? 'Kasir/Apoteker' : 'AI Apoteker'}: ${h.text}`).join('\n')}

PERTANYAAN TERBARU:
"${query}"

Berikan jawaban terstruktur dengan poin-poin yang mudah dibaca.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: chatPrompt,
        config: {
          temperature: 0.3,
        },
      });

      if (response && response.text) {
        return response.text.trim();
      }
    } catch (err) {
      console.warn('AI Chat failed, using fallback clinical response:', err);
    }
  }

  // Smart Offline Knowledge Base Response
  const lowerQ = query.toLowerCase();
  if (lowerQ.includes('paracetamol') && lowerQ.includes('anak')) {
    return `### Dosis Lazim Paracetamol untuk Anak:\n- **Dosis standar**: 10 - 15 mg/kg berat badan per kali minum.\n- **Frekuensi**: Diberikan tiap 4 - 6 jam bila demam / nyeri (maksimal 4 - 5 kali sehari).\n- **Contoh Kasus**: Untuk anak BB 15 kg, dosis yang dianjurkan adalah 150 mg - 225 mg per kali minum.\n- **Sediaan**: Tersedia Sanmol Drops (60 mg/0.6 ml) untuk bayi <1 tahun, dan Sanmol Sirup (120 mg/5 ml) untuk anak balita.\n- **Peringatan**: Jangan berikan bersamaan dengan obat flu kombinasi yang juga mengandung Paracetamol.`;
  }

  if (lowerQ.includes('antasida') && lowerQ.includes('sebelum')) {
    return `### Waktu Minum Antasida yang Benar:\n- **Waktu paling efektif**: 1 jam sebelum makan atau 2 jam sesudah makan, serta saat hendak tidur malam.\n- **Cara konsumsi**: Tablet kunyah WAJIB dikunyah sampai lumat sebelum ditelan, lalu bilas dengan air putih.\n- **Alasan klinis**: Pada 1-2 jam setelah makan, asam lambung mencapai puncak sekresi dan waktu kontak dengan lambung lebih lama.\n- **Interaksi**: Beri jarak minimal 2 jam bila mengonsumsi antibiotik golongan kuinolon/tetrasiklin.`;
  }

  if (lowerQ.includes('hamil') || lowerQ.includes('ibu hamil')) {
    return `### Panduan Obat untuk Ibu Hamil:\n- **Pereda Demam & Nyeri**: Paracetamol adalah pilihan lini pertama (Kategori B / aman pada dosis terapeutik).\n- **Asam Lambung**: Antasida (Aluminium & Magnesium Hidroksida) serta Sukralfat relatif aman untuk penggunaan singkat.\n- **Flu & Batuk**: Hindari dekongestan oral (Pseudoephedrine/Phenylephrine) pada trimester pertama. Prioritaskan uap air hangat dan larutan salin.\n- **KONTRAINDIKASI**: Hindari NSAID (Ibuprofen/Asam Mefenamat) terutama pada trimester ke-3 karena risiko penutupan prematur duktus arteriosus janin.`;
  }

  return `### Jawaban Klinis AI Apoteker:\nTerima kasih atas pertanyaannya mengenai: "${query}".\n\n1. **Prinsip Terapi**: Pastikan identifikasi indikasi dan dosis sesuai usia serta berat badan pasien.\n2. **Kepatuhan Minum Obat**: Edukasikan pentingnya menyelesaikan terapi sesuai anjuran (khususnya untuk antibiotik).\n3. **Keamanan & Penyimpanan**: Simpan obat di wadah tertutup rapat pada suhu kamar terhindar dari panas dan kelembapan.\n4. **Koneksi Internet**: Untuk analisis mendalam lebih lanjut, pastikan koneksi internet aktif agar terhubung ke server Gemini AI.`;
}
