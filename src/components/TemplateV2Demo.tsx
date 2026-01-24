/**
 * Template-Auswahl Komponente
 *
 * Diese Komponente:
 * 1. Lädt verfügbare Templates über den templateLoader
 * 2. Zeigt die Template-Metadaten an
 * 3. Ermöglicht die Auswahl zwischen Templates
 *
 * Die Vorschau erfolgt direkt im BillPreview.
 */

import { useEffect, useState } from 'react';
import { listTemplatesV2, getTemplateByIdV2 } from '../templates';
import { clearRendererCache } from '../templates/genericRenderer';
import { useBillStore } from '../stores/billStore';
import type { TemplateV2 } from '../templates/schema';

export function TemplateV2Demo() {
  const [templates, setTemplates] = useState<TemplateV2[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Connect to BillStore
  const templateId = useBillStore((state) => state.voucherConfig.templateId);
  const setTemplateId = useBillStore((state) => state.setTemplateId);

  // Lade verfügbare Templates (nur einmal beim Mount)
  useEffect(() => {
    async function loadTemplates() {
      try {
        setLoading(true);
        const list = await listTemplatesV2();
        setTemplates(list);

        // Load initial template from store or first available
        const idToLoad = templateId || (list.length > 0 ? list[0].id : null);
        if (idToLoad) {
          const template = await getTemplateByIdV2(idToLoad);
          setSelectedTemplate(template);
        }
      } catch (e) {
        console.error('[TemplateV2Demo] Error loading templates:', e);
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-base-content/60">
        <span className="loading loading-spinner loading-xs"></span>
        <span>Templates laden...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-error">
        Fehler: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Template-Auswahl */}
      <div className="flex gap-2">
        <select
          className="select select-bordered select-primary flex-1"
          value={selectedTemplate?.id || ''}
          onChange={async (e) => {
            const newId = e.target.value;
            try {
              // Clear image cache to ensure fresh assets are loaded
              clearRendererCache();
              // Load the new template
              const template = await getTemplateByIdV2(newId);
              // Update local state first for immediate UI update
              setSelectedTemplate(template);
              // Then update store for persistence
              setTemplateId(newId);
            } catch (err) {
              console.error('[TemplateV2Demo] Failed to load template:', err);
              setError(err instanceof Error ? err.message : 'Failed to load template');
            }
          }}
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Template Info */}
      {selectedTemplate && (
        <div className="text-sm space-y-1">
          <p>
            <strong>ID:</strong> {selectedTemplate.id}
          </p>
          <p>
            <strong>Version:</strong> {selectedTemplate.version}
          </p>
          <p>
            <strong>Type:</strong> {selectedTemplate.type}
          </p>
          <p>
            <strong>Fields:</strong>{' '}
            {selectedTemplate.schema.fields.map((f) => f.id).join(', ')}
          </p>
          <p>
            <strong>Dimensions:</strong> {selectedTemplate.layout.dimensions.width}x
            {selectedTemplate.layout.dimensions.height}
          </p>
        </div>
      )}
    </div>
  );
}
