import { useBillStore } from '../../stores/billStore';
import { t } from '../../constants/translations';
import { LanguageToggle } from '../LanguageToggle';

export function Header() {
  const language = useBillStore((state) => state.voucherConfig.language);
  const trans = t(language);

  return (
    <header className="navbar bg-currency-green text-currency-cream shadow-lg">
      <div className="container mx-auto">
        <div className="flex-1">
          <h1 className="text-2xl font-currency font-bold">{trans.header.title}</h1>
          <p className="text-sm opacity-80 ml-4 hidden sm:block">{trans.header.subtitle}</p>
        </div>
        <div className="flex-none">
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
