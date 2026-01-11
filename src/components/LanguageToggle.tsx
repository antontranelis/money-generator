import { useBillStore } from '../stores/billStore';
import type { Language } from '../types/bill';

export function LanguageToggle() {
  const appLanguage = useBillStore((state) => state.appLanguage);
  const setAppLanguage = useBillStore((state) => state.setAppLanguage);

  const handleChange = (lang: Language) => {
    setAppLanguage(lang);
  };

  return (
    <div className="join">
      <button
        className={`join-item btn btn-sm ${appLanguage === 'de' ? 'btn-primary' : 'btn-ghost'}`}
        onClick={() => handleChange('de')}
      >
        DE
      </button>
      <button
        className={`join-item btn btn-sm ${appLanguage === 'en' ? 'btn-primary' : 'btn-ghost'}`}
        onClick={() => handleChange('en')}
      >
        EN
      </button>
    </div>
  );
}
