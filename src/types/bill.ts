export type HourValue = 1 | 5 | 10;
export type Language = 'de' | 'en';
export type BillSide = 'front' | 'back';

export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
}

export interface VoucherConfig {
  hours: HourValue;
  description: string;
  language: Language;
  templateHue: number; // 0-360, default 0 (no shift)
}

export interface PortraitState {
  original: string | null;
  enhanced: string | null;
  useEnhanced: boolean;
  zoom: number;
  // Pan offset for positioning zoomed image (-1 to 1, 0 = centered)
  panX: number;
  panY: number;
  // Raw image before effects (for reapplying effects after reload)
  rawImage: string | null;
  // Background-removed version cache
  bgRemovedImage: string | null;
  // Whether background removal is active
  bgRemoved: boolean;
  // Background opacity (0 = transparent, 1 = full original background)
  bgOpacity: number;
  // Background blur (0 = no blur, 1 = max blur)
  bgBlur: number;
  // Current engraving intensity (0-1)
  engravingIntensity: number;
}

export interface BillState {
  personalInfo: PersonalInfo;
  voucherConfig: VoucherConfig;
  portrait: PortraitState;
  currentSide: BillSide;
  isEnhancing: boolean;
  isExporting: boolean;
}

export interface TemplateConfig {
  front: string;
  back: string;
  width: number;
  height: number;
}

export interface CanvasPosition {
  x: number;
  y: number;
}

export interface PortraitConfig extends CanvasPosition {
  radiusX: number;
  radiusY: number;
}

export interface TextConfig extends CanvasPosition {
  fontSize: number;
  maxWidth?: number;
  lineHeight?: number;
  align?: CanvasTextAlign;
}

export interface SignatureConfig extends CanvasPosition {
  width: number;
  height: number;
  labelFontSize: number;
}

export interface TemplateLayout {
  portrait: PortraitConfig;
  namePlate: TextConfig;
  contactInfo?: TextConfig;
  description?: TextConfig;
  signature?: SignatureConfig;
}
