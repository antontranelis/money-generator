import { useBillStore } from '../../stores/billStore';
import { t } from '../../constants/translations';
import { LanguageToggle } from '../LanguageToggle';

export function Header() {
  const language = useBillStore((state) => state.voucherConfig.language);
  const trans = t(language);

  return (
    <div className="navbar bg-currency-green text-currency-cream shadow-lg">
      <div className="navbar-start">
        <a className="btn btn-ghost text-xl font-currency font-bold">{trans.header.title}</a>
      </div>
      <div className="navbar-center hidden sm:flex">
        <span className="text-sm opacity-80">{trans.header.subtitle}</span>
      </div>
      <div className="navbar-end">
        <LanguageToggle />
      </div>
    </div>
  );
}
