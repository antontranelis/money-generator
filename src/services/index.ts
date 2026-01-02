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

// PDF generation
export {
  generateBillPDF,
  downloadBlob,
  exportBillAsPDF,
} from './pdfGenerator';

// AI enhancement (Stability AI)
export {
  getApiKey,
  setApiKey,
  hasApiKey,
  enhancePortrait,
  removeBackground,
} from './stabilityAI';
export type { EnhanceStyle } from './stabilityAI';

// Local image effects
export { applyEngravingEffect } from './imageEffects';