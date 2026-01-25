import { useEffect, useState } from 'react';
import { useBillStore } from '../stores/billStore';
import { t, formatDescription } from '../constants/translations';
import { getTemplateByIdV2 } from '../templates';
import { renderTemplateToDataUrl } from '../templates/genericRenderer';
import { exportBillAsPdfV2 } from '../services/pdfGeneratorV2';
import type { TemplateV2 } from '../templates/schema';

// Helper to load portrait image from data URL
async function loadPortraitImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export function ExportButton() {
  const appLanguage = useBillStore((state) => state.appLanguage);
  const billLanguage = useBillStore((state) => state.voucherConfig.language);
  const hours = useBillStore((state) => state.voucherConfig.hours);
  const description = useBillStore((state) => state.voucherConfig.description);
  const templateHue = useBillStore((state) => state.voucherConfig.templateHue);
  const templateId = useBillStore((state) => state.voucherConfig.templateId);
  const personalInfo = useBillStore((state) => state.personalInfo);
  const portrait = useBillStore((state) => state.portrait);
  const isExporting = useBillStore((state) => state.isExporting);
  const setIsExporting = useBillStore((state) => state.setIsExporting);

  const trans = t(appLanguage);

  // Load V2 template
  const [templateV2, setTemplateV2] = useState<TemplateV2 | null>(null);
  const [isTemplateLoading, setIsTemplateLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsTemplateLoading(true);

    async function loadTemplate() {
      try {
        const idToLoad = templateId || 'classic-time-voucher';
        const template = await getTemplateByIdV2(idToLoad);
        if (!cancelled) {
          setTemplateV2(template);
          setIsTemplateLoading(false);
        }
      } catch (err) {
        console.error('[ExportButton] Failed to load template:', err);
        if (!cancelled) {
          setIsTemplateLoading(false);
        }
      }
    }
    loadTemplate();

    return () => { cancelled = true; };
  }, [templateId]);

  // Use rawImage as fallback while portrait.original is being recomputed after reload
  const currentPortrait =
    portrait.useEnhanced && portrait.enhanced ? portrait.enhanced : (portrait.original || portrait.rawImage);

  const displayDescription = formatDescription(billLanguage, hours, description);

  // Check if template requires portrait based on portraitEditing features
  const templateRequiresPortrait = templateV2?.features?.portraitEditing
    ? Object.values(templateV2.features.portraitEditing).some(v => v === true)
    : true; // Default to requiring portrait for backwards compatibility

  // Check which fields are required by the template
  const isFieldRequired = (fieldId: string): boolean => {
    if (!templateV2?.schema?.fields) return true; // Default to required for backwards compatibility
    const field = templateV2.schema.fields.find(f => f.id === fieldId);
    return field?.required ?? true;
  };

  // Allow export if all required fields are filled and template is loaded
  const hasPortrait = portrait.original !== null || portrait.rawImage !== null;
  const portraitValid = !templateRequiresPortrait || hasPortrait;
  const nameValid = !isFieldRequired('name') || personalInfo.name.trim().length > 0;
  const emailValid = !isFieldRequired('email') || personalInfo.email.trim().length > 0;
  const phoneValid = !isFieldRequired('phone') || personalInfo.phone.trim().length > 0;

  // Can export only when template is loaded and all required fields are valid
  const canExport =
    !isTemplateLoading &&
    templateV2 !== null &&
    nameValid &&
    emailValid &&
    phoneValid &&
    portraitValid;

  const handleExport = async () => {
    if (!canExport || isExporting || !templateV2) return;

    setIsExporting(true);

    try {
      // Load portrait image
      let portraitImage: HTMLImageElement | null = null;
      if (currentPortrait) {
        portraitImage = await loadPortraitImage(currentPortrait);
      }

      // Build render data from store
      const renderData: Record<string, unknown> = {
        name: personalInfo.name,
        hours: hours,
        email: personalInfo.email,
        phone: personalInfo.phone,
        description: displayDescription,
      };

      // Render options for full resolution (scale = 1)
      const renderOptions = {
        scale: 1,
        hue: templateHue,
        language: billLanguage,
        portraitImage,
        portraitTransform: {
          scale: portrait.zoom,
          offsetX: portrait.panX,
          offsetY: portrait.panY,
        },
      };

      // Render both sides at full resolution using V2 renderer
      const [frontDataUrl, backDataUrl] = await Promise.all([
        renderTemplateToDataUrl(templateV2, renderData, 'front', renderOptions),
        renderTemplateToDataUrl(templateV2, renderData, 'back', renderOptions),
      ]);

      const filename = `zeitgutschein-${hours}h-${personalInfo.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;

      // Export using V2 PDF generator
      await exportBillAsPdfV2({
        frontImageDataUrl: frontDataUrl,
        backImageDataUrl: backDataUrl,
        templateWidth: templateV2.layout.dimensions.width,
        templateHeight: templateV2.layout.dimensions.height,
        filename,
      });
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      className={`btn btn-primary w-full btn-md ${!canExport ? 'btn-disabled' : ''}`}
      onClick={handleExport}
      disabled={!canExport}
      aria-busy={isExporting || isTemplateLoading}
    >
      {isExporting || isTemplateLoading ? (
        <span className="loading loading-spinner loading-sm"></span>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      )}
      {trans.export.button}
    </button>
  );
}
