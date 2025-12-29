import { useState } from 'react';
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

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const trans = t(language);

  const template = getTemplate(language, hours);
  const layout = getLayout(language);

  const currentPortrait =
    portrait.useEnhanced && portrait.enhanced ? portrait.enhanced : portrait.original;

  const displayDescription = formatDescription(language, hours, description);

  const canExport = personalInfo.name.trim().length > 0;

  const handleExport = async () => {
    if (!canExport || isExporting) return;

    setError(null);
    setSuccess(false);
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

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('PDF export failed:', err);
      setError('PDF export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        className={`btn btn-primary btn-lg w-full ${isExporting ? 'loading' : ''}`}
        onClick={handleExport}
        disabled={!canExport || isExporting}
      >
        {isExporting ? (
          <>
            <span className="loading loading-spinner"></span>
            {trans.export.exporting}
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-2"
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

      {!canExport && (
        <p className="text-sm text-warning text-center">
          {language === 'de' ? 'Bitte gib deinen Namen ein' : 'Please enter your name'}
        </p>
      )}

      {error && (
        <div className="alert alert-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{trans.export.success}</span>
        </div>
      )}
    </div>
  );
}
