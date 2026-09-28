/**
 * Indonesian Pharmaceutical Knowledge Base
 * Automatically detects and populates active pharmaceutical ingredients (Zat Aktif / Generik),
 * standard indications, and medicine classifications based on brand and generic trade names.
 */

export interface DrugKnowledgeEntry {
  patterns: RegExp[];
  genericName: string;
  category?: 'Obat Bebas' | 'Obat Bebas Terbatas' | 'Obat Keras' | 'Sirup & Tetes' | 'Vitamin & Suplemen' | 'Herbal & Tradisional' | 'Alkes & P3K';
  indication?: string;
  baseUnit?: 'Tablet' | 'Kaplet' | 'Kapsul' | 'Botol' | 'Sachet' | 'Pcs' | 'Tube';
  requiresPrescription?: boolean;
}

export const DRUG_KNOWLEDGE_BASE: DrugKnowledgeEntry[] = [
  // 1. Antasida & Lambung
  {
    patterns: [
      /\bantasida\b/i,
      /\bantacid\b/i,
      /\bpromag\b/i,
      /\bmylanta\b/i,
      /\bpolysilane\b/i,
      /\bplantacid\b/i,
      /\bmagasida\b/i,
      /\bsanmag\b/i,
      /\bfarmacrol\b/i,
      /\bgastrinal\b/i,
      /\blambung\b/i,
    ],
    genericName: 'Aluminium Hidroksida 200 mg, Magnesium Hidroksida 200 mg, Simetikon 50 mg',
    category: 'Obat Bebas',
    indication: 'Meredakan gejala sakit maag, asam lambung tinggi, tukak lambung, kembung dan mual',
    baseUnit: 'Tablet',
    requiresPrescription: false,
  },

  // 2. Paracetamol & Analgesik Tunggal
  {
    patterns: [
      /\bparacetamol\b/i,
      /\bparasetamol\b/i,
      /\bpanadol biru\b/i,
      /\bbiogesic\b/i,
      /\bdumin\b/i,
      /\bfarmadol\b/i,
      /\bpamol\b/i,
      /\balphamol\b/i,
      /\btermorex\b/i,
      /\btempra\b/i,
      /\bottopan\b/i,
      /\bacetaminophen\b/i,
    ],
    genericName: 'Paracetamol (Acetaminophen)',
    category: 'Obat Bebas',
    indication: 'Menurunkan demam dan meredakan rasa sakit kepala serta nyeri ringan hingga sedang',
    baseUnit: 'Tablet',
    requiresPrescription: false,
  },

  // 3. Panadol Extra & Kombinasi Nyeri Kafein
  {
    patterns: [
      /\bpanadol extra\b/i,
      /\bpanadol merah\b/i,
      /\boskadon\b/i,
      /\bsaridon\b/i,
      /\bpoldan mig\b/i,
      /\bbodrex sakit kepala\b/i,
      /\bparamex\b/i,
    ],
    genericName: 'Paracetamol 500 mg, Caffeine 65 mg',
    category: 'Obat Bebas',
    indication: 'Meredakan sakit kepala berdenyut, sakit gigi berat, migrain dan nyeri membandel',
    baseUnit: 'Kaplet',
    requiresPrescription: false,
  },

  // 4. Sanmol Sirup Anak & Paracetamol Drop
  {
    patterns: [
      /\bsanmol syrup\b/i,
      /\bsanmol sirup\b/i,
      /\bsanmol drop\b/i,
      /\bparacetamol sirup\b/i,
      /\bparacetamol syrup\b/i,
    ],
    genericName: 'Paracetamol 120 mg / 5 ml',
    category: 'Sirup & Tetes',
    indication: 'Pereda demam anak dan pereda nyeri pasca imunisasi rasa buah manis',
    baseUnit: 'Botol',
    requiresPrescription: false,
  },

  // 5. Obat Flu & Batuk Kombinasi
  {
    patterns: [
      /\bbodrex flu\b/i,
      /\bprocold\b/i,
      /\bultraflu\b/i,
      /\bmixagrip\b/i,
      /\bdecolgen\b/i,
      /\bneozep\b/i,
      /\binza\b/i,
      /\bfludex\b/i,
      /\bstop cold\b/i,
      /\bsanaflu\b/i,
      /\bparatusin\b/i,
    ],
    genericName: 'Paracetamol 500 mg, Pseudoephedrine HCl 30 mg, Chlorpheniramine Maleate (CTM) 2 mg',
    category: 'Obat Bebas Terbatas',
    indication: 'Meringankan gejala flu, hidung tersumbat, bersin-bersin, demam dan sakit kepala',
    baseUnit: 'Kaplet',
    requiresPrescription: false,
  },

  // 6. Sirup Batuk Hitam & Ekspektoran
  {
    patterns: [
      /\bobh combi\b/i,
      /\bobh\b/i,
      /\bkomix\b/i,
      /\bwoods\b/i,
      /\bvicks formula 44\b/i,
      /\bsiladex\b/i,
      /\bactifed\b/i,
      /\bbenadryl\b/i,
    ],
    genericName: 'Succus Liquiritiae, Paracetamol, Ammonium Chloride, Pseudoephedrine HCl, CTM',
    category: 'Sirup & Tetes',
    indication: 'Meredakan batuk berdahak, melegakan tenggorokan dan mengencerkan lendir saluran napas',
    baseUnit: 'Botol',
    requiresPrescription: false,
  },

  // 7. Amoxicillin & Antibiotik Penicillin
  {
    patterns: [
      /\bamoxicillin\b/i,
      /\bamoksisilin\b/i,
      /\bamoxsan\b/i,
      /\byusimox\b/i,
      /\bospamox\b/i,
      /\bhiconcil\b/i,
      /\bkalmoxilin\b/i,
    ],
    genericName: 'Amoxicillin Trihydrate',
    category: 'Obat Keras',
    indication: 'Antibiotik spektrum luas untuk infeksi bakteri saluran pernapasan, telinga dan kemih',
    baseUnit: 'Kaplet',
    requiresPrescription: true,
  },

  // 8. Cefadroxil
  {
    patterns: [
      /\bcefadroxil\b/i,
      /\bsefadrosil\b/i,
      /\bcefat\b/i,
      /\blongcef\b/i,
      /\blapicef\b/i,
      /\bdroxefa\b/i,
    ],
    genericName: 'Cefadroxil Monohydrate 500 mg',
    category: 'Obat Keras',
    indication: 'Antibiotik sefalosporin untuk infeksi tenggorokan, tonsilitis, kulit dan jaringan lunak',
    baseUnit: 'Kapsul',
    requiresPrescription: true,
  },

  // 9. Cefixime
  {
    patterns: [
      /\bcefixime\b/i,
      /\bsefisim\b/i,
      /\bcefspan\b/i,
      /\bsporetik\b/i,
      /\bceptik\b/i,
    ],
    genericName: 'Cefixime Trihydrate 100 mg / 200 mg',
    category: 'Obat Keras',
    indication: 'Antibiotik untuk infeksi saluran kemih tanpa komplikasi, bronkitis dan faringitis',
    baseUnit: 'Kapsul',
    requiresPrescription: true,
  },

  // 10. Ciprofloxacin
  {
    patterns: [
      /\bciprofloxacin\b/i,
      /\bsiprofloksasin\b/i,
      /\bbaquinor\b/i,
      /\bciproxin\b/i,
    ],
    genericName: 'Ciprofloxacin HCl 500 mg',
    category: 'Obat Keras',
    indication: 'Antibiotik fluoroquinolone untuk infeksi berat saluran kemih, pernapasan dan pencernaan',
    baseUnit: 'Tablet',
    requiresPrescription: true,
  },

  // 11. Azithromycin
  {
    patterns: [
      /\bazithromycin\b/i,
      /\basitromisin\b/i,
      /\bzithromax\b/i,
      /\bzycin\b/i,
    ],
    genericName: 'Azithromycin Dihydrate 500 mg',
    category: 'Obat Keras',
    indication: 'Antibiotik makrolida untuk infeksi pneumonia, sinusitis dan infeksi kelamin',
    baseUnit: 'Kaplet',
    requiresPrescription: true,
  },

  // 12. Metronidazole
  {
    patterns: [
      /\bmetronidazole\b/i,
      /\bmetronidazol\b/i,
      /\bflagyl\b/i,
      /\btrichodazol\b/i,
    ],
    genericName: 'Metronidazole 500 mg',
    category: 'Obat Keras',
    indication: 'Antibiotik dan antiamuba untuk infeksi bakteri anaerob, giardiasis dan trikomoniasis',
    baseUnit: 'Tablet',
    requiresPrescription: true,
  },

  // 13. Asam Mefenamat (Ponstan)
  {
    patterns: [
      /\basam mefenamat\b/i,
      /\bmefenamic acid\b/i,
      /\bponstan\b/i,
      /\bmefinal\b/i,
      /\bdolfenal\b/i,
      /\bpondex\b/i,
    ],
    genericName: 'Asam Mefenamat (Mefenamic Acid) 500 mg',
    category: 'Obat Keras',
    indication: 'Meredakan nyeri akut derajat ringan hingga sedang, sakit gigi, dismenore (nyeri haid)',
    baseUnit: 'Kaplet',
    requiresPrescription: true,
  },

  // 14. Ibuprofen
  {
    patterns: [
      /\bibuprofen\b/i,
      /\bproris\b/i,
      /\bbufect\b/i,
      /\bfarsifen\b/i,
      /\bfenris\b/i,
    ],
    genericName: 'Ibuprofen 200 mg / 400 mg',
    category: 'Obat Bebas Terbatas',
    indication: 'Antiinflamasi non-steroid (OAINS) pereda nyeri sendi, sakit gigi dan peredam demam',
    baseUnit: 'Tablet',
    requiresPrescription: false,
  },

  // 15. Natrium / Kalium Diklofenak (Voltaren / Cataflam)
  {
    patterns: [
      /\bdiklofenak\b/i,
      /\bdiclofenac\b/i,
      /\bcataflam\b/i,
      /\bvoltaren\b/i,
      /\bflamar\b/i,
      /\bvoren\b/i,
    ],
    genericName: 'Kalium Diklofenak / Natrium Diklofenak 50 mg',
    category: 'Obat Keras',
    indication: 'Pereda nyeri peradangan berat, asam urat, osteoarthritis dan nyeri pasca operasi',
    baseUnit: 'Tablet',
    requiresPrescription: true,
  },

  // 16. Ketorolac
  {
    patterns: [
      /\bketorolac\b/i,
      /\bketorolak\b/i,
      /\btoradol\b/i,
      /\bscantoma\b/i,
    ],
    genericName: 'Ketorolac Tromethamine 10 mg',
    category: 'Obat Keras',
    indication: 'Penanganan jangka pendek untuk nyeri pasca bedah sedang hingga berat',
    baseUnit: 'Tablet',
    requiresPrescription: true,
  },

  // 17. Omeprazole & PPI Lambung
  {
    patterns: [
      /\bomeprazole\b/i,
      /\bomeprazol\b/i,
      /\blosec\b/i,
      /\bozid\b/i,
      /\bpumpitor\b/i,
      /\bdudencer\b/i,
    ],
    genericName: 'Omeprazole 20 mg',
    category: 'Obat Keras',
    indication: 'Penghambat pompa proton (PPI) untuk GERD, tukak lambung dan hiperasiditas berat',
    baseUnit: 'Kapsul',
    requiresPrescription: true,
  },

  // 18. Lansoprazole
  {
    patterns: [
      /\blansoprazole\b/i,
      /\blansoprazol\b/i,
      /\bprosogan\b/i,
      /\blapraz\b/i,
      /\bcompraz\b/i,
      /\bgastrolan\b/i,
    ],
    genericName: 'Lansoprazole 30 mg',
    category: 'Obat Keras',
    indication: 'Pengobatan ulkus duodenum, tukak lambung jinak dan refluks esofagitis',
    baseUnit: 'Kapsul',
    requiresPrescription: true,
  },

  // 19. Ranitidine
  {
    patterns: [
      /\branitidine\b/i,
      /\branitidin\b/i,
      /\bzantac\b/i,
      /\brantin\b/i,
      /\bacran\b/i,
      /\bradin\b/i,
    ],
    genericName: 'Ranitidine Hydrochloride 150 mg',
    category: 'Obat Keras',
    indication: 'Antagonis reseptor H2 pengurang produksi asam lambung berlebih',
    baseUnit: 'Tablet',
    requiresPrescription: true,
  },

  // 20. Sukralfat
  {
    patterns: [
      /\bsukralfat\b/i,
      /\bsucralfate\b/i,
      /\binpepsa\b/i,
      /\bneciblok\b/i,
      /\bepisan\b/i,
      /\bulsafate\b/i,
    ],
    genericName: 'Sucralfate 500 mg / 5 ml',
    category: 'Obat Keras',
    indication: 'Membentuk lapisan pelindung pada mukosa lambung untuk penyembuhan tukak lambung',
    baseUnit: 'Botol',
    requiresPrescription: true,
  },

  // 21. Domperidone (Antimual)
  {
    patterns: [
      /\bdomperidone\b/i,
      /\bdomperidon\b/i,
      /\bvometa\b/i,
      /\bmotilium\b/i,
      /\btilidon\b/i,
      /\bvesperum\b/i,
    ],
    genericName: 'Domperidone Maleate 10 mg',
    category: 'Obat Keras',
    indication: 'Meredakan mual muntah akut serta dispepsia fungsional dan gastroparesis',
    baseUnit: 'Tablet',
    requiresPrescription: true,
  },

  // 22. Ondansetron
  {
    patterns: [
      /\bondansetron\b/i,
      /\bnarfoz\b/i,
      /\bcedantron\b/i,
      /\binvomit\b/i,
    ],
    genericName: 'Ondansetron HCl 4 mg / 8 mg',
    category: 'Obat Keras',
    indication: 'Antiemetik kuat pencegah mual muntah kemoterapi, radioterapi atau pasca operasi',
    baseUnit: 'Tablet',
    requiresPrescription: true,
  },

  // 23. Cetirizine (Antialergi Gatal)
  {
    patterns: [
      /\bcetirizine\b/i,
      /\bsetirisin\b/i,
      /\bincidal\b/i,
      /\bryvel\b/i,
      /\bozen\b/i,
      /\bcerini\b/i,
      /\blerzin\b/i,
      /\bbetarhin\b/i,
    ],
    genericName: 'Cetirizine Dihydrochloride 10 mg',
    category: 'Obat Bebas Terbatas',
    indication: 'Antihistamin generasi ke-2 untuk rinitis alergi, biduran (urtikaria) dan gatal kulit',
    baseUnit: 'Kaplet',
    requiresPrescription: false,
  },

  // 24. CTM
  {
    patterns: [
      /\bctm\b/i,
      /\bchlorpheniramine\b/i,
      /\bklorfeniramin\b/i,
    ],
    genericName: 'Chlorpheniramine Maleate (CTM) 4 mg',
    category: 'Obat Bebas Terbatas',
    indication: 'Meredakan gejala alergi, bersin-bersin, gatal hidung dan bentol kemerahan',
    baseUnit: 'Tablet',
    requiresPrescription: false,
  },

  // 25. Dexamethasone & Kortikosteroid
  {
    patterns: [
      /\bdexamethasone\b/i,
      /\bdeksametason\b/i,
      /\bkalmethasone\b/i,
      /\bindexon\b/i,
      /\bcortidex\b/i,
      /\blanadexon\b/i,
    ],
    genericName: 'Dexamethasone 0.5 mg',
    category: 'Obat Keras',
    indication: 'Kortikosteroid antiinflamasi dan imunosupresan untuk radang berat dan syok anafilaksis',
    baseUnit: 'Tablet',
    requiresPrescription: true,
  },

  // 26. Methylprednisolone
  {
    patterns: [
      /\bmethylprednisolone\b/i,
      /\bmetilprednisolon\b/i,
      /\bmedixon\b/i,
      /\blameson\b/i,
      /\bsanexon\b/i,
      /\bprednox\b/i,
    ],
    genericName: 'Methylprednisolone 4 mg / 8 mg / 16 mg',
    category: 'Obat Keras',
    indication: 'Meredakan peradangan autoimun, radang sendi, asma bronkial dan alergi berat',
    baseUnit: 'Tablet',
    requiresPrescription: true,
  },

  // 27. Ambroxol & Obat Batuk Berdahak
  {
    patterns: [
      /\bambroxol\b/i,
      /\bambroksol\b/i,
      /\bmucopect\b/i,
      /\bepexol\b/i,
      /\broverton\b/i,
      /\btransmuco\b/i,
    ],
    genericName: 'Ambroxol Hydrochloride 30 mg',
    category: 'Obat Bebas Terbatas',
    indication: 'Mukolitik pengencer sekret saluran napas pada batuk berdahak akut dan kronis',
    baseUnit: 'Tablet',
    requiresPrescription: false,
  },

  // 28. Acetylcysteine
  {
    patterns: [
      /\bacetylcysteine\b/i,
      /\basetilsistein\b/i,
      /\bfluimucil\b/i,
      /\bsimucil\b/i,
    ],
    genericName: 'N-Acetylcysteine 200 mg',
    category: 'Obat Keras',
    indication: 'Mukolitik kuat pengencer dahak kental pada bronkitis, emfisema dan infeksi paru',
    baseUnit: 'Kapsul',
    requiresPrescription: true,
  },

  // 29. Amlodipine (Antihipertensi)
  {
    patterns: [
      /\bamlodipine\b/i,
      /\bamlodipin\b/i,
      /\bnorvask\b/i,
      /\bdivask\b/i,
      /\btensivask\b/i,
      /\bcardivask\b/i,
    ],
    genericName: 'Amlodipine Besylate 5 mg / 10 mg',
    category: 'Obat Keras',
    indication: 'Obat antihipertensi golongan CCB untuk menurunkan tekanan darah dan angina pektoris',
    baseUnit: 'Tablet',
    requiresPrescription: true,
  },

  // 30. Captopril
  {
    patterns: [
      /\bcaptopril\b/i,
      /\bkaptopril\b/i,
      /\btensobon\b/i,
      /\bcapoten\b/i,
    ],
    genericName: 'Captopril 12.5 mg / 25 mg',
    category: 'Obat Keras',
    indication: 'Antihipertensi ACE Inhibitor untuk hipertensi dan gagal jantung kongestif',
    baseUnit: 'Tablet',
    requiresPrescription: true,
  },

  // 31. Candesartan
  {
    patterns: [
      /\bcandesartan\b/i,
      /\bkandesartan\b/i,
      /\bblopress\b/i,
    ],
    genericName: 'Candesartan Cilexetil 8 mg / 16 mg',
    category: 'Obat Keras',
    indication: 'Antihipertensi golongan ARB untuk hipertensi dan perbaikan fungsi ventrikel kiri',
    baseUnit: 'Tablet',
    requiresPrescription: true,
  },

  // 32. Simvastatin (Kolesterol)
  {
    patterns: [
      /\bsimvastatin\b/i,
      /\bzocor\b/i,
      /\bvalstat\b/i,
      /\bcholestat\b/i,
    ],
    genericName: 'Simvastatin 10 mg / 20 mg',
    category: 'Obat Keras',
    indication: 'Menurunkan kadar kolesterol total, kolesterol jahat (LDL) dan trigliserida dalam darah',
    baseUnit: 'Tablet',
    requiresPrescription: true,
  },

  // 33. Atorvastatin
  {
    patterns: [
      /\batorvastatin\b/i,
      /\blipitor\b/i,
      /\bstator\b/i,
    ],
    genericName: 'Atorvastatin Calcium 10 mg / 20 mg',
    category: 'Obat Keras',
    indication: 'Statin penurun kolesterol tinggi dan pencegahan risiko serangan jantung koroner',
    baseUnit: 'Tablet',
    requiresPrescription: true,
  },

  // 34. Metformin (Diabetes)
  {
    patterns: [
      /\bmetformin\b/i,
      /\bglucophage\b/i,
      /\bglumin\b/i,
      /\bnevorap\b/i,
    ],
    genericName: 'Metformin Hydrochloride 500 mg / 850 mg',
    category: 'Obat Keras',
    indication: 'Antidiabetes oral lini pertama untuk diabetes melitus tipe 2 dan resistensi insulin',
    baseUnit: 'Tablet',
    requiresPrescription: true,
  },

  // 35. Glimepiride
  {
    patterns: [
      /\bglimepiride\b/i,
      /\bglimepirid\b/i,
      /\bamaryl\b/i,
      /\bactaryl\b/i,
    ],
    genericName: 'Glimepiride 1 mg / 2 mg / 3 mg',
    category: 'Obat Keras',
    indication: 'Sulfonilurea penstimulasi sekresi insulin pankreas untuk diabetes tipe 2',
    baseUnit: 'Tablet',
    requiresPrescription: true,
  },

  // 36. Allopurinol (Asam Urat)
  {
    patterns: [
      /\ballopurinol\b/i,
      /\balopurinol\b/i,
      /\bzyloric\b/i,
      /\bpuricemia\b/i,
      /\bsinoric\b/i,
      /\basam urat\b/i,
    ],
    genericName: 'Allopurinol 100 mg / 300 mg',
    category: 'Obat Keras',
    indication: 'Menurunkan produksi asam urat dalam darah dan mencegah serangan gout kambuhan',
    baseUnit: 'Tablet',
    requiresPrescription: true,
  },

  // 37. Salbutamol / Ventolin (Asma)
  {
    patterns: [
      /\bsalbutamol\b/i,
      /\bventolin\b/i,
      /\bastharol\b/i,
      /\blasal\b/i,
      /\basma\b/i,
    ],
    genericName: 'Salbutamol Sulfate 2 mg / 4 mg',
    category: 'Obat Keras',
    indication: 'Bronkodilator pelega sesak napas akut akibat bronkospasme pada asma dan PPOK',
    baseUnit: 'Tablet',
    requiresPrescription: true,
  },

  // 38. Diapet & Obat Diare
  {
    patterns: [
      /\bdiapet\b/i,
      /\bentrostop\b/i,
      /\bnew diatabs\b/i,
      /\bloperamide\b/i,
      /\bimodium\b/i,
    ],
    genericName: 'Attapulgite 600 mg, Pektin 50 mg (atau Ekstrak Daun Jambu Biji & Kunyit)',
    category: 'Obat Bebas',
    indication: 'Menyerap racun dan bakteri penyebab diare serta memadatkan feses',
    baseUnit: 'Tablet',
    requiresPrescription: false,
  },

  // 39. Oralit
  {
    patterns: [
      /\boralit\b/i,
      /\bcorsalit\b/i,
      /\bdehidrasi\b/i,
    ],
    genericName: 'Natrium Klorida 0.52 g, Kalium Klorida 0.30 g, Trisodium Sitrat 0.58 g, Glukosa 2.7 g',
    category: 'Obat Bebas',
    indication: 'Mencegah dan mengobati dehidrasi akibat diare akut dan muntah-muntah',
    baseUnit: 'Sachet',
    requiresPrescription: false,
  },

  // 40. Tolak Angin / Herbal Masuk Angin
  {
    patterns: [
      /\btolak angin\b/i,
      /\bantangin\b/i,
      /\bmasuk angin\b/i,
    ],
    genericName: 'Ekstrak Jahe, Daun Mint, Madu, Adas, Daun Cengkeh, Kayu Ules',
    category: 'Herbal & Tradisional',
    indication: 'Mengatasi masuk angin, mual, perut kembung, pusing dan badan meriang',
    baseUnit: 'Sachet',
    requiresPrescription: false,
  },

  // 41. Enervon-C & Multivitamin
  {
    patterns: [
      /\benervon\b/i,
      /\benervon-c\b/i,
      /\bmultivitamin\b/i,
    ],
    genericName: 'Vitamin C 500 mg, Vitamin B1, B2, B6, B12, Niacinamide, Kalsium Pantotenat',
    category: 'Vitamin & Suplemen',
    indication: 'Menjaga daya tahan tubuh dan memulihkan stamina sehabis sakit',
    baseUnit: 'Botol',
    requiresPrescription: false,
  },

  // 42. Redoxon / CDR
  {
    patterns: [
      /\bredoxon\b/i,
      /\bcdr\b/i,
      /\bprotecal\b/i,
      /\bvitamin c 1000\b/i,
    ],
    genericName: 'Vitamin C 1000 mg, Vitamin D 400 IU, Zinc 10 mg, Kalsium 250 mg',
    category: 'Vitamin & Suplemen',
    indication: 'Suplemen effervescent penguat sistem imun tubuh dan kesehatan tulang',
    baseUnit: 'Botol',
    requiresPrescription: false,
  },

  // 43. Imboost
  {
    patterns: [
      /\bimboost\b/i,
      /\bechinacea\b/i,
    ],
    genericName: 'Echinacea Purpurea Herb Dry Extract 250 mg, Zinc Picolinate 10 mg',
    category: 'Vitamin & Suplemen',
    indication: 'Imunomodulator penstimulasi sistem pertahanan tubuh melawan infeksi virus dan bakteri',
    baseUnit: 'Tablet',
    requiresPrescription: false,
  },

  // 44. Neurobion
  {
    patterns: [
      /\bneurobion\b/i,
      /\bvitamin b kompleks\b/i,
      /\bkesemutan\b/i,
    ],
    genericName: 'Vitamin B1 100 mg, Vitamin B6 100 mg, Vitamin B12 200 mcg (Vitamin Neurotropik)',
    category: 'Vitamin & Suplemen',
    indication: 'Mencegah dan mengobati kebas, kesemutan dan kerusakan saraf tepi (neuropati)',
    baseUnit: 'Tablet',
    requiresPrescription: false,
  },

  // 45. Sangobion
  {
    patterns: [
      /\bsangobion\b/i,
      /\bzat besi\b/i,
      /\btambah darah\b/i,
      /\banemia\b/i,
    ],
    genericName: 'Ferrous Gluconate (Zat Besi), Manganese Sulfate, Copper Sulfate, Vitamin C, Folic Acid, Vitamin B12',
    category: 'Vitamin & Suplemen',
    indication: 'Mengatasi anemia defisiensi besi, letih, lesu, lunglai dan pucat',
    baseUnit: 'Kapsul',
    requiresPrescription: false,
  },

  // 46. Betadine Antiseptic
  {
    patterns: [
      /\bbetadine\b/i,
      /\bpovidone iodine\b/i,
      /\bantiseptik luka\b/i,
      /\bobat merah\b/i,
    ],
    genericName: 'Povidone Iodine 10%',
    category: 'Obat Bebas',
    indication: 'Antiseptik topikal pencegah infeksi pada luka lecet, luka potong, luka bakar ringan',
    baseUnit: 'Botol',
    requiresPrescription: false,
  },

  // 47. Hansaplast & Plester Luka
  {
    patterns: [
      /\bhansaplast\b/i,
      /\bplester\b/i,
      /\bband-aid\b/i,
    ],
    genericName: 'Plester Luka Elastis Berpori dengan Bantalan Antiseptik Silver Protect',
    category: 'Alkes & P3K',
    indication: 'Menutup dan melindungi luka gores atau lecet dari kotoran dan infeksi bakteri',
    baseUnit: 'Pcs',
    requiresPrescription: false,
  },

  // 48. Bioplacenton Gel
  {
    patterns: [
      /\bbioplacenton\b/i,
      /\bluka bakar\b/i,
    ],
    genericName: 'Placenta Extract 10%, Neomycin Sulfate 0.5%',
    category: 'Obat Bebas Terbatas',
    indication: 'Mempercepat regenerasi kulit pada luka bakar, luka tersiram air panas dan luka melepuh',
    baseUnit: 'Tube',
    requiresPrescription: false,
  },

  // 49. Voltaren Emulgel / Salep Nyeri
  {
    patterns: [
      /\bvoltaren emulgel\b/i,
      /\bcounterpain\b/i,
      /\bsalep nyeri\b/i,
      /\bganglion\b/i,
    ],
    genericName: 'Diclofenac Diethylamine 1.16% (setara Diklofenak Natrium 1%)',
    category: 'Obat Bebas Terbatas',
    indication: 'Meredakan peradangan akibat trauma tendon, ligamen, otot dan persendian',
    baseUnit: 'Tube',
    requiresPrescription: false,
  },

  // 50. Kalpanax / Daktarin / Salep Jamur Kulit
  {
    patterns: [
      /\bkalpanax\b/i,
      /\bdaktarin\b/i,
      /\bmiconazole\b/i,
      /\bmikonazol\b/i,
      /\bcanesten\b/i,
      /\bclotrimazole\b/i,
      /\bjamur kulit\b/i,
      /\bpanu\b/i,
    ],
    genericName: 'Miconazole Nitrate 2%',
    category: 'Obat Bebas Terbatas',
    indication: 'Mengatasi infeksi jamur pada kulit seperti panu, kadas, kurap, kutu air dan candidiasis',
    baseUnit: 'Tube',
    requiresPrescription: false,
  },

  // 51. Insto & Tetes Mata
  {
    patterns: [
      /\binsto\b/i,
      /\brohto\b/i,
      /\btetes mata\b/i,
      /\bmata merah\b/i,
      /\bcendo\b/i,
    ],
    genericName: 'Tetrahydrozoline HCl 0.05%, Benzalkonium Chloride 0.01%',
    category: 'Obat Bebas Terbatas',
    indication: 'Meredakan iritasi mata merah, mata perih akibat debu, asap, angin dan berenang',
    baseUnit: 'Botol',
    requiresPrescription: false,
  },

  // 52. Minyak Kayu Putih & Minyak Telon
  {
    patterns: [
      /\bminyak kayu putih\b/i,
      /\bkayu putih\b/i,
      /\bminyak telon\b/i,
      /\bcajuput\b/i,
    ],
    genericName: 'Oleum Cajuputi (Minyak Kayu Putih Murni 100%)',
    category: 'Herbal & Tradisional',
    indication: 'Menghangatkan tubuh, melegakan pernapasan dan meredakan gatal gigitan serangga',
    baseUnit: 'Botol',
    requiresPrescription: false,
  },
];

