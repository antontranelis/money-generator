/**
 * Template System Schema v2.0
 *
 * Schema-basiertes Template-System für flexibles, künstler-erstellbares Design.
 * Jedes Template definiert seine eigenen Felder, Layout und Rendering-Regeln.
 */

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Lokalisierter String - unterstützt mehrere Sprachen
 */
export type LocalizedString = Record<string, string>;

/**
 * Anchor-Positionen für Elemente
 */
export type Anchor =
  | 'topLeft'
  | 'topCenter'
  | 'topRight'
  | 'centerLeft'
  | 'center'
  | 'centerRight'
  | 'bottomLeft'
  | 'bottomCenter'
  | 'bottomRight';

/**
 * Canvas Blend Modes
 */
export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn';

// =============================================================================
// Template Metadata
// =============================================================================

/**
 * Template-Typen für Kategorisierung
 */
export type TemplateType =
  | 'time-voucher'
  | 'gift-voucher'
  | 'business-card'
  | 'membership-card'
  | 'event-ticket'
  | 'certificate'
  | 'loyalty-card'
  | 'custom';

/**
 * Template-Status im Lifecycle
 */
export type TemplateStatus =
  | 'development'
  | 'submitted'
  | 'in_review'
  | 'changes_requested'
  | 'approved'
  | 'published'
  | 'deprecated';

/**
 * Designer-Informationen
 */
export interface TemplateDesigner {
  name: string;
  url?: string;
  email?: string;
}

/**
 * Review-Informationen (für eingereichte Templates)
 */
export interface TemplateReview {
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  feedback?: string;
  approvedAt?: string;
}

// =============================================================================
// Template Assets
// =============================================================================

/**
 * Text-Styling für Text-Layer und Text-Badges
 */
export interface TextStyle {
  fontSize: number;
  fontFamily: string;
  fontWeight?: number | 'normal' | 'bold';
  color: string;
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacing?: number;
  textShadow?: string;
}

/**
 * Badge-Asset Definition
 */
export interface BadgeVariant {
  value: string | number;
  image: string;
  size?: number;
}

/**
 * Badge-System Konfiguration
 */
export interface BadgeAssets {
  type: 'image' | 'text' | 'none';
  /** Für type: 'image' */
  variants?: BadgeVariant[];
  /** Für type: 'text' */
  style?: TextStyle;
}

/**
 * Font-Definition für custom Fonts
 */
export interface FontAsset {
  name: string;
  url: string;
  format: 'woff2' | 'woff' | 'ttf';
}

/**
 * Alle Template-Assets
 */
export interface TemplateAssets {
  /** Hintergrundbild (WebP/PNG) */
  background: string;
  /** Frame für Vorderseite (optional) */
  frontFrame?: string;
  /** Frame für Rückseite (optional) */
  backFrame?: string;
  /** Badge-System */
  badges?: BadgeAssets;
  /** Dekorative Elemente */
  decorations?: Record<string, string>;
  /** Custom Fonts */
  fonts?: FontAsset[];
}

// =============================================================================
// Field Types
// =============================================================================

/**
 * Verfügbare Feld-Typen
 */
export type FieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'image'
  | 'email'
  | 'tel'
  | 'url'
  | 'date'
  | 'color'
  | 'boolean'
  | 'textarea';

/**
 * Text-Feld Konfiguration
 */
export interface TextFieldConfig {
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  transform?: 'uppercase' | 'lowercase' | 'capitalize';
}

/**
 * Number-Feld Konfiguration
 */
export interface NumberFieldConfig {
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  format?: 'integer' | 'decimal';
}

/**
 * Select-Option
 */
export interface SelectOption {
  value: string | number;
  label: LocalizedString | string;
  badge?: string;
  description?: string;
}

/**
 * Select-Feld Konfiguration
 */
export interface SelectFieldConfig {
  options: SelectOption[];
  multiple?: boolean;
  searchable?: boolean;
}

/**
 * Image-Feld Features
 */
export interface ImageFeatures {
  zoom?: boolean;
  pan?: boolean;
  rotate?: boolean;
  crop?: boolean;
  backgroundRemoval?: boolean;
  engraving?: boolean;
  filters?: Array<'grayscale' | 'sepia' | 'blur' | 'brightness'>;
}

/**
 * Image-Feld Dimensionen
 */
export interface ImageDimensions {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  aspectRatio?: number;
}

/**
 * Image-Feld Konfiguration
 */
export interface ImageFieldConfig {
  shape: 'ellipse' | 'circle' | 'rectangle' | 'custom';
  maxSize?: number;
  acceptedFormats?: string[];
  features?: ImageFeatures;
  dimensions?: ImageDimensions;
}

/**
 * Email-Feld Konfiguration
 */
export interface EmailFieldConfig {
  requireVerification?: boolean;
}

/**
 * Tel-Feld Konfiguration
 */
