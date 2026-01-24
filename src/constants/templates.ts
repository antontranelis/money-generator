import type { Language, HourValue, TemplateConfig, TemplateLayout } from '../types/bill';

// Template dimensions (3633x1920 - native webp resolution for 600 DPI)
export const TEMPLATE_WIDTH = 3633;
export const TEMPLATE_HEIGHT = 1920;

// Dynamic template configuration - all templates use the same dimensions now
// The actual template images are composed at runtime from base + badges + text
export function getTemplate(_language: Language, _hours: HourValue): TemplateConfig {
  return {
    front: '', // Will be set dynamically by composeTemplate
    back: '',  // Will be set dynamically by composeTemplate
    width: TEMPLATE_WIDTH,
    height: TEMPLATE_HEIGHT,
  };
}

// Layout coordinates for 3633x1920 templates (600 DPI)
// These are used for both DE and EN since they share the same base template
export const TEMPLATE_LAYOUT: { front: TemplateLayout; back: TemplateLayout } = {
  front: {
    portrait: {
      x: 1810,        // Center X
      y: 918,         // Center Y (slightly above center for the oval frame)
      radiusX: 570,   // Horizontal radius of the oval
      radiusY: 605,   // Vertical radius of the oval
    },
    namePlate: {
      x: 1816,
      y: 1765,        // Bottom name plate position
      fontSize: 85,
      maxWidth: 898,
      align: 'center',
    },
  },
  back: {
    portrait: {
      x: 0,
      y: 0,
      radiusX: 0,
      radiusY: 0,
    },
    namePlate: {
      x: 1816,
      y: 1770,
      fontSize: 85,
      maxWidth: 898,
      align: 'center',
    },
    contactInfo: {
      x: 898,
      y: 939,
      fontSize: 93,
      lineHeight: 165,
      align: 'center',
    },
    description: {
      x: 2721,
      y: 939,
      fontSize: 85,
      maxWidth: 1177,
      lineHeight: 124,
      align: 'center',
    },
    signature: {
      x: 1820,
      y: 1445,
      width: 950,
      height: 145,
      labelFontSize: 85,
    },
  },
};

// Legacy exports for backward compatibility
export const LAYOUT_HDPI = TEMPLATE_LAYOUT;
export const LAYOUT_LDPI = TEMPLATE_LAYOUT;

export function getLayout(_language: Language): { front: TemplateLayout; back: TemplateLayout } {
  // All languages now use the same layout since templates are dynamically composed
  return TEMPLATE_LAYOUT;
}

// Preview scale factor for faster rendering (1 = full res, 0.75 = 3/4 res)
export const PREVIEW_SCALE = 0.75;

// Get scaled layout for preview rendering
export function getPreviewLayout(language: Language): { front: TemplateLayout; back: TemplateLayout } {
  const layout = getLayout(language);
  const scale = PREVIEW_SCALE;

  const scaleLayout = (l: TemplateLayout): TemplateLayout => ({
    portrait: {
      x: l.portrait.x * scale,
      y: l.portrait.y * scale,
      radiusX: l.portrait.radiusX * scale,
      radiusY: l.portrait.radiusY * scale,
    },
    namePlate: {
      x: l.namePlate.x * scale,
      y: l.namePlate.y * scale,
      fontSize: l.namePlate.fontSize * scale,
      maxWidth: l.namePlate.maxWidth ? l.namePlate.maxWidth * scale : undefined,
      lineHeight: l.namePlate.lineHeight ? l.namePlate.lineHeight * scale : undefined,
      align: l.namePlate.align,
    },
    contactInfo: l.contactInfo ? {
      x: l.contactInfo.x * scale,
      y: l.contactInfo.y * scale,
      fontSize: l.contactInfo.fontSize * scale,
      maxWidth: l.contactInfo.maxWidth ? l.contactInfo.maxWidth * scale : undefined,
      lineHeight: l.contactInfo.lineHeight ? l.contactInfo.lineHeight * scale : undefined,
      align: l.contactInfo.align,
    } : undefined,
    description: l.description ? {
      x: l.description.x * scale,
      y: l.description.y * scale,
      fontSize: l.description.fontSize * scale,
      maxWidth: l.description.maxWidth ? l.description.maxWidth * scale : undefined,
      lineHeight: l.description.lineHeight ? l.description.lineHeight * scale : undefined,
      align: l.description.align,
    } : undefined,
    signature: l.signature ? {
      x: l.signature.x * scale,
      y: l.signature.y * scale,
      width: l.signature.width * scale,
      height: l.signature.height * scale,
      labelFontSize: l.signature.labelFontSize * scale,
    } : undefined,
  });

  return {
    front: scaleLayout(layout.front),
    back: scaleLayout(layout.back),
  };
}

// Get scaled template dimensions for preview
export function getPreviewTemplate(language: Language, hours: HourValue): TemplateConfig {
  const template = getTemplate(language, hours);
  return {
    ...template,
    width: Math.round(template.width * PREVIEW_SCALE),
    height: Math.round(template.height * PREVIEW_SCALE),
  };
}
