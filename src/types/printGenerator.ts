/**
 * Print Generator Type System
 *
 * Generates vouchers in banknote format with two styles: Spiritual and Business.
 * Uses same UI patterns as original SpiritualPromptGenerator.
 */

// ============================================
// STYLE CONTEXT
// ============================================

export type StyleContext = 'spiritual' | 'business';

// ============================================
// SHARED TYPES
// ============================================

export type PromptLanguage = 'de' | 'en';

// Spiritual color schemes
export type SpiritualColorScheme =
  | 'gold-gruen'      // Gold & gedämpftes Grün
  | 'blau-silber'     // Tiefblau & Silber
  | 'erdtoene'        // Warme Erdtöne
  | 'violett-weiss'   // Violett & Weiß
  | 'schwarz-gold'    // Schwarz & Gold
  | 'pastell';        // Sanfte Pastelltöne

// Business color schemes
export type BusinessColorScheme =
  | 'navy-gold'       // Navy & Gold - klassisch, vertrauenswürdig
  | 'grau-blau'       // Grau & Blau - modern, professionell
  | 'weiss-schwarz'   // Weiß & Schwarz - minimalistisch, elegant
  | 'gruen-weiss'     // Grün & Weiß - frisch, nachhaltig
  | 'bordeaux-gold'   // Bordeaux & Gold - luxuriös, exklusiv
  | 'petrol-silber'   // Petrol & Silber - innovativ, tech
  | 'from-logo';      // Farben aus dem Logo extrahiert

export type ColorScheme = SpiritualColorScheme | BusinessColorScheme;

// Spiritual motifs
export type SpiritualMotif =
  | 'silhouette'  // Mensch/Aura
  | 'licht'       // Kreis/Mandala
  | 'symbol'      // Spirale/Samen
  | 'natur'       // Baum/Wasser abstrahiert
  | 'reduziert'   // nur Form + Raum
  | 'portrait';   // spirituell interpretiert

// Business motifs
export type BusinessMotif =
  | 'logo-zentral'    // Logo im Zentrum
  | 'geometrisch'     // Geometrische Formen
  | 'linien'          // Elegante Linien/Muster
  | 'emblem'          // Schild/Emblem-Stil
  | 'minimal'         // Sehr reduziert, viel Weißraum
  | 'rahmen'          // Dekorativer Rahmen
  | 'portrait';       // Portrait professionell

export type CentralMotif = SpiritualMotif | BusinessMotif;

export type ValueDisplay = 'explizit' | 'symbolisch' | 'beides';
export type ValuePosition = 'ecken' | 'zentral' | 'beides';
export type BackSideStyle = 'erklaerung' | 'einladung' | 'mantra';

// ============================================
// SPIRITUAL-SPECIFIC TYPES
// ============================================

export type Mood = 'kontemplativ' | 'kraftvoll';
export type Energy = 'erdend' | 'transzendent';
export type VisualStyle = 'archaisch' | 'modern';

export type SpiritualSource =
  | 'natur'        // Naturspiritualität
  | 'bewusstsein'  // Achtsamkeit/Präsenz
  | 'alchemie'     // Transformation
  | 'kosmisch'     // Sterne/Geometrie
  | 'mystik'       // ohne Religion
  | 'verbundenheit'; // Herz/Beziehung

export type TextStyle = 'sakral-poetisch' | 'neutral-meditativ' | 'nuechtern';
export type TextClarity = 'raetselhaft' | 'klar';

export type Feeling =
  | 'vertrauen'
  | 'dankbarkeit'
  | 'ruhe'
  | 'wertschaetzung'
  | 'verbundenheit'
  | 'verantwortung';

// ============================================
// BUSINESS-SPECIFIC TYPES
// ============================================

export type Industry =
  | 'consulting'
  | 'tech'
  | 'creative'
  | 'health'
  | 'finance'
  | 'legal'
  | 'education'
  | 'retail'
  | 'service'
  | 'other';

export type Tone = 'formal' | 'professional' | 'friendly' | 'casual';
export type CtaStyle = 'action' | 'invitation' | 'statement';

export type BusinessValue =
  | 'professionalitaet'
  | 'vertrauen'
  | 'qualitaet'
  | 'wertschaetzung'
  | 'innovation'
  | 'zuverlaessigkeit';

// Business design style - controls overall visual aesthetic
export type BusinessDesignStyle =
  | 'klassisch'      // Traditional, bank-note inspired, guilloche patterns
  | 'modern'         // Clean, dynamic, contemporary design language
  | 'premium'        // Luxurious, high-end, exclusive feel
  | 'kreativ';       // Bold, artistic, unconventional

// ============================================
// CONFIGURATION STATE
// ============================================

export interface PrintGeneratorConfig {
  // Style selection
  styleContext: StyleContext;

  // Generation settings
  promptLanguage: PromptLanguage;

  // Design
  colorScheme: ColorScheme | ExtendedColorScheme;
  centralMotif: CentralMotif;
  /** Custom color info when using a custom scheme (for prompt generation) */
  customColorInfo?: {
    name: string;
    colors: string[];
  };

