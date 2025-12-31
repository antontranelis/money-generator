import type { Template, TemplateProvider } from './types';
import { LAYOUT_HDPI, LAYOUT_LDPI } from '../constants/templates';

// Import template images - these will be bundled by Vite
// Using URL imports for the library build
const base = import.meta.env.BASE_URL || '/';

/**
 * German Time Voucher - High DPI (6144x4096)
 */
const TIME_VOUCHER_CLASSIC_DE: Template = {
  id: 'time-voucher-classic-de',
  name: 'Zeitgutschein Classic',
  type: 'time-voucher',
  category: 'classic',
  images: {
    front: `${base}templates/front_hdpi_de.jpg`,
    back: `${base}templates/back_hdpi_de.jpg`,
    width: 6144,
    height: 4096,
  },
  fields: [
    {
      id: 'name',
      type: 'text',
      label: { de: 'Name', en: 'Name' },
      required: true,
      validation: { minLength: 1, maxLength: 50 },
    },
    {
      id: 'hours',
      type: 'select',
      label: { de: 'Stunden', en: 'Hours' },
      required: true,
      options: ['1', '5', '10'],
    },
    {
      id: 'portrait',
      type: 'image',
      label: { de: 'Portrait', en: 'Portrait' },
      required: false,
    },
    {
      id: 'email',
      type: 'text',
      label: { de: 'E-Mail', en: 'Email' },
      required: false,
    },
    {
      id: 'phone',
      type: 'text',
      label: { de: 'Telefon', en: 'Phone' },
      required: false,
    },
    {
      id: 'description',
      type: 'textarea',
      label: { de: 'Beschreibung', en: 'Description' },
      required: false,
      validation: { maxLength: 200 },
    },
  ],
  layout: {
    front: {
      portrait: LAYOUT_HDPI.front.portrait,
      name: LAYOUT_HDPI.front.namePlate,
    },
    back: {
      name: LAYOUT_HDPI.back.namePlate,
      contactInfo: LAYOUT_HDPI.back.contactInfo!,
      description: LAYOUT_HDPI.back.description!,
    },
  },
  languages: ['de'],
};

/**
 * English Time Voucher - Low DPI (1536x1024)
 */
const TIME_VOUCHER_CLASSIC_EN: Template = {
  id: 'time-voucher-classic-en',
  name: 'Time Voucher Classic',
  type: 'time-voucher',
  category: 'classic',
  images: {
    front: `${base}templates/front_ldpi_en.png`,
    back: `${base}templates/back_ldpi_en.png`,
    width: 1536,
    height: 1024,
  },
  fields: [
    {
      id: 'name',
      type: 'text',
      label: { de: 'Name', en: 'Name' },
      required: true,
      validation: { minLength: 1, maxLength: 50 },
    },
    {
      id: 'hours',
      type: 'select',
      label: { de: 'Stunden', en: 'Hours' },
      required: true,
      options: ['1', '5', '10'],
    },
    {
      id: 'portrait',
      type: 'image',
      label: { de: 'Portrait', en: 'Portrait' },
      required: false,
    },
    {
      id: 'email',
      type: 'text',
      label: { de: 'E-Mail', en: 'Email' },
      required: false,
    },
    {
      id: 'phone',
      type: 'text',
      label: { de: 'Telefon', en: 'Phone' },
      required: false,
    },
    {
      id: 'description',
      type: 'textarea',
      label: { de: 'Beschreibung', en: 'Description' },
      required: false,
      validation: { maxLength: 200 },
    },
  ],
  layout: {
    front: {
      portrait: LAYOUT_LDPI.front.portrait,
      name: LAYOUT_LDPI.front.namePlate,
    },
    back: {
      name: LAYOUT_LDPI.back.namePlate,
      contactInfo: LAYOUT_LDPI.back.contactInfo!,
      description: LAYOUT_LDPI.back.description!,
    },
  },
  languages: ['en'],
};

// All bundled templates
const STATIC_TEMPLATES: Template[] = [
  TIME_VOUCHER_CLASSIC_DE,
  TIME_VOUCHER_CLASSIC_EN,
];

/**
 * Static template provider that uses bundled templates
 * This is the default provider for standalone app usage
 */
export const staticTemplateProvider: TemplateProvider = {
  async listTemplates(filter) {
    let templates = [...STATIC_TEMPLATES];

    if (filter?.type) {
      templates = templates.filter((t) => t.type === filter.type);
    }
    if (filter?.category) {
      templates = templates.filter((t) => t.category === filter.category);
    }
    if (filter?.language) {
      templates = templates.filter((t) => t.languages.includes(filter.language!));
    }

    return templates;
  },

  async getTemplate(id) {
    const template = STATIC_TEMPLATES.find((t) => t.id === id);
    if (!template) {
      throw new Error(`Template not found: ${id}`);
    }
    return template;
  },
};

/**
 * Get the default template for a given language
 */
export function getDefaultTemplateId(language: 'de' | 'en'): string {
  return language === 'de' ? 'time-voucher-classic-de' : 'time-voucher-classic-en';
}