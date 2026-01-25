/**
 * Generic Template Renderer
 *
 * Rendert Templates basierend auf dem Layer-System aus der Schema-Definition.
 * Unterstützt alle Layer-Typen: Background, Frame, Badges, Field, Text, Decoration
 */

import type {
  TemplateV2,
  Layer,
  BackgroundLayer,
  FrameLayer,
  BadgeLayer,
  FieldLayer,
  TextLayer,
  DecorationLayer,
  TextStyle,
  Position,
  LocalizedString,
  BlendMode,
} from './schema';
import { applyHueShift } from '../services/imageEffects';

// =============================================================================
// Image Loading
// =============================================================================

/**
 * Lade ein Bild von einer URL
 */
async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// =============================================================================
// Types
// =============================================================================

/**
 * Daten für das Rendering (vom User ausgefüllt)
 */
export interface RenderData {
  [fieldId: string]: unknown;
}

/**
 * Render-Optionen
 */
export interface RenderOptions {
  /** Skalierungsfaktor (1 = volle Auflösung) */
  scale?: number;
  /** Hue-Shift Wert (0-360) */
  hue?: number;
  /** Aktuelle Sprache */
  language?: string;
  /** Welche Seite wird gerendert */
  side?: 'front' | 'back';
  /** Portrait-Bild (bereits verarbeitet) */
  portraitImage?: HTMLImageElement | null;
  /** Portrait-Transform (zoom, pan) */
  portraitTransform?: {
    scale: number;
    offsetX: number;
    offsetY: number;
  };
}

// =============================================================================
// Image Cache
// =============================================================================

const imageCache = new Map<string, HTMLImageElement>();
const hueShiftedCache = new Map<string, Map<number, string>>();

/**
 * Lade ein Bild mit Caching
 */
async function loadCachedImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    return imageCache.get(src)!;
  }

  const img = await loadImage(src);
  imageCache.set(src, img);
  return img;
}

/**
 * Konvertiere HTMLImageElement zu Data URL
 */
function imageToDataUrl(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.95);
}

/**
 * Wende Hue-Shift auf ein Bild an (mit Caching)
 */
async function applyHueShiftCached(
  src: string,
  hue: number
): Promise<HTMLImageElement> {
  // Kein Shift nötig
  if (hue === 0) {
    return loadCachedImage(src);
  }

  // Cache prüfen
  if (!hueShiftedCache.has(src)) {
    hueShiftedCache.set(src, new Map());
  }

  const hueCache = hueShiftedCache.get(src)!;
  if (hueCache.has(hue)) {
    return loadCachedImage(hueCache.get(hue)!);
  }

  // Hue-Shift anwenden
  const originalImage = await loadCachedImage(src);
  const originalDataUrl = imageToDataUrl(originalImage);
  const shiftedDataUrl = await applyHueShift(originalDataUrl, hue);

  hueCache.set(hue, shiftedDataUrl);
  return loadImage(shiftedDataUrl);
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Berechne die tatsächliche Position basierend auf Anchor
 */
function resolvePosition(
  pos: Position,
  width: number,
  height: number,
  scale: number
): { x: number; y: number } {
  const x = pos.x * scale;
  const y = pos.y * scale;
  const anchor = pos.anchor || 'topLeft';

  switch (anchor) {
    case 'topLeft':
      return { x, y };
    case 'topCenter':
      return { x: x - width / 2, y };
    case 'topRight':
      return { x: x - width, y };
    case 'centerLeft':
      return { x, y: y - height / 2 };
    case 'center':
      return { x: x - width / 2, y: y - height / 2 };
    case 'centerRight':
      return { x: x - width, y: y - height / 2 };
    case 'bottomLeft':
      return { x, y: y - height };
    case 'bottomCenter':
      return { x: x - width / 2, y: y - height };
    case 'bottomRight':
      return { x: x - width, y: y - height };
    default:
      return { x, y };
  }
}

/**
 * Hole lokalisierten String
 */
function getLocalizedString(
  value: string | LocalizedString | undefined,
  language: string
): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[language] || value['en'] || value['de'] || Object.values(value)[0] || '';
}

