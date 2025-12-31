import type { Language } from '../types/bill';

/**
 * Position of a field on the template canvas
 */
export interface FieldPosition {
  x: number;
  y: number;
  fontSize?: number;
  maxWidth?: number;
  lineHeight?: number;
  align?: CanvasTextAlign;
  // For image fields (portrait)
  radiusX?: number;
  radiusY?: number;
}

/**
 * Definition of a field that can be filled in on a template
 */
export interface TemplateField {
  id: string;
  type: 'text' | 'number' | 'image' | 'select' | 'textarea';
  label: Partial<Record<Language, string>>;
  required: boolean;
  options?: string[]; // For select fields
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

/**
 * Complete template definition
 * Templates define both the visual design and the data fields
 */
export interface Template {
  id: string;
  name: string;
  type: string; // e.g., 'time-voucher', 'massage', 'restaurant'
  category: string; // e.g., 'classic', 'christmas', 'business'

  // Template images
  images: {
    front: string; // URL or data URL
    back: string;
    width: number;
    height: number;
    thumbnail?: string;
  };

  // Fields this template supports
  fields: TemplateField[];

  // Layout coordinates for each field on the canvas
  layout: {
    front: Record<string, FieldPosition>;
    back: Record<string, FieldPosition>;
  };

  // Supported languages
  languages: Language[];

  // Optional metadata for shop/pricing
  pricing?: {
    basePrice: number;
    bulkDiscounts?: boolean;
  };
}

/**
 * Provider interface for template sources
 * Implementations can load from static files, CMS, or other sources
 */
export interface TemplateProvider {
  /**
   * List all available templates, optionally filtered
   */
  listTemplates(filter?: {
    type?: string;
    category?: string;
    language?: Language;
  }): Promise<Template[]>;

  /**
   * Get a specific template by ID
   */
  getTemplate(templateId: string): Promise<Template>;
}