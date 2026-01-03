import type { Language, HourValue, TemplateConfig, TemplateLayout } from '../types/bill';

type TemplateMap = Record<Language, Record<HourValue, TemplateConfig>>;

// Use Vite's BASE_URL if available, otherwise default to '/'
const base = typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL || '/';

export const TEMPLATES: TemplateMap = {
  en: {
    1: {
      front: `${base}templates/front_ldpi_en.png`,
      back: `${base}templates/back_ldpi_en.png`,
      width: 1536,
      height: 1024,
    },
    5: {
      front: `${base}templates/front_ldpi_en.png`,
      back: `${base}templates/back_ldpi_en.png`,
      width: 1536,
      height: 1024,
    },
    10: {
      front: `${base}templates/front_ldpi_en.png`,
      back: `${base}templates/back_ldpi_en.png`,
      width: 1536,
      height: 1024,
    },
  },
  de: {
    1: {
      front: `${base}templates/front_hdpi_de.webp`,
      back: `${base}templates/back_hdpi_de.webp`,
      width: 6144,
      height: 3200,
    },
    5: {
      front: `${base}templates/front_hdpi_de.webp`,
      back: `${base}templates/back_hdpi_de.webp`,
      width: 6144,
      height: 3200,
    },
    10: {
      front: `${base}templates/front_hdpi_de.webp`,
      back: `${base}templates/back_hdpi_de.webp`,
      width: 6144,
      height: 3200,
    },
  },
};

// Layout coordinates for low-DPI English templates (1536x1024)
export const LAYOUT_LDPI: { front: TemplateLayout; back: TemplateLayout } = {
  front: {
    portrait: {
      x: 768,
      y: 490,
      radiusX: 236,
      radiusY: 258,
    },
    namePlate: {
      x: 768,
      y: 848,
      fontSize: 36,
      maxWidth: 380,
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
      x: 768,
      y: 832,
      fontSize: 36,
      maxWidth: 380,
      align: 'center',
    },
    contactInfo: {
      x: 380,
      y: 500,
      fontSize: 38,
      lineHeight: 55,
      align: 'center',
    },
    description: {
      x: 1150,
      y: 500,
      fontSize: 38,
      maxWidth: 480,
      lineHeight: 42,
      align: 'center',
    },
  },
};

// Layout coordinates for high-DPI German templates (6144x4096)
export const LAYOUT_HDPI: { front: TemplateLayout; back: TemplateLayout } = {
  front: {
    portrait: {
      x: 3074,
      y: 1530,
      radiusX: 942,
      radiusY: 1020,
    },
    namePlate: {
      x: 3072,
      y: 2950,
      fontSize: 144,
      maxWidth: 1520,
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
      x: 3072,
      y: 2930,
      fontSize: 144,
      maxWidth: 1520,
      align: 'center',
    },
    contactInfo: {
      x: 1520,
      y: 1680,
      fontSize: 160,
      lineHeight: 280,
      align: 'center',
    },
    description: {
      x: 4600,
      y: 1680,
      fontSize: 145,
      maxWidth: 2000,
      lineHeight: 210,
      align: 'center',
    },
  },
};

export function getLayout(language: Language): { front: TemplateLayout; back: TemplateLayout } {
  return language === 'de' ? LAYOUT_HDPI : LAYOUT_LDPI;
}

export function getTemplate(language: Language, hours: HourValue): TemplateConfig {
  return TEMPLATES[language][hours];
}

// Preview scale factor for faster rendering (1 = full res, 0.25 = quarter res)
export const PREVIEW_SCALE = 0.25;

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
  });

  return {
    front: scaleLayout(layout.front),
    back: scaleLayout(layout.back),
  };
}

// Get scaled template dimensions for preview
export function getPreviewTemplate(language: Language, hours: HourValue): TemplateConfig {
  const template = TEMPLATES[language][hours];
  return {
    ...template,
    width: Math.round(template.width * PREVIEW_SCALE),
    height: Math.round(template.height * PREVIEW_SCALE),
  };
}
