/**
 * Medicine Image and Icon Auto-Matcher
 * Automatically resolves appropriate high-quality images and visual styles
 * based on medicine name, category, dosage form, and units.
 */

export interface MedicinePresetImage {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  categoryTag: string;
  iconType: 'tablet' | 'syrup' | 'capsule' | 'tube' | 'herbal' | 'vitamin' | 'alkes' | 'drop' | 'inhaler';
}

export const MEDICINE_IMAGE_PRESETS: MedicinePresetImage[] = [
  {
    id: 'tablet-blister',
    name: 'Tablet / Kaplet Strip',
    description: 'Obat tablet atau kaplet dalam blister strip',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=350&auto=format&fit=crop&q=80',
    categoryTag: 'Tablet & Kaplet',
    iconType: 'tablet',
  },
  {
    id: 'tablet-red',
    name: 'Kaplet Sakit Kepala / Flu',
    description: 'Tablet pereda nyeri, demam, flu & sakit kepala',
    imageUrl: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=350&auto=format&fit=crop&q=80',
    categoryTag: 'Analgesik & Flu',
    iconType: 'tablet',
  },
  {
    id: 'syrup-bottle',
    name: 'Sirup / Suspensi Botol',
    description: 'Sediaan sirup obat cair oral anak & dewasa',
    imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=350&auto=format&fit=crop&q=80',
    categoryTag: 'Sirup & Tetes',
    iconType: 'syrup',
  },
  {
    id: 'cough-syrup',
    name: 'Obat Batuk & Flu Sirup',
    description: 'Sirup batuk hitam / ekspektoran botol',
    imageUrl: 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=350&auto=format&fit=crop&q=80',
    categoryTag: 'Sirup & Tetes',
    iconType: 'syrup',
  },
  {
    id: 'capsule-antibiotic',
    name: 'Kapsul Antibiotik / Resep',
    description: 'Kapsul dua warna antibiotik atau obat keras',
    imageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=350&auto=format&fit=crop&q=80',
    categoryTag: 'Kapsul',
    iconType: 'capsule',
  },
  {
    id: 'tube-ointment',
    name: 'Salep / Krim Kulit Tube',
    description: 'Salep, gel, krim antiseptik & luka bakar',
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=350&auto=format&fit=crop&q=80',
    categoryTag: 'Salep & Tube',
    iconType: 'tube',
  },
  {
    id: 'vitamin-supplement',
    name: 'Vitamin & Multivitamin Botol',
    description: 'Suplemen daya tahan tubuh & multivitamin',
    imageUrl: 'https://images.unsplash.com/photo-1550572017-4fcdbb59cc32?w=350&auto=format&fit=crop&q=80',
    categoryTag: 'Vitamin & Suplemen',
    iconType: 'vitamin',
  },
  {
    id: 'herbal-sachet',
    name: 'Herbal & Jamu Sachet',
    description: 'Obat tradisional, jamu, dan cairan herbal',
    imageUrl: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=350&auto=format&fit=crop&q=80',
    categoryTag: 'Herbal & Tradisional',
    iconType: 'herbal',
  },
  {
    id: 'antiseptic-drops',
    name: 'Antiseptik / Tetes Mata',
    description: 'Cairan antiseptik luka atau obat tetes mata/telinga',
    imageUrl: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=350&auto=format&fit=crop&q=80',
    categoryTag: 'Alkes & Antiseptik',
    iconType: 'drop',
  },
  {
    id: 'medical-firstaid',
    name: 'Alkes & Kotak P3K',
    description: 'Plester luka, kassa, perban, dan alat medis',
    imageUrl: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=350&auto=format&fit=crop&q=80',
    categoryTag: 'Alkes & P3K',
    iconType: 'alkes',
  },
  {
    id: 'chewable-stomach',
    name: 'Obat Maag & Kunyah',
    description: 'Tablet kunyah antasida maag atau sediaan lambung',
    imageUrl: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=350&auto=format&fit=crop&q=80',
    categoryTag: 'Obat Bebas',
    iconType: 'tablet',
  },
  {
    id: 'inhaler-spray',
    name: 'Inhaler & Semprot Hidung',
    description: 'Inhaler asma atau nasal spray pelega pernapasan',
    imageUrl: 'https://images.unsplash.com/photo-1579165466741-7f35e4755660?w=350&auto=format&fit=crop&q=80',
    categoryTag: 'Inhaler & Spray',
    iconType: 'inhaler',
  },
];

