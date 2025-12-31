import type { Template, TemplateProvider } from './types';
import { staticTemplateProvider, getDefaultTemplateId } from './staticProvider';

// Export types
export type { Template, TemplateProvider, TemplateField, FieldPosition } from './types';

// Export static provider
export { staticTemplateProvider, getDefaultTemplateId };

/**
 * Current template provider
 * Defaults to static provider, can be changed via setTemplateProvider
 */
let currentProvider: TemplateProvider = staticTemplateProvider;

/**
 * Set a custom template provider
 * Use this to switch to a CMS-based provider or other source
 *
 * @example
 * // Switch to a CMS provider
 * import { createCmsProvider, setTemplateProvider } from 'money-printer/templates';
 * setTemplateProvider(createCmsProvider('https://cms.example.com/api'));
 */
export function setTemplateProvider(provider: TemplateProvider): void {
  currentProvider = provider;
}

/**
 * Get the current template provider
 */
export function getTemplateProvider(): TemplateProvider {
  return currentProvider;
}

/**
 * List available templates
 */
export async function listTemplates(filter?: {
  type?: string;
  category?: string;
  language?: 'de' | 'en';
}): Promise<Template[]> {
  return currentProvider.listTemplates(filter);
}

/**
 * Get a specific template by ID
 */
export async function getTemplateById(templateId: string): Promise<Template> {
  return currentProvider.getTemplate(templateId);
}