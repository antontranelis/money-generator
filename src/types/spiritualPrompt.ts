export type Mood = 'kontemplativ' | 'kraftvoll';
export type Energy = 'erdend' | 'transzendent';
export type Style = 'archaisch' | 'modern';

export type SpiritualSource =
  | 'natur'        // Naturspiritualität
  | 'bewusstsein'  // Achtsamkeit/Präsenz
  | 'alchemie'     // Transformation
  | 'kosmisch'     // Sterne/Geometrie
  | 'mystik'       // ohne Religion
  | 'verbundenheit'; // Herz/Beziehung

export type ValueDisplay = 'explizit' | 'symbolisch' | 'beides';

export type ValuePosition = 'ecken' | 'zentral' | 'beides';

export type CentralMotif =
  | 'silhouette'  // Mensch/Aura
  | 'licht'       // Kreis/Mandala
  | 'symbol'      // Spirale/Samen
  | 'natur'       // Baum/Wasser abstrahiert
  | 'reduziert'   // nur Form + Raum
  | 'portrait';   // spirituell interpretiert

export type TextStyle = 'sakral-poetisch' | 'neutral-meditativ' | 'nuechtern';
export type TextClarity = 'raetselhaft' | 'klar';
export type BackSideStyle = 'erklaerung' | 'einladung' | 'mantra';

export type Feeling =
  | 'vertrauen'
  | 'dankbarkeit'
  | 'ruhe'
  | 'wertschaetzung'
  | 'verbundenheit'
  | 'verantwortung';

export type PromptLanguage = 'de' | 'en';

export type PhotoAttachment = 'yes' | 'no';

export type ColorScheme =
  | 'gold-gruen'      // Gold & gedämpftes Grün
  | 'blau-silber'     // Tiefblau & Silber
  | 'erdtoene'        // Warme Erdtöne
  | 'violett-weiss'   // Violett & Weiß
  | 'schwarz-gold'    // Schwarz & Gold
  | 'pastell';        // Sanfte Pastelltöne

export interface SpiritualPromptConfig {
  // 1. Grundhaltung & Wirkung
  mood: Mood;
  energy: Energy;
  style: Style;

  // 2. Spirituelle Quelle (Multi-Select)
  sources: SpiritualSource[];

  // 3. Symbolik statt Wert
  valueDisplay: ValueDisplay;
  valuePosition: ValuePosition;
  customValueText: string;

  // 4. Zentrales Motiv
  centralMotif: CentralMotif;

  // 5. Sprache & Textgefühl
  textStyle: TextStyle;
  textClarity: TextClarity;

  // 6. Rückseite
  backSideStyle: BackSideStyle;

  // 7. Gefühl beim Anfassen (Multi-Select)
  feelings: Feeling[];

  // 8. Personalisierung
  personName: string;
  voucherValue: string;

  // 9. Kontaktdaten
  contactEmail: string;
  contactPhone: string;
  contactWebsite: string;
  contactSocial: string;

  // Prompt-Ausgabe-Sprache
  promptLanguage: PromptLanguage;

  // Foto-Anhang
  photoAttachment: PhotoAttachment;

  // Farbschema
  colorScheme: ColorScheme;
}

export const DEFAULT_SPIRITUAL_PROMPT_CONFIG: SpiritualPromptConfig = {
  mood: 'kontemplativ',
  energy: 'erdend',
  style: 'modern',
  sources: ['bewusstsein'],
  valueDisplay: 'beides',
  valuePosition: 'ecken',
  customValueText: 'Eine Stunde Präsenz',
  centralMotif: 'licht',
  textStyle: 'neutral-meditativ',
  textClarity: 'klar',
  backSideStyle: 'einladung',
  feelings: ['vertrauen', 'ruhe'],
  personName: '',
  voucherValue: '1 Stunde',
  contactEmail: '',
  contactPhone: '',
  contactWebsite: '',
  contactSocial: '',
  promptLanguage: 'de',
  photoAttachment: 'no',
  colorScheme: 'gold-gruen',
};

export const VOUCHER_VALUE_PRESETS = [
  '1 Stunde',
  '5 Brötchen',
  'Eine Massage',
  'Ein Abendessen',
  'Alles Gute zum Geburtstag',
  'Einen Spaziergang',
  'Zeit für dich',
];

export interface SpiritualPromptState extends SpiritualPromptConfig {
  // Actions
  setMood: (mood: Mood) => void;
  setEnergy: (energy: Energy) => void;
  setStyle: (style: Style) => void;
  setSources: (sources: SpiritualSource[]) => void;
  toggleSource: (source: SpiritualSource) => void;
  setValueDisplay: (valueDisplay: ValueDisplay) => void;
  setValuePosition: (valuePosition: ValuePosition) => void;
  setCustomValueText: (text: string) => void;
  setCentralMotif: (motif: CentralMotif) => void;
  setTextStyle: (textStyle: TextStyle) => void;
  setTextClarity: (clarity: TextClarity) => void;
  setBackSideStyle: (style: BackSideStyle) => void;
  setFeelings: (feelings: Feeling[]) => void;
  toggleFeeling: (feeling: Feeling) => void;
  setPersonName: (name: string) => void;
  setVoucherValue: (value: string) => void;
  setContactEmail: (email: string) => void;
  setContactPhone: (phone: string) => void;
  setContactWebsite: (website: string) => void;
  setContactSocial: (social: string) => void;
  setPromptLanguage: (lang: PromptLanguage) => void;
  setPhotoAttachment: (photo: PhotoAttachment) => void;
  setColorScheme: (colorScheme: ColorScheme) => void;
  reset: () => void;
}
