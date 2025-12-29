import type { Language, HourValue, TemplateConfig, TemplateLayout } from '../types/bill';

type TemplateMap = Record<Language, Record<HourValue, TemplateConfig>>;

const base = import.meta.env.BASE_URL;

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
      front: `${base}templates/front_hdpi_de.jpg`,
      back: `${base}templates/back_hdpi_de.jpg`,
      width: 6144,
      height: 4096,
    },
    5: {
      front: `${base}templates/front_hdpi_de.jpg`,
      back: `${base}templates/back_hdpi_de.jpg`,
      width: 6144,
      height: 4096,
    },
    10: {
      front: `${base}templates/front_hdpi_de.jpg`,
      back: `${base}templates/back_hdpi_de.jpg`,
      width: 6144,
      height: 4096,
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
      x: 3072,
      y: 1970,
      radiusX: 945,
      radiusY: 1020,
    },
    namePlate: {
      x: 3072,
      y: 3390,
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
      y: 3360,
      fontSize: 144,
      maxWidth: 1520,
      align: 'center',
    },
    contactInfo: {
      x: 1520,
      y: 2000,
      fontSize: 160,
      lineHeight: 280,
      align: 'center',
    },
    description: {
      x: 4600,
      y: 2000,
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
