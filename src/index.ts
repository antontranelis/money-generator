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
  Header,
} from './components';

// Store
export { useBillStore } from './stores';

// Services
export {
  loadImage,
  drawTemplate,
  drawOvalPortrait,
  drawText,
  drawMultilineText,
  drawContactInfo,
  renderFrontSide,
  renderBackSide,
  generateBillPDF,
  downloadBlob,
  exportBillAsPDF,
  getApiKey,
  setApiKey,
  hasApiKey,
  enhancePortrait,
  removeBackground,
  setRemoveBackgroundEndpoint,
  getRemoveBackgroundEndpoint,
  hasCustomEndpoint,
  applyEngravingEffect,
  applyHueShift,
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
} from './constants';

// Template compositor (dynamic template generation)
export {
  composeTemplate,
  composeTemplateFullRes,
  getTemplateLayers,
  getTemplateDimensions,
  clearCompositorCache,
  preloadAllTemplates,
  preloadBaseImages,
  TEMPLATE_WIDTH,
  TEMPLATE_HEIGHT,
  PREVIEW_WIDTH,
  PREVIEW_HEIGHT,
} from './services';

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
  TemplateLayout,
} from './types';

// Template Provider System
export {
  setTemplateProvider,
  getTemplateProvider,
  listTemplates,
  getTemplateById,
  staticTemplateProvider,
  getDefaultTemplateId,
} from './templates';

export type {
  Template,
  TemplateProvider,
  TemplateField,
  FieldPosition,
} from './templates';