export interface TelFieldConfig {
  format?: 'international' | 'national';
  defaultCountry?: string;
}

/**
 * URL-Feld Konfiguration
 */
export interface UrlFieldConfig {
  protocols?: string[];
  requireProtocol?: boolean;
}

/**
 * Date-Feld Konfiguration
 */
export interface DateFieldConfig {
  minDate?: string;
  maxDate?: string;
  format?: string;
  includeTime?: boolean;
}

/**
 * Color-Feld Konfiguration
 */
export interface ColorFieldConfig {
  palette?: string[];
  allowCustom?: boolean;
  format?: 'hex' | 'rgb' | 'hsl';
  alpha?: boolean;
}

/**
 * Boolean-Feld Konfiguration
 */
export interface BooleanFieldConfig {
  style?: 'checkbox' | 'toggle' | 'switch';
  trueLabel?: LocalizedString | string;
  falseLabel?: LocalizedString | string;
}

/**
 * Textarea-Feld Konfiguration
 */
export interface TextareaFieldConfig {
  rows?: number;
  maxLength?: number;
  minLength?: number;
  spellcheck?: boolean;
  autogrow?: boolean;
}

/**
 * Union aller Feld-Konfigurationen
 */
export type FieldConfig =
  | TextFieldConfig
  | NumberFieldConfig
  | SelectFieldConfig
  | ImageFieldConfig
  | EmailFieldConfig
  | TelFieldConfig
  | UrlFieldConfig
  | DateFieldConfig
  | ColorFieldConfig
  | BooleanFieldConfig
  | TextareaFieldConfig;

/**
 * Feld-Validierung
 */
export interface FieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  custom?: {
    function: string;
    message?: LocalizedString | string;
    params?: Record<string, unknown>;
  };
  messages?: {
    required?: LocalizedString | string;
    invalid?: LocalizedString | string;
    tooShort?: LocalizedString | string;
    tooLong?: LocalizedString | string;
  };
}

/**
 * UI-Hints für Formular-Darstellung
 */
export interface FieldUI {
  placeholder?: LocalizedString | string;
  helpText?: LocalizedString | string;
  order?: number;
  group?: string;
  hidden?: boolean;
  disabled?: boolean;
}

/**
 * Bedingte Anzeige eines Feldes
 */
export interface FieldConditional {
  fieldId: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
  value: unknown;
}

/**
 * Komplette Feld-Definition
 */
export interface TemplateField {
  id: string;
  type: FieldType;
  label: LocalizedString | string;
  required: boolean;
  default?: unknown;
  config?: FieldConfig;
  validation?: FieldValidation;
  ui?: FieldUI;
  conditional?: FieldConditional;
}

/**
 * Feld-Gruppierung für UI
 */
export interface FieldGroup {
  id: string;
  label: LocalizedString | string;
  fields: string[];
  collapsible?: boolean;
}

/**
 * Validation Rule für globale Validierung
 */
export interface ValidationRule {
  function: string;
  message: LocalizedString | string;
  params?: Record<string, unknown>;
}

/**
 * Template Schema (Feld-Definitionen)
 */
export interface TemplateSchema {
  languages?: string[];
  defaultLanguage?: string;
  fields: TemplateField[];
  validation?: {
    customRules?: ValidationRule[];
  };
  fieldGroups?: FieldGroup[];
}

// =============================================================================
// Layout & Layers
// =============================================================================

/**
 * Position mit Anchor
 */
export interface Position {
  x: number;
  y: number;
  anchor?: Anchor;
}

/**
 * Größen-Definition
 */
export interface Size {
  width?: number;
  height?: number;
  radiusX?: number;
  radiusY?: number;
}

/**
 * Arc-Konfiguration für gebogenen Text
 */
export interface ArcConfig {
  centerX: number;
  centerY: number;
  radius: number;
}

// -----------------------------------------------------------------------------
// Layer Types
// -----------------------------------------------------------------------------

/**
 * Background Layer
 */
export interface BackgroundLayer {
  type: 'background';
  source: string;
  hueShift?: boolean;
  opacity?: number;
  blendMode?: BlendMode;
}

/**
 * Frame Layer
 */
export interface FrameLayer {
  type: 'frame';
  source: 'frontFrame' | 'backFrame';
  opacity?: number;
  blendMode?: BlendMode;
}

/**
 * Badge Layer
 */
export interface BadgeLayer {
  type: 'badges';
  fieldId: string;
  positions: Array<{
    x: number;
    y: number;
    size: number;
    anchor?: Anchor;
  }>;
}

/**
 * Field Layer (dynamischer Content)
 */
export interface FieldLayer {
  type: 'field';
  fieldId: string;
  position: Position;
  /** Für Image-Fields */
  clip?: 'ellipse' | 'circle' | 'rectangle' | 'none';
  size?: Size;
  /** Für Text-Fields */
  style?: TextStyle;
  multiline?: boolean;
  maxWidth?: number;
  lineHeight?: number;
  align?: 'left' | 'center' | 'right';
  /** Prefix/Suffix */
  prefix?: LocalizedString | string;
  suffix?: LocalizedString | string;
}

