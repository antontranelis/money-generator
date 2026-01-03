import { Header } from './components/layout/Header';
import { PersonalInfoForm } from './components/PersonalInfoForm';
import { PortraitUpload } from './components/PortraitUpload';
import { VoucherConfig } from './components/VoucherConfig';
import { BillPreview } from './components/BillPreview';
import { ExportButton } from './components/ExportButton';
import { LanguageToggle } from './components/LanguageToggle';
import { useBillStore } from './stores/billStore';
import { t } from './constants/translations';

function App() {
  const appLanguage = useBillStore((state) => state.appLanguage);
  const trans = t(appLanguage);

  return (
    <div className="min-h-screen bg-base-200">
      <Header />

      <main className="container mx-auto p-4 max-w-6xl">
        {/* Language Toggle */}
        <div className="flex justify-end mb-4">
          <LanguageToggle />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Personal Info Card */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">
                  {appLanguage === 'de' ? 'Persönliche Daten' : 'Personal Information'}
                </h2>
                <PersonalInfoForm />
              </div>
            </div>

            {/* Portrait Card */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">
                  {appLanguage === 'de' ? 'Portrait' : 'Portrait'}
                </h2>
                <PortraitUpload />
              </div>
            </div>

            {/* Voucher Config Card (includes Bill Color) */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">
                  {appLanguage === 'de' ? 'Gutschein-Einstellungen' : 'Voucher Settings'}
                </h2>
                <VoucherConfig />
              </div>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">
                  {trans.preview.front} / {trans.preview.back}
                </h2>
                <BillPreview />

                {/* Export Button - directly under preview */}
                <div className="mt-4">
                  <ExportButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