/**
 * Intelligent drug detection function:
 * Searches the knowledge base for matching patterns based on medicine name.
 * If exact match or token match is found, returns generic active ingredient, category, and indication.
 */
export const detectActiveIngredient = (
  tradeName: string
): {
  genericName: string;
  category?: DrugKnowledgeEntry['category'];
  indication?: string;
  baseUnit?: DrugKnowledgeEntry['baseUnit'];
  requiresPrescription?: boolean;
} | null => {
  if (!tradeName || !tradeName.trim()) return null;

  const cleanName = tradeName.trim().toLowerCase();

  for (const entry of DRUG_KNOWLEDGE_BASE) {
    for (const pattern of entry.patterns) {
      if (pattern.test(cleanName)) {
        return {
          genericName: entry.genericName,
          category: entry.category,
          indication: entry.indication,
          baseUnit: entry.baseUnit,
          requiresPrescription: entry.requiresPrescription,
        };
      }
    }
  }

  // Fallback: If tradeName contains clear dosage (e.g. "Amoxicillin 500 mg", "Paracetamol 500mg"),
  // and no complex pattern matched, strip dosage and clean up as generic active ingredient!
  const genericWords = cleanName
    .replace(/\b(sirup|syrup|drop|tablet|kaplet|kapsul|tube|botol|strip|box|mg|ml|g|forte|plus|extra)\b/gi, '')
    .trim();

  if (genericWords.length >= 3) {
    // Check if it's already a well-known chemical substance name
    const capitalizeWords = genericWords
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    return {
      genericName: capitalizeWords,
    };
  }

  return null;
};