/**
 * Banner-Texte für verschiedene Stundenwerte (UPPERCASE)
 */
const BANNER_TEXTS: Record<string, Record<number, string>> = {
  de: {
    1: 'EINE STUNDE',
    5: 'FÜNF STUNDEN',
    10: 'ZEHN STUNDEN',
  },
  en: {
    1: 'ONE HOUR',
    5: 'FIVE HOURS',
    10: 'TEN HOURS',
  },
};

/**
 * Verarbeite Template-Funktionen in Text
 */
function processTemplateFunction(
  content: string,
  data: RenderData,
  language: string
): string {
  // Ersetze {{field_id}} mit Werten aus data oder speziellen Variablen
  return content.replace(/\{\{(\w+)\}\}/g, (_, fieldId) => {
    // Spezielle Banner-Text-Variablen
    if (fieldId === 'hours_banner_de') {
      const hours = Number(data['hours']) || 1;
      return BANNER_TEXTS['de'][hours] || BANNER_TEXTS['de'][1];
    }
    if (fieldId === 'hours_banner_en') {
      const hours = Number(data['hours']) || 1;
      return BANNER_TEXTS['en'][hours] || BANNER_TEXTS['en'][1];
    }
    if (fieldId === 'hours_banner') {
      const hours = Number(data['hours']) || 1;
      const lang = language === 'de' ? 'de' : 'en';
      return BANNER_TEXTS[lang][hours] || BANNER_TEXTS[lang][1];
    }

    const value = data[fieldId];
    if (value === undefined || value === null) return '';
    return String(value);
  });
}

// =============================================================================
// Layer Renderers
// =============================================================================

/**
 * Resolve asset source - supports both legacy (background/frontFrame/backFrame)
 * and new format (front/back)
 */
function resolveAssetSource(template: TemplateV2, source: string, side: 'front' | 'back'): string | undefined {
  const assets = template.assets;

  // Direct source mapping (e.g., "front", "back", "background", etc.)
  if (source === 'front' && assets.front) return assets.front;
  if (source === 'back' && assets.back) return assets.back;
  if (source === 'background' && assets.background) return assets.background;
  if (source === 'frontFrame' && assets.frontFrame) return assets.frontFrame;
  if (source === 'backFrame' && assets.backFrame) return assets.backFrame;

  // Fallback: if source is "background" but template uses new format, use front/back based on side
  if (source === 'background') {
    if (side === 'front' && assets.front) return assets.front;
    if (side === 'back' && assets.back) return assets.back;
  }

  // Check decorations
  if (assets.decorations && assets.decorations[source]) {
    return assets.decorations[source];
  }

  return undefined;
}

/**
 * Render Background Layer
 */
