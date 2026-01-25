import { useEffect, useState } from 'react';
import { Header, type AppView } from './components/layout/Header';
import { VoucherEditor } from './components/VoucherEditor';
import { PrintGenerator } from './components/printGenerator';
import { SpiritualPromptPreview } from './components/SpiritualPromptPreview';
import { initializeBillStore } from './stores/billStore';
import { initializeSpiritualPromptStore } from './stores/spiritualPromptStore';
import { initializeGeminiStore } from './stores/geminiStore';
import { initializePrintGeneratorStore } from './stores/printGeneratorStore';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('voucher');
  // Track if prompt-generator was ever visited to avoid unmounting after first visit
  const [hasVisitedGenerator, setHasVisitedGenerator] = useState(false);

  // Initialize store hydration from IndexedDB
  useEffect(() => {
    initializeBillStore();
    initializeSpiritualPromptStore();
    initializeGeminiStore();
    initializePrintGeneratorStore();
  }, []);

  // Track when prompt-generator is first visited
  useEffect(() => {
    if (currentView === 'prompt-generator' && !hasVisitedGenerator) {
      setHasVisitedGenerator(true);
    }
  }, [currentView, hasVisitedGenerator]);

  return (
    <div className="h-dvh flex flex-col bg-base-200">
      <Header currentView={currentView} onViewChange={setCurrentView} />

      <main className="flex-1 overflow-y-auto">
        {/* Voucher view - always mounted */}
        <div className={currentView === 'voucher' ? '' : 'hidden'}>
          <VoucherEditor />
        </div>
        {/* Prompt generator - mounted on first visit, then kept in DOM */}
        {(currentView === 'prompt-generator' || hasVisitedGenerator) && (
          <div className={currentView === 'prompt-generator' ? '' : 'hidden'}>
            <div className="container mx-auto p-4 max-w-5xl">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Left column: Configuration */}
                <div className="flex-1 lg:max-w-[50%]">
                  <PrintGenerator />
                </div>

                {/* Right column: Preview */}
                <div className="lg:w-[50%]">
                  <div className="lg:sticky lg:top-4">
                    <SpiritualPromptPreview />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
