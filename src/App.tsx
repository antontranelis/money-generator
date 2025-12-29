import { Header } from './components/layout/Header';
import { BillForm } from './components/BillForm';
import { BillPreview } from './components/BillPreview';
import { ExportButton } from './components/ExportButton';
import { useBillStore } from './stores/billStore';
import { t } from './constants/translations';

function App() {
  const language = useBillStore((state) => state.voucherConfig.language);
  const trans = t(language);

  return (
    <div className="min-h-screen bg-base-200">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div className="space-y-6">
            <BillForm />
            <ExportButton />
          </div>

          {/* Right: Preview */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title font-currency text-currency-green">
                  {trans.preview.front} / {trans.preview.back}
                </h2>
                <BillPreview />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