async function renderBackgroundLayer(
  ctx: CanvasRenderingContext2D,
  layer: BackgroundLayer,
  template: TemplateV2,
  options: RenderOptions
): Promise<void> {
  const { scale = 1, hue = 0, side = 'front' } = options;
  const src = resolveAssetSource(template, layer.source, side);

  if (!src) return;

  const img = layer.hueShift ? await applyHueShiftCached(src, hue) : await loadCachedImage(src);

  const width = template.layout.dimensions.width * scale;
  const height = template.layout.dimensions.height * scale;

  if (layer.blendMode) {
    ctx.globalCompositeOperation = blendModeToComposite(layer.blendMode);
  }
  if (layer.opacity !== undefined) {
    ctx.globalAlpha = layer.opacity;
  }

  ctx.drawImage(img, 0, 0, width, height);

  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

/**
 * Konvertiere BlendMode zu GlobalCompositeOperation
 */
function blendModeToComposite(mode: BlendMode): GlobalCompositeOperation {
  const mapping: Record<BlendMode, GlobalCompositeOperation> = {
    'normal': 'source-over',
    'multiply': 'multiply',
    'screen': 'screen',
    'overlay': 'overlay',
    'darken': 'darken',
    'lighten': 'lighten',
    'color-dodge': 'color-dodge',
    'color-burn': 'color-burn',
  };
  return mapping[mode] || 'source-over';
}

/**
 * Render Frame Layer
 */
async function renderFrameLayer(
  ctx: CanvasRenderingContext2D,
  layer: FrameLayer,
  template: TemplateV2,
  options: RenderOptions
): Promise<void> {
  const { scale = 1 } = options;
  const src = layer.source === 'frontFrame' ? template.assets.frontFrame : template.assets.backFrame;

  if (!src) return;

  const img = await loadCachedImage(src);

  const width = template.layout.dimensions.width * scale;
  const height = template.layout.dimensions.height * scale;

  if (layer.blendMode) {
    ctx.globalCompositeOperation = blendModeToComposite(layer.blendMode);
  }
  if (layer.opacity !== undefined) {
    ctx.globalAlpha = layer.opacity;
  }

  ctx.drawImage(img, 0, 0, width, height);

  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

/**
 * Render Badge Layer
 */
async function renderBadgeLayer(
  ctx: CanvasRenderingContext2D,
  layer: BadgeLayer,
  template: TemplateV2,
  data: RenderData,
  options: RenderOptions
): Promise<void> {
  const { scale = 1 } = options;
  const badges = template.assets.badges;

  if (!badges || badges.type !== 'image' || !badges.variants) return;

  const fieldValue = data[layer.fieldId];
  const variant = badges.variants.find((v) => v.value === fieldValue);

  if (!variant) return;

  const badgeImg = await loadCachedImage(variant.image);

  for (const pos of layer.positions) {
    const size = (pos.size || variant.size || 100) * scale;
    const { x, y } = resolvePosition(
      { x: pos.x, y: pos.y, anchor: pos.anchor || 'center' },
      size,
      size,
      scale
    );

    ctx.drawImage(badgeImg, x, y, size, size);
  }
}

/**
 * Render Field Layer (Text oder Image)
 */
async function renderFieldLayer(
  ctx: CanvasRenderingContext2D,
  layer: FieldLayer,
  template: TemplateV2,
  data: RenderData,
  options: RenderOptions
): Promise<void> {
  const { scale = 1, language = 'de', portraitImage, portraitTransform } = options;
  const fieldValue = data[layer.fieldId];

  // Finde das Field im Schema
  const field = template.schema.fields.find((f) => f.id === layer.fieldId);
  if (!field) return;

  // Image Field (Portrait)
  if (field.type === 'image' && layer.clip) {
    await renderImageField(ctx, layer, portraitImage || null, portraitTransform, scale);
    return;
  }

  // Text Field
  if (fieldValue === undefined || fieldValue === null || fieldValue === '') return;

  const text = String(fieldValue);
  const style = layer.style || {
    fontSize: 50,
    fontFamily: template.layout.global?.fontFamily || 'sans-serif',
    color: template.layout.global?.textColor || '#000000',
  };

  // Prefix/Suffix
  const prefix = getLocalizedString(layer.prefix, language);
  const suffix = getLocalizedString(layer.suffix, language);
  const fullText = `${prefix}${text}${suffix}`;

  renderText(ctx, fullText, layer, style, scale);
}

/**
 * Render Image Field (Portrait)
 */
async function renderImageField(
  ctx: CanvasRenderingContext2D,
  layer: FieldLayer,
  image: HTMLImageElement | null,
  transform: RenderOptions['portraitTransform'],
  scale: number
): Promise<void> {
  if (!image || !layer.size) return;

  const { radiusX = 100, radiusY = 100 } = layer.size;
  const scaledRadiusX = radiusX * scale;
  const scaledRadiusY = radiusY * scale;

  const centerX = layer.position.x * scale;
  const centerY = layer.position.y * scale;

  ctx.save();

  // Clipping Path erstellen
  ctx.beginPath();
  if (layer.clip === 'ellipse') {
    ctx.ellipse(centerX, centerY, scaledRadiusX, scaledRadiusY, 0, 0, Math.PI * 2);
  } else if (layer.clip === 'circle') {
    const radius = Math.min(scaledRadiusX, scaledRadiusY);
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  } else if (layer.clip === 'rectangle') {
    ctx.rect(
      centerX - scaledRadiusX,
      centerY - scaledRadiusY,
      scaledRadiusX * 2,
      scaledRadiusY * 2
    );
  }
  ctx.clip();

  // Portrait zeichnen mit Transform - "cover" Verhalten (Seitenverhältnis beibehalten)
  // panX/panY sind normalisiert (-1 bis 1), zoom ist der Skalierungsfaktor
  const zoom = transform?.scale || 1;
  const panX = transform?.offsetX || 0; // Normalisiert, nicht in Pixel!
  const panY = transform?.offsetY || 0;

  // Zielbereich (Ellipse bounding box)
  const targetWidth = scaledRadiusX * 2;
  const targetHeight = scaledRadiusY * 2;

  // Berechne Skalierung für "cover" - das Bild muss den Bereich vollständig ausfüllen
  const imgAspect = image.width / image.height;
  const targetAspect = targetWidth / targetHeight;

  let drawWidth: number;
  let drawHeight: number;

  if (imgAspect > targetAspect) {
    // Bild ist breiter als Ziel - nach Höhe skalieren
    drawHeight = targetHeight;
    drawWidth = drawHeight * imgAspect;
  } else {
    // Bild ist höher als Ziel - nach Breite skalieren
    drawWidth = targetWidth;
    drawHeight = drawWidth / imgAspect;
  }

  // Zoom anwenden
  drawWidth *= zoom;
  drawHeight *= zoom;

  // Max Pan berechnen - wie weit das Bild über die Ellipse hinausragt
  const maxPanX = Math.max(0, (drawWidth - targetWidth) / 2);
  const maxPanY = Math.max(0, (drawHeight - targetHeight) / 2);

  // Position mit Pan-Offset (begrenzt auf den Bereich wo das Bild noch ausfüllt)
  const imgX = centerX - drawWidth / 2 + panX * maxPanX;
  const imgY = centerY - drawHeight / 2 + panY * maxPanY;

  ctx.drawImage(image, imgX, imgY, drawWidth, drawHeight);

  ctx.restore();
}

/**
 * Render Text
 */
function renderText(
  ctx: CanvasRenderingContext2D,
  text: string,
  layer: FieldLayer | TextLayer,
  style: TextStyle,
  scale: number
): void {
  ctx.save();

  const fontSize = style.fontSize * scale;
  const fontWeight = style.fontWeight || 'normal';
  ctx.font = `${fontWeight} ${fontSize}px ${style.fontFamily}`;
  ctx.fillStyle = style.color;
  // align is only on FieldLayer, not TextLayer
  const align = 'align' in layer ? layer.align : 'center';
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';

  if (style.textShadow) {
    // Parse text-shadow (vereinfacht)
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 2 * scale;
    ctx.shadowOffsetX = 1 * scale;
    ctx.shadowOffsetY = 1 * scale;
  }

  const x = layer.position.x * scale;
  const y = layer.position.y * scale;

  // Multiline Text
  if ('multiline' in layer && layer.multiline && 'maxWidth' in layer && layer.maxWidth) {
    const maxWidth = layer.maxWidth * scale;
    const lineHeight = ('lineHeight' in layer && layer.lineHeight ? layer.lineHeight : style.fontSize * 1.2) * scale;

    const lines = wrapText(ctx, text, maxWidth);
    const totalHeight = lines.length * lineHeight;
    let startY = y - totalHeight / 2 + lineHeight / 2;

    for (const line of lines) {
      ctx.fillText(line, x, startY);
      startY += lineHeight;
    }
  } else {
    ctx.fillText(text, x, y);
  }

  ctx.restore();
}

/**
 * Text umbrechen
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Render Static Text Layer
 */
function renderTextLayer(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  data: RenderData,
  options: RenderOptions
): void {
  const { scale = 1, language = 'de' } = options;

  let content = getLocalizedString(layer.content, language);

  // Verarbeite Template-Funktionen
  content = processTemplateFunction(content, data, language);

  if (!content) return;

  // Arc Text
  if (layer.arc) {
    renderArcText(ctx, content, layer, scale);
    return;
  }

  // Rotation
  if (layer.rotation) {
    ctx.save();
    const x = layer.position.x * scale;
    const y = layer.position.y * scale;
    ctx.translate(x, y);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    renderText(ctx, content, { ...layer, position: { x: 0, y: 0 } }, layer.style, 1);
    ctx.restore();
    return;
  }

  renderText(ctx, content, layer, layer.style, scale);
}

/**
 * Render Arc Text (gebogener Text)
 */
function renderArcText(
  ctx: CanvasRenderingContext2D,
  text: string,
  layer: TextLayer,
  scale: number
): void {
  if (!layer.arc) return;

  const { centerX, centerY, radius } = layer.arc;
  const style = layer.style;

  ctx.save();

  const fontSize = style.fontSize * scale;
  const fontWeight = style.fontWeight || 'normal';
  ctx.font = `${fontWeight} ${fontSize}px ${style.fontFamily}`;
  ctx.fillStyle = style.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const scaledCenterX = centerX * scale;
  const scaledCenterY = centerY * scale;
  const scaledRadius = radius * scale;

  // Berechne Winkel-Span basierend auf Textbreite
  const textWidth = ctx.measureText(text).width;
  const angleSpan = textWidth / scaledRadius;
  const startAngle = -Math.PI / 2 - angleSpan / 2;

  // Zeichne jeden Buchstaben
  const chars = text.split('');
  const charWidths = chars.map((c) => ctx.measureText(c).width);

  let currentAngle = startAngle;

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const charWidth = charWidths[i];
    const charAngle = currentAngle + charWidth / 2 / scaledRadius;

    const x = scaledCenterX + scaledRadius * Math.cos(charAngle);
    const y = scaledCenterY + scaledRadius * Math.sin(charAngle);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(charAngle + Math.PI / 2);
    ctx.fillText(char, 0, 0);
    ctx.restore();

    currentAngle += charWidth / scaledRadius;
  }

  ctx.restore();
}

/**
 * Render Decoration Layer
 */
async function renderDecorationLayer(
  ctx: CanvasRenderingContext2D,
  layer: DecorationLayer,
  template: TemplateV2,
  options: RenderOptions
): Promise<void> {
  const { scale = 1 } = options;
  const src = template.assets.decorations?.[layer.source];

  if (!src) return;

  const img = await loadCachedImage(src);

  const width = (layer.size?.width || img.width) * scale;
  const height = (layer.size?.height || img.height) * scale;

  const { x, y } = resolvePosition(layer.position, width, height, scale);

  ctx.save();

  if (layer.opacity !== undefined) {
    ctx.globalAlpha = layer.opacity;
  }

  if (layer.rotation) {
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.drawImage(img, -width / 2, -height / 2, width, height);
  } else {
    ctx.drawImage(img, x, y, width, height);
  }

  ctx.restore();
}

/**
 * Render Portrait als Wasserzeichen mit Radial-Fade-Effekt
 * Wird auf der Rückseite im Zentrum gerendert
 */
function renderWatermark(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  centerX: number,
  centerY: number,
  size: number,
  transform?: RenderOptions['portraitTransform']
): void {
  ctx.save();

  // Offscreen Canvas für den Wasserzeichen-Effekt
  const watermarkCanvas = document.createElement('canvas');
  watermarkCanvas.width = size;
  watermarkCanvas.height = size;
  const wmCtx = watermarkCanvas.getContext('2d');
  if (!wmCtx) {
    ctx.restore();
    return;
  }

  // Bildgröße berechnen für Cover-Verhalten
  const imgAspect = image.width / image.height;
  let drawWidth: number;
  let drawHeight: number;

  if (imgAspect > 1) {
    drawHeight = size;
    drawWidth = size * imgAspect;
  } else {
    drawWidth = size;
    drawHeight = size / imgAspect;
  }

  // Zoom und Pan anwenden
  const zoom = transform?.scale || 1;
  const panX = transform?.offsetX || 0;
  const panY = transform?.offsetY || 0;

  drawWidth *= zoom;
  drawHeight *= zoom;

  const maxPanX = Math.max(0, (drawWidth - size) / 2);
  const maxPanY = Math.max(0, (drawHeight - size) / 2);

  const drawX = (size - drawWidth) / 2 + panX * maxPanX;
  const drawY = (size - drawHeight) / 2 + panY * maxPanY;

  // Portrait mit Entsättigung und Helligkeit zeichnen
  wmCtx.filter = 'grayscale(70%) brightness(1.4) contrast(0.6)';
  wmCtx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  wmCtx.filter = 'none';

  // Radiale Gradientenmaske anwenden (Zentrum sichtbar, Ränder transparent)
  wmCtx.globalCompositeOperation = 'destination-in';
  const gradient = wmCtx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  gradient.addColorStop(0, 'rgba(0,0,0,1)');
  gradient.addColorStop(0.5, 'rgba(0,0,0,0.8)');
  gradient.addColorStop(0.8, 'rgba(0,0,0,0.3)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  wmCtx.fillStyle = gradient;
  wmCtx.fillRect(0, 0, size, size);

  // Wasserzeichen mit niedriger Opazität auf Hauptcanvas zeichnen
  ctx.globalAlpha = 0.18;
  ctx.drawImage(watermarkCanvas, centerX - size / 2, centerY - size / 2);
  ctx.globalAlpha = 1;

  ctx.restore();
}

// =============================================================================
// Main Render Function
// =============================================================================

/**
 * Render ein einzelnes Layer
 */
async function renderLayer(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  template: TemplateV2,
  data: RenderData,
  options: RenderOptions
): Promise<void> {
  switch (layer.type) {
    case 'background':
      await renderBackgroundLayer(ctx, layer, template, options);
      break;
    case 'frame':
      await renderFrameLayer(ctx, layer, template, options);
      break;
    case 'badges':
      await renderBadgeLayer(ctx, layer, template, data, options);
      break;
    case 'field':
      await renderFieldLayer(ctx, layer, template, data, options);
      break;
    case 'text':
      renderTextLayer(ctx, layer, data, options);
      break;
    case 'decoration':
      await renderDecorationLayer(ctx, layer, template, options);
      break;
  }
}

/**
 * Render ein Template auf ein Canvas
 */
export async function renderTemplate(
  canvas: HTMLCanvasElement,
  template: TemplateV2,
  data: RenderData,
  side: 'front' | 'back',
  options: RenderOptions = {}
): Promise<void> {
  const { scale = 1, portraitImage, portraitTransform } = options;
  const { width, height } = template.layout.dimensions;

  // Merge side into options for layer renderers
  const renderOptions: RenderOptions = { ...options, side };

  // Canvas-Größe setzen
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Canvas leeren
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Layers der gewählten Seite rendern
  const layoutSide = side === 'front' ? template.layout.front : template.layout.back;

  for (let i = 0; i < layoutSide.layers.length; i++) {
    const layer = layoutSide.layers[i];

    // Wasserzeichen VOR dem Frame-Layer rendern (damit Frame darüber liegt)
    // - Vorderseite: rechts positioniert
    // - Rückseite: zentral positioniert
    if (layer.type === 'frame' && portraitImage) {
      const watermarkSize = height * 0.6 * scale;
      const watermarkY = height * 0.5 * scale;

      if (side === 'front') {
        // Vorderseite: rechts positioniert
        const watermarkX = (width * 0.78 + 70) * scale;
        renderWatermark(ctx, portraitImage, watermarkX, watermarkY, watermarkSize, portraitTransform);
      } else {
        // Rückseite: zentral positioniert
        const watermarkX = width * 0.5 * scale;
        renderWatermark(ctx, portraitImage, watermarkX, watermarkY, watermarkSize, portraitTransform);
      }
    }

    await renderLayer(ctx, layer, template, data, renderOptions);
  }
}

/**
 * Render ein Template als Data URL
 */
export async function renderTemplateToDataUrl(
  template: TemplateV2,
  data: RenderData,
  side: 'front' | 'back',
  options: RenderOptions = {}
): Promise<string> {
  const canvas = document.createElement('canvas');
  await renderTemplate(canvas, template, data, side, options);

  const { scale = 1 } = options;
  const quality = scale < 1 ? 0.8 : 0.95;

  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Cache leeren
 */
export function clearRendererCache(): void {
  imageCache.clear();
  hueShiftedCache.clear();
}