/**
 * Automatically determine the most fitting medicine image URL based on
 * medicine name, category, and base unit.
 */
export const getAutomaticMedicineImage = (
  name: string = '',
  category: string = '',
  baseUnit: string = '',
  indication: string = ''
): { imageUrl: string; detectedType: string; matchedPreset: MedicinePresetImage } => {
  const q = `${name} ${category} ${baseUnit} ${indication}`.toLowerCase();

  // 1. Specific Brand / Keyword Matches (Highest Priority)
  if (
    q.includes('sirup') ||
    q.includes('syrup') ||
    q.includes('suspensi') ||
    q.includes('obh') ||
    q.includes('sanmol syrup') ||
    q.includes('batuk') ||
    q.includes('komix') ||
    q.includes('siladex') ||
    q.includes('vicks') ||
    (baseUnit.toLowerCase() === 'botol' && !q.includes('vitamin') && !q.includes('minyak'))
  ) {
    if (q.includes('batuk') || q.includes('obh') || q.includes('komix')) {
      const preset = MEDICINE_IMAGE_PRESETS.find((p) => p.id === 'cough-syrup')!;
      return { imageUrl: preset.imageUrl, detectedType: 'Sirup Obat Batuk', matchedPreset: preset };
    }
    const preset = MEDICINE_IMAGE_PRESETS.find((p) => p.id === 'syrup-bottle')!;
    return { imageUrl: preset.imageUrl, detectedType: 'Sirup / Suspensi Botol', matchedPreset: preset };
  }

  if (
    q.includes('salep') ||
    q.includes('krim') ||
    q.includes('cream') ||
    q.includes('gel') ||
    q.includes('ointment') ||
    q.includes('voltaren') ||
    q.includes('bioplacenton') ||
    q.includes('kalpanax') ||
    q.includes('counterpain') ||
    q.includes('thrombophob') ||
    q.includes('hydrocortisone') ||
    q.includes('betamethasone') ||
    baseUnit.toLowerCase() === 'tube'
  ) {
    const preset = MEDICINE_IMAGE_PRESETS.find((p) => p.id === 'tube-ointment')!;
    return { imageUrl: preset.imageUrl, detectedType: 'Salep / Krim Tube', matchedPreset: preset };
  }

  if (
    q.includes('kapsul') ||
    q.includes('capsule') ||
    q.includes('softgel') ||
    q.includes('amoxicillin') ||
    q.includes('omeprazole') ||
    q.includes('lansoprazole') ||
    q.includes('doxycycline') ||
    q.includes('antibiotik') ||
    baseUnit.toLowerCase() === 'kapsul'
  ) {
    const preset = MEDICINE_IMAGE_PRESETS.find((p) => p.id === 'capsule-antibiotic')!;
    return { imageUrl: preset.imageUrl, detectedType: 'Kapsul / Antibiotik', matchedPreset: preset };
  }

  if (
    q.includes('inhaler') ||
    q.includes('spray') ||
    q.includes('semprot') ||
    q.includes('ventolin') ||
    q.includes('symbicort') ||
    q.includes('asma')
  ) {
    const preset = MEDICINE_IMAGE_PRESETS.find((p) => p.id === 'inhaler-spray')!;
    return { imageUrl: preset.imageUrl, detectedType: 'Inhaler & Semprot', matchedPreset: preset };
  }

  if (
    q.includes('tetes mata') ||
    q.includes('tetes telinga') ||
    q.includes('eye drop') ||
    q.includes('insto') ||
    q.includes('rohto') ||
    q.includes('cendo') ||
    q.includes('betadine') ||
    q.includes('antiseptik') ||
    q.includes('rivanol') ||
    q.includes('alkohol')
  ) {
    const preset = MEDICINE_IMAGE_PRESETS.find((p) => p.id === 'antiseptic-drops')!;
    return { imageUrl: preset.imageUrl, detectedType: 'Antiseptik / Tetes Mata', matchedPreset: preset };
  }

  if (
    q.includes('plester') ||
    q.includes('hansaplast') ||
    q.includes('kasa') ||
    q.includes('perban') ||
    q.includes('p3k') ||
    q.includes('spuit') ||
    q.includes('jarum') ||
    q.includes('masker') ||
    q.includes('termometer') ||
    q.includes('tensimeter') ||
    category === 'Alkes & P3K'
  ) {
    const preset = MEDICINE_IMAGE_PRESETS.find((p) => p.id === 'medical-firstaid')!;
    return { imageUrl: preset.imageUrl, detectedType: 'Peralatan Alkes & P3K', matchedPreset: preset };
  }

  if (
    q.includes('vitamin') ||
    q.includes('suplemen') ||
    q.includes('enervon') ||
    q.includes('imboost') ||
    q.includes('redoxon') ||
    q.includes('cdr') ||
    q.includes('c-1000') ||
    q.includes('zinc') ||
    q.includes('kalsium') ||
    q.includes('neurobion') ||
    q.includes('sangobion') ||
    q.includes('renovit') ||
    category === 'Vitamin & Suplemen'
  ) {
    const preset = MEDICINE_IMAGE_PRESETS.find((p) => p.id === 'vitamin-supplement')!;
    return { imageUrl: preset.imageUrl, detectedType: 'Vitamin & Suplemen', matchedPreset: preset };
  }

  if (
    q.includes('tolak angin') ||
    q.includes('antangin') ||
    q.includes('herbal') ||
    q.includes('jamu') ||
    q.includes('minyak kayu putih') ||
    q.includes('minyak telon') ||
    q.includes('balsem') ||
    q.includes('koyo') ||
    q.includes('salonpas') ||
    q.includes('diapet') ||
    category === 'Herbal & Tradisional' ||
    baseUnit.toLowerCase() === 'sachet'
  ) {
    const preset = MEDICINE_IMAGE_PRESETS.find((p) => p.id === 'herbal-sachet')!;
    return { imageUrl: preset.imageUrl, detectedType: 'Herbal & Tradisional Sachet', matchedPreset: preset };
  }

  if (
    q.includes('promag') ||
    q.includes('mylanta') ||
    q.includes('polysilane') ||
    q.includes('antasida') ||
    q.includes('maag') ||
    q.includes('lambung')
  ) {
    const preset = MEDICINE_IMAGE_PRESETS.find((p) => p.id === 'chewable-stomach')!;
    return { imageUrl: preset.imageUrl, detectedType: 'Tablet Kunyah Lambung & Maag', matchedPreset: preset };
  }

  if (
    q.includes('panadol') ||
    q.includes('bodrex') ||
    q.includes('paramex') ||
    q.includes('ultraflu') ||
    q.includes('decolgen') ||
    q.includes('procold') ||
    q.includes('merah') ||
    q.includes('sakit kepala')
  ) {
    const preset = MEDICINE_IMAGE_PRESETS.find((p) => p.id === 'tablet-red')!;
    return { imageUrl: preset.imageUrl, detectedType: 'Kaplet Sakit Kepala & Nyeri', matchedPreset: preset };
  }

  // Default: Tablet / Kaplet Blister Strip
  const defaultPreset = MEDICINE_IMAGE_PRESETS[0];
  return {
    imageUrl: defaultPreset.imageUrl,
    detectedType: 'Tablet / Kaplet Strip Farmasi',
    matchedPreset: defaultPreset,
  };
};

/**
 * Returns matching badge styling and icon identifier
 */
export const getMedicineVisualBadge = (name: string, category: string, baseUnit: string) => {
  const result = getAutomaticMedicineImage(name, category, baseUnit);
  return {
    type: result.detectedType,
    icon: result.matchedPreset.iconType,
    imageUrl: result.imageUrl,
  };
};