  // Spiritual-specific
  mood: Mood;
  energy: Energy;
  visualStyle: VisualStyle;
  sources: SpiritualSource[];
  textStyle: TextStyle;
  textClarity: TextClarity;
  feelings: Feeling[];

  // Business-specific
  industry: Industry;
  tone: Tone;
  ctaStyle: CtaStyle;
  businessDesignStyle: BusinessDesignStyle;
  businessValues: BusinessValue[];
  logoImage: string | null;
  logoColors: string[]; // Extracted colors from logo (HEX values)

  // Portrait image (for portrait motif in both spiritual and business)
  portraitImage: string | null;

  // Value configuration
  valueDisplay: ValueDisplay;
  valuePosition: ValuePosition;
  customValueText: string;
  voucherValue: string;
  backSideStyle: BackSideStyle;
  backSideText: string; // Custom text for back side (overrides auto-generated)

  // Contact
  personName: string;
  contactEmail: string;
  contactPhone: string;
  contactWebsite: string;

  // QR Code
  qrCodeEnabled: boolean;
  qrCodeUrl: string;
}

export const DEFAULT_CONFIG: PrintGeneratorConfig = {
  styleContext: 'spiritual',
  promptLanguage: 'de',

  colorScheme: 'gold-gruen',
  centralMotif: 'licht',

  // Spiritual defaults
  mood: 'kontemplativ',
  energy: 'erdend',
  visualStyle: 'modern',
  sources: ['bewusstsein'],
  textStyle: 'neutral-meditativ',
  textClarity: 'klar',
  feelings: ['vertrauen', 'ruhe'],

  // Business defaults
  industry: 'service',
  tone: 'professional',
  ctaStyle: 'invitation',
  businessDesignStyle: 'modern',
  businessValues: ['professionalitaet', 'qualitaet'],
  logoImage: null,
  logoColors: [],
  portraitImage: null,

  // Value
  valueDisplay: 'beides',
  valuePosition: 'ecken',
  customValueText: '',
  voucherValue: '1 Stunde',
  backSideStyle: 'einladung',
  backSideText: '',

  // Contact
  personName: '',
  contactEmail: '',
  contactPhone: '',
  contactWebsite: '',

  // QR
  qrCodeEnabled: false,
  qrCodeUrl: '',
};

export const VOUCHER_VALUE_PRESETS = [
  '1 Stunde',
  '50 Euro',
  'Eine Massage',
  'Ein Abendessen',
  'Alles Gute zum Geburtstag',
  'Einen Spaziergang',
  'Zeit für dich',
];

// ============================================
// COLOR SWATCHES FOR UI
// ============================================

// Spiritual color swatches
export const SPIRITUAL_COLOR_SWATCHES: Record<SpiritualColorScheme, string[]> = {
  'gold-gruen': ['#D4AF37', '#8B9A46', '#6B8E23', '#F7E7CE'],
  'blau-silber': ['#191970', '#C0C0C0', '#B0E0E6', '#F5F5F5'],
  'erdtoene': ['#CC7722', '#CD853F', '#D2B48C', '#8B4513', '#B87333'],
  'violett-weiss': ['#E6E6FA', '#800080', '#F5F5F5', '#FFFDD0'],
  'schwarz-gold': ['#1C1C1C', '#FFD700', '#2F4F4F'],
  'pastell': ['#FFB6C1', '#ADD8E6', '#98FB98', '#FFDAB9', '#E6E6FA'],
};

// Business color swatches
export const BUSINESS_COLOR_SWATCHES: Record<BusinessColorScheme, string[]> = {
  'navy-gold': ['#1B2951', '#D4AF37', '#2C3E50', '#F5F5DC'],
  'grau-blau': ['#6C757D', '#0077B6', '#F8F9FA', '#DEE2E6'],
  'weiss-schwarz': ['#FFFFFF', '#1C1C1C', '#F5F5F5', '#333333'],
  'gruen-weiss': ['#2D5A27', '#FFFFFF', '#90EE90', '#F0FFF0'],
  'bordeaux-gold': ['#722F37', '#D4AF37', '#F5E6E8', '#8B4557'],
  'petrol-silber': ['#006D77', '#C0C0C0', '#83C5BE', '#EDF6F9'],
  'from-logo': [], // Placeholder - actual colors come from logoColors in store
};

// Combined for backwards compatibility
export const COLOR_SWATCHES: Record<ColorScheme, string[]> = {
  ...SPIRITUAL_COLOR_SWATCHES,
  ...BUSINESS_COLOR_SWATCHES,
};

// ============================================
// CUSTOM COLOR SCHEMES
// ============================================

/** User-defined or modified color scheme */
export interface CustomColorScheme {
  /** Unique ID (e.g., custom-1234567890-abc123) */
  id: string;
  /** Display name for the color scheme */
  name: string;
  /** HEX color values (4-6 colors) */
  colors: string[];
  /** Which style context this scheme is for */
  context: 'spiritual' | 'business' | 'both';
  /** Whether this is a built-in scheme (false for user-created) */
  isBuiltIn: boolean;
  /** If this is an override of a built-in, the original key */
  builtInKey?: ColorScheme;
}

/** Extended color scheme type that includes custom schemes */
export type ExtendedColorScheme = ColorScheme | `custom-${string}`;
