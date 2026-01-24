import type { TemplateV2, TemplateProviderV2, TemplateFilter } from './schema';
import {
  templateProviderV2,
  registerTemplate,
  unregisterTemplate,
  clearTemplateCache,
  hasTemplate,
  getDefaultTemplateId,
} from './templateLoader';

// =============================================================================
// Template System v2 Exports
// =============================================================================

// Export v2 schema types
export type {
  TemplateV2,
  TemplateProviderV2,
  TemplateFilter,
  TemplateType,
  TemplateStatus,
  TemplateDesigner,
  TemplateReview,
  TemplateAssets,
  TemplateSchema,
  TemplateLayout,
  TemplateFeatures,
  TemplateField,
  FieldType,
  FieldConfig,
  TextFieldConfig,
  NumberFieldConfig,
  SelectFieldConfig,
  ImageFieldConfig,
  SelectOption,
  Layer,
  BackgroundLayer,
  FrameLayer,
  BadgeLayer,
  FieldLayer,
  TextLayer,
  DecorationLayer,
  LayoutSide,
  Position,
  Size,
  TextStyle,
  Anchor,
  BlendMode,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  LocalizedString,
} from './schema';

// Export v2 template loader functions
export {
  templateProviderV2,
  registerTemplate,
  unregisterTemplate,
  clearTemplateCache,
  hasTemplate,
  getDefaultTemplateId,
};

/**
 * Current v2 template provider
 */
let currentProvider: TemplateProviderV2 = templateProviderV2;

/**
 * Set a custom template provider
 */
export function setTemplateProvider(provider: TemplateProviderV2): void {
  currentProvider = provider;
}

/**
 * Get the current template provider
 */
export function getTemplateProvider(): TemplateProviderV2 {
  return currentProvider;
}

/**
 * List available templates
 */
export async function listTemplatesV2(filter?: TemplateFilter): Promise<TemplateV2[]> {
  return currentProvider.listTemplates(filter);
}

/**
 * Get a specific template by ID
 */
export async function getTemplateByIdV2(templateId: string): Promise<TemplateV2> {
  return currentProvider.getTemplate(templateId);
}

/**
 * Validate a template
 */
export async function validateTemplate(template: TemplateV2): Promise<import('./schema').ValidationResult> {
  return currentProvider.validateTemplate(template);
}
