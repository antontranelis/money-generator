// Components
export {
  PersonalInfoForm,
  PortraitUpload,
  VoucherConfig,
  BillPreview,
  useBillCanvasRefs,
  ExportButton,
  LanguageToggle,
  ApiKeyModal,
  TouchSlider,
  Header,
} from './components';

// Store
export { useBillStore, initializeBillStore } from './stores';

// Services
export {
  // PDF Generation
  generateBillPdfV2,
  downloadBlob,
  exportBillAsPdfV2,
  // AI Enhancement
  getApiKey,
  setApiKey,
  hasApiKey,
  enhancePortrait,
  removeBackground,
  setRemoveBackgroundEndpoint,
  getRemoveBackgroundEndpoint,
  hasCustomEndpoint,
  // Image Effects
  applyEngravingEffect,
  applyHueShift,
  resizeImage,
  resizeImageForStorage,
  compositeWithBackground,
  clearImageCache,
} from './services';
export type { EnhanceStyle } from './services';

// Constants
export {
  t,
  formatDescription,
  TEMPLATE_LAYOUT,
  LAYOUT_LDPI,
  LAYOUT_HDPI,
  getLayout,
  getTemplate,
  TEMPLATE_WIDTH,
  TEMPLATE_HEIGHT,
} from './constants';

// Types
export type {
  HourValue,
  Language,
  BillSide,
  PersonalInfo,
  VoucherConfig as VoucherConfigType,
  PortraitState,
  BillState,
  TemplateConfig,
  CanvasPosition,
  PortraitConfig,
  TextConfig,
  SignatureConfig,
  TemplateLayout as LegacyTemplateLayout,
} from './types';

// Template System
export {
  // Provider functions
  setTemplateProvider,
  getTemplateProvider,
  listTemplatesV2,
  getTemplateByIdV2,
  validateTemplate,
  templateProviderV2,
  // Template management
  registerTemplate,
  unregisterTemplate,
  clearTemplateCache,
  hasTemplate,
  getDefaultTemplateId,
} from './templates';

export type {
  // Core types
  TemplateV2,
  TemplateProviderV2,
  TemplateFilter,
  TemplateType,
  TemplateStatus,
  // Schema types
  TemplateSchema,
  TemplateLayout,
  TemplateAssets,
  TemplateFeatures,
  TemplateDesigner,
  // Field types
  TemplateField,
  FieldType,
  FieldConfig,
  TextFieldConfig,
  NumberFieldConfig,
  SelectFieldConfig,
  ImageFieldConfig,
  SelectOption,
  // Layer types
  Layer,
  BackgroundLayer,
  FrameLayer,
  BadgeLayer,
  FieldLayer,
  TextLayer,
  DecorationLayer,
  LayoutSide,
  // Utility types
  Position,
  Size,
  TextStyle,
  Anchor,
  BlendMode,
  LocalizedString,
  // Validation types
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from './templates';

// Generic Renderer
export {
  renderTemplate,
  renderTemplateToDataUrl,
  clearRendererCache,
} from './templates/genericRenderer';

export type { RenderData, RenderOptions } from './templates/genericRenderer';
