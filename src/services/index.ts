// Canvas rendering
export {
  loadImage,
  drawTemplate,
  drawOvalPortrait,
  drawText,
  drawMultilineText,
  drawContactInfo,
  renderFrontSide,
  renderBackSide,
} from './canvasRenderer';

// Template composition (dynamic template generation)
export {
  composeTemplate,
  composeTemplateFullRes,
  preloadBaseImages,
  getTemplateDimensions,
  clearCompositorCache,
  preloadAllTemplates,
  TEMPLATE_WIDTH,
  TEMPLATE_HEIGHT,
  PREVIEW_WIDTH,
  PREVIEW_HEIGHT,
} from './templateCompositor';

// PDF generation
export {
  generateBillPDF,
  downloadBlob,
  exportBillAsPDF,
  terminateWorker,
} from './pdfGenerator';

// AI enhancement (Stability AI)
export {
  getApiKey,
  setApiKey,
  hasApiKey,
  enhancePortrait,
  removeBackground,
  setRemoveBackgroundEndpoint,
  getRemoveBackgroundEndpoint,
  hasCustomEndpoint,
} from './stabilityAI';
export type { EnhanceStyle } from './stabilityAI';

// Local image effects
export { applyEngravingEffect, applyHueShift, resizeImage, compositeWithBackground, clearImageCache } from './imageEffects';