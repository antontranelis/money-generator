// PDF generation (V2)
export {
  generateBillPdfV2,
  downloadBlob,
  exportBillAsPdfV2,
} from './pdfGeneratorV2';

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
export { applyEngravingEffect, applyHueShift, resizeImage, resizeImageForStorage, compositeWithBackground, clearImageCache } from './imageEffects';