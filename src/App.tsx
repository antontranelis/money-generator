import { useRef, useState } from 'react';
import { Header } from './components/layout/Header';
import { PersonalInfoForm } from './components/PersonalInfoForm';
import { PortraitUpload } from './components/PortraitUpload';
import { VoucherConfig } from './components/VoucherConfig';
import { BillPreview } from './components/BillPreview';
import { ExportButton } from './components/ExportButton';
import { useBillStore } from './stores/billStore';

function App() {
  const appLanguage = useBillStore((state) => state.appLanguage);
  const currentSide = useBillStore((state) => state.currentSide);
  const portrait = useBillStore((state) => state.portrait);
  const personalInfo = useBillStore((state) => state.personalInfo);
  const flipSide = useBillStore((state) => state.flipSide);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasVisitedBack, setHasVisitedBack] = useState(false);

  // Track when user visits back side
  if (currentSide === 'back' && !hasVisitedBack) {
    setHasVisitedBack(true);
  }

  // Handle click on empty portrait area in preview
  const handlePortraitClick = () => {
    fileInputRef.current?.click();
  };

  // Process image file (shared by file input and drag-drop)
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;

    const { resizeImage } = await import('./services/imageEffects');
    const { useBillStore } = await import('./stores/billStore');
    const store = useBillStore.getState();

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUrl = evt.target?.result as string;
      const resizedImage = await resizeImage(dataUrl);
      store.setPortraitRawImage(resizedImage);
      store.setPortrait(resizedImage);
      store.setPortraitBgRemoved(false, null);
      store.setPortraitEngravingIntensity(0);
    };
    reader.readAsDataURL(file);
  };

  // Handle file selection from hidden input
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processImageFile(file);
    }
    e.target.value = '';
  };

  // Handle file drop on portrait area
  const handleFileDrop = async (file: File) => {
    await processImageFile(file);
  };

  // Build instruction list
  const instructions: { text: string; action?: () => void }[] = [];

  if (!portrait.original) {
    instructions.push({
      text: appLanguage === 'de' ? 'Lade ein Bild hoch' : 'Upload a photo',
    });
  }

  if (portrait.original && !hasVisitedBack) {
    instructions.push({
      text: appLanguage === 'de' ? 'Gestalte die Rückseite' : 'Design the back side',
      action: () => flipSide(),
    });
  }

  if (!personalInfo.name.trim()) {
    instructions.push({
      text: appLanguage === 'de' ? 'Füge deinen Namen ein' : 'Add your name',
    });
  }

  if (!personalInfo.email.trim() || !personalInfo.phone.trim()) {
    instructions.push({
      text: appLanguage === 'de' ? 'Füge Email und Telefon ein' : 'Add email and phone',
    });
  }

  const isComplete = instructions.length === 0;

  return (
    <div className="min-h-screen bg-base-200">
      <Header />

      {/* Hidden file input for portrait upload via preview click */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <main className="container mx-auto p-4 max-w-2xl">
        {/* Voucher Settings - compact bar */}
        <div className="card bg-base-100 shadow-xl mb-4">
          <div className="card-body py-4">
            <VoucherConfig />
          </div>
        </div>

        {/* Main Configurator */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            {/* Preview with integrated portrait click and drag-drop */}
            <BillPreview onPortraitClick={handlePortraitClick} onFileDrop={handleFileDrop} />

            {/* Contextual Controls */}
            <div className="mt-4 pt-4 border-t border-base-300">
              {currentSide === 'front' ? (
                portrait.original ? (
                  <PortraitUpload />
                ) : null
              ) : (
                <PersonalInfoForm />
              )}
            </div>

            {/* Actions / Instructions */}
            <div className="mt-4 pt-4 border-t border-base-300">
              {isComplete ? (
                <ExportButton />
              ) : (
                <div className="space-y-2">
                  {instructions.map((instruction, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        instruction.action
                          ? 'bg-primary/10 cursor-pointer hover:bg-primary/20'
                          : 'bg-base-200'
                      }`}
                      onClick={instruction.action}
                    >
                      <span className="text-lg">
                        {i === 0 && !portrait.original && '📷'}
                        {instruction.action && '✏️'}
                        {!instruction.action && portrait.original && !personalInfo.name.trim() && '👤'}
                        {!instruction.action && portrait.original && personalInfo.name.trim() && '📧'}
                      </span>
                      <span className={instruction.action ? 'font-medium' : ''}>
                        {instruction.text}
                      </span>
                      {instruction.action && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 ml-auto"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