/**
 * Static Text Layer
 */
export interface TextLayer {
  type: 'text';
  content: string | LocalizedString;
  position: Position;
  style: TextStyle;
  arc?: ArcConfig;
  rotation?: number;
}

/**
 * Decoration Layer
 */
export interface DecorationLayer {
  type: 'decoration';
  source: string;
  position: Position;
  size?: {
    width: number;
    height: number;
  };
  opacity?: number;
  rotation?: number;
}

/**
 * Union aller Layer-Typen
 */
export type Layer =
  | BackgroundLayer
  | FrameLayer
  | BadgeLayer
  | FieldLayer
  | TextLayer
  | DecorationLayer;

/**
 * Layout für eine Seite (front/back)
 */
export interface LayoutSide {
  layers: Layer[];
}

/**
 * Hue-Shift Konfiguration
 */
export interface HueShiftConfig {
  enabled: boolean;
  defaultHue?: number;
  affectedLayers?: string[];
}

/**
 * Template Dimensionen
 */
export interface TemplateDimensions {
  width: number;
  height: number;
  dpi: number;
  physicalSize?: string;
}

/**
 * Globale Layout-Konfiguration
 */
export interface GlobalLayoutConfig {
  hueShift?: HueShiftConfig;
  fontFamily?: string;
  textColor?: string;
  backgroundColor?: string;
}

/**
 * Komplettes Layout
 */
export interface TemplateLayout {
  dimensions: TemplateDimensions;
  front: LayoutSide;
  back: LayoutSide;
  global?: GlobalLayoutConfig;
}

// =============================================================================
// Template Features
// =============================================================================

/**
 * Optionale Template-Features
 */
export interface TemplateFeatures {
  /** Hue-Shifting aktiviert */
  hueShift?: boolean;
  /** Portrait-Bearbeitung Features */
  portraitEditing?: {
    backgroundRemoval?: boolean;
    engraving?: boolean;
    zoom?: boolean;
    pan?: boolean;
  };
  /** Signatur-Feld */
  signature?: boolean;
}

// =============================================================================
// Shop Integration
// =============================================================================

/**
 * Shop-Pricing Konfiguration
 */
export interface ShopPricing {
  basePriceMultiplier?: number;
}

/**
 * Shop-Integration Konfiguration
 */
export interface ShopConfig {
  pricing?: ShopPricing;
  tags?: string[];
  thumbnail?: string;
  featured?: boolean;
}

// =============================================================================
// Main Template Interface
// =============================================================================

/**
 * Vollständige Template-Definition v2.0
 */
export interface TemplateV2 {
  // === Metadata ===
  id: string;
  version: string;
  name: string;
  type: TemplateType;
  description: string;

  designer: TemplateDesigner;

  created: string;
  updated?: string;

  status: TemplateStatus;
  review?: TemplateReview;

  // === Assets ===
  assets: TemplateAssets;

  // === Schema ===
  schema: TemplateSchema;

  // === Layout ===
  layout: TemplateLayout;

  // === Features ===
  features?: TemplateFeatures;

  // === Shop ===
  shop?: ShopConfig;
}

// =============================================================================
// Validation Types
// =============================================================================

/**
 * Validation Error
 */
export interface ValidationError {
  path: string;
  message: string;
  severity: 'error';
}

/**
 * Validation Warning
 */
export interface ValidationWarning {
  path: string;
  message: string;
  severity: 'warning';
}

/**
 * Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

// =============================================================================
// Template Provider Interface
// =============================================================================

/**
 * Filter für Template-Listen
 */
export interface TemplateFilter {
  type?: TemplateType;
  category?: string;
  status?: TemplateStatus;
  language?: string;
}

/**
 * Template Provider Interface
 *
 * Implementierungen laden Templates aus verschiedenen Quellen:
 * - Static: Gebündelte JSON-Dateien
 * - Dev: Lokale Entwicklungs-Templates
 * - CMS: Externe API/CMS
 */
export interface TemplateProviderV2 {
  /**
   * Liste alle verfügbaren Templates
   */
  listTemplates(filter?: TemplateFilter): Promise<TemplateV2[]>;

  /**
   * Lade ein spezifisches Template
   */
  getTemplate(id: string): Promise<TemplateV2>;

  /**
   * Validiere ein Template
   */
  validateTemplate(template: TemplateV2): Promise<ValidationResult>;

  /**
   * Lade ein Entwicklungs-Template (optional)
   */
  loadDevTemplate?(path: string): Promise<TemplateV2>;

  /**
   * Watch für Entwicklungs-Template Änderungen (optional)
   */
  watchDevTemplates?(callback: (templates: TemplateV2[]) => void): () => void;
}
