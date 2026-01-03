import { Header } from './components/layout/Header';
import { PersonalInfoForm } from './components/PersonalInfoForm';
import { PortraitUpload } from './components/PortraitUpload';
import { VoucherConfig } from './components/VoucherConfig';
import { BillPreview } from './components/BillPreview';
import { ExportButton } from './components/ExportButton';
import { LanguageToggle } from './components/LanguageToggle';
import { useBillStore } from './stores/billStore';
import { t } from './constants/translations';
import type { Language } from './types/bill';

function BillColorCard({ language }: { language: Language }) {
  const templateHue = useBillStore((state) => state.voucherConfig.templateHue);
  const setTemplateHue = useBillStore((state) => state.setTemplateHue);
  const trans = t(language);

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">{trans.form.billColor.title}</h2>
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">{trans.form.billColor.label}</span>
            <span className="label-text-alt">{templateHue}°</span>
          </label>
          <input
            type="range"
            min="0"
            max="360"
            value={templateHue}
            onChange={(e) => setTemplateHue(Number(e.target.value))}
            className="range range-primary"
            style={{
              background: `linear-gradient(to right,
                hsl(0, 70%, 50%),
                hsl(60, 70%, 50%),
                hsl(120, 70%, 50%),
                hsl(180, 70%, 50%),
                hsl(240, 70%, 50%),
                hsl(300, 70%, 50%),
                hsl(360, 70%, 50%))`,
            }}
          />
          <div className="flex justify-between text-xs px-1 mt-1 opacity-60">
            <span>0°</span>
            <span>90°</span>
            <span>180°</span>
            <span>270°</span>
            <span>360°</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const language = useBillStore((state) => state.voucherConfig.language);
  const trans = t(language);

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
                  {language === 'de' ? 'Persönliche Daten' : 'Personal Information'}
                </h2>
                <PersonalInfoForm />
              </div>
            </div>

            {/* Portrait Card */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">
                  {language === 'de' ? 'Portrait' : 'Portrait'}
                </h2>
                <PortraitUpload />
              </div>
            </div>

            {/* Voucher Config Card */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">
                  {language === 'de' ? 'Gutschein-Einstellungen' : 'Voucher Settings'}
                </h2>
                <VoucherConfig />
              </div>
            </div>

            {/* Bill Color Card */}
            <BillColorCard language={language} />
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
