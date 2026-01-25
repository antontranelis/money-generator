import { useEffect, useState } from 'react';
import { Header, type AppView } from './components/layout/Header';
import { VoucherEditor } from './components/VoucherEditor';
import { SpiritualPromptGenerator } from './components/SpiritualPromptGenerator';
import { SpiritualPromptPreview } from './components/SpiritualPromptPreview';
import { initializeBillStore } from './stores/billStore';
import { initializeSpiritualPromptStore } from './stores/spiritualPromptStore';
import { initializeGeminiStore } from './stores/geminiStore';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('voucher');

  // Initialize store hydration from IndexedDB
  useEffect(() => {
    initializeBillStore();
    initializeSpiritualPromptStore();
    initializeGeminiStore();
  }, []);

  return (
    <div className="h-dvh flex flex-col bg-base-200">
      <Header currentView={currentView} onViewChange={setCurrentView} />

      <main className="flex-1 overflow-y-auto">
        {currentView === 'voucher' ? (
          <VoucherEditor />
        ) : (
          <div className="container mx-auto p-4 max-w-5xl">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Left column: Configuration */}
              <div className="flex-1 lg:max-w-[50%]">
                <SpiritualPromptGenerator />
              </div>

              {/* Right column: Preview */}
              <div className="lg:w-[50%]">
                <div className="lg:sticky lg:top-4">
                  <SpiritualPromptPreview />
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
