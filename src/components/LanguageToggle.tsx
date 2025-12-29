import { useBillStore } from '../stores/billStore';
import type { Language } from '../types/bill';

export function LanguageToggle() {
  const language = useBillStore((state) => state.voucherConfig.language);
  const setLanguage = useBillStore((state) => state.setLanguage);

  const handleChange = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <div className="join">
      <button
        className={`join-item btn btn-sm ${language === 'de' ? 'btn-active btn-primary' : 'btn-ghost'}`}
        onClick={() => handleChange('de')}
      >
        DE
      </button>
      <button
        className={`join-item btn btn-sm ${language === 'en' ? 'btn-active btn-primary' : 'btn-ghost'}`}
        onClick={() => handleChange('en')}
      >
        EN
      </button>
    </div>
  );
}
