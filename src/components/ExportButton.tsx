import { useBillStore } from '../stores/billStore';
import { t, formatDescription } from '../constants/translations';
import { getTemplate, getLayout } from '../constants/templates';
import { exportBillAsPDF } from '../services/pdfGenerator';

export function ExportButton() {
  const language = useBillStore((state) => state.voucherConfig.language);
  const hours = useBillStore((state) => state.voucherConfig.hours);
  const description = useBillStore((state) => state.voucherConfig.description);
  const personalInfo = useBillStore((state) => state.personalInfo);
  const portrait = useBillStore((state) => state.portrait);
  const isExporting = useBillStore((state) => state.isExporting);
  const setIsExporting = useBillStore((state) => state.setIsExporting);

  const trans = t(language);

  const template = getTemplate(language, hours);
  const layout = getLayout(language);

  const currentPortrait =
    portrait.useEnhanced && portrait.enhanced ? portrait.enhanced : portrait.original;

  const displayDescription = formatDescription(language, hours, description);

  const canExport =
    personalInfo.name.trim().length > 0 &&
    personalInfo.email.trim().length > 0 &&
    personalInfo.phone.trim().length > 0 &&
    portrait.original !== null;

  const handleExport = async () => {
    if (!canExport || isExporting) return;

    setIsExporting(true);

    try {
      const filename = `zeitgutschein-${hours}h-${personalInfo.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;

      await exportBillAsPDF({
        frontTemplateSrc: template.front,
        backTemplateSrc: template.back,
        templateWidth: template.width,
        templateHeight: template.height,
        layout,
        portrait: currentPortrait,
        portraitZoom: portrait.zoom,
        name: personalInfo.name,
        email: personalInfo.email,
        phone: personalInfo.phone,
        description: displayDescription,
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
      className={`btn btn-primary flex-1 ${isExporting ? 'loading' : ''}`}
      onClick={handleExport}
      disabled={!canExport || isExporting}
    >
      {isExporting ? (
        <>
          <span className="loading loading-spinner loading-sm"></span>
          {trans.export.exporting}
        </>
      ) : (
        <>
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
          {trans.export.button}
        </>
      )}
    </button>
  );
}
