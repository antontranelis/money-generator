import { useCallback, useEffect, useRef, useState } from 'react';
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
  const setCurrentSide = useBillStore((state) => state.setCurrentSide);
  const reset = useBillStore((state) => state.reset);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editAreaRef = useRef<HTMLDivElement>(null);
  const previewCardRef = useRef<HTMLDivElement>(null);
  const [focusField, setFocusField] = useState<'name' | 'email' | 'phone' | null>(null);
  const [editAreaExpanded, setEditAreaExpanded] = useState(true);

  // Toggle edit area and scroll preview card to top when opening
  const toggleEditArea = useCallback(() => {
    const willExpand = !editAreaExpanded;
    setEditAreaExpanded(willExpand);
    if (willExpand) {
      setTimeout(() => {
        // Scroll the preview card to the top of the viewport
        previewCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 350); // Wait for animation to complete
    }
  }, [editAreaExpanded]);

  // Handle clicking on a personal info instruction
  const handleFocusField = useCallback((field: 'name' | 'email' | 'phone') => {
    if (currentSide !== 'back') {
      setCurrentSide('back');
    }
    setFocusField(field);
  }, [currentSide, setCurrentSide]);

  const handleFocused = useCallback(() => {
    setFocusField(null);
  }, []);

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

  // Validation helpers
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone: string) => phone.replace(/\D/g, '').length >= 6;

  // Build checklist with completed and pending items
  const checklistItems: { text: string; completed: boolean; action?: () => void }[] = [];

  // Photo upload
  checklistItems.push({
    text: appLanguage === 'de' ? 'Foto hochladen' : 'Upload photo',
    completed: !!portrait.original,
    action: !portrait.original ? () => {
      if (currentSide !== 'front') {
        setCurrentSide('front');
      }
      fileInputRef.current?.click();
    } : undefined,
  });

  // Name
  const nameValid = !!personalInfo.name.trim();
  checklistItems.push({
    text: appLanguage === 'de' ? 'Namen eingeben' : 'Enter name',
    completed: nameValid,
    action: !nameValid ? () => handleFocusField('name') : undefined,
  });

  // Email - must be valid format
  const emailValid = !!personalInfo.email.trim() && isValidEmail(personalInfo.email);
  checklistItems.push({
    text: appLanguage === 'de' ? 'Email eingeben' : 'Enter email',
    completed: emailValid,
    action: !emailValid ? () => handleFocusField('email') : undefined,
  });

  // Phone - must have at least 6 digits
  const phoneValid = !!personalInfo.phone.trim() && isValidPhone(personalInfo.phone);
  checklistItems.push({
    text: appLanguage === 'de' ? 'Telefonnummer eingeben' : 'Enter phone number',
    completed: phoneValid,
    action: !phoneValid ? () => handleFocusField('phone') : undefined,
  });

  // Check if all fields for current side are complete
  const frontComplete = !!portrait.original;
  const backComplete = nameValid && emailValid && phoneValid;

  // Auto-collapse when all fields for current side are complete
  useEffect(() => {
    if (currentSide === 'front' && frontComplete && editAreaExpanded) {
      setEditAreaExpanded(false);
    } else if (currentSide === 'back' && backComplete && editAreaExpanded) {
      setEditAreaExpanded(false);
    }
  }, [currentSide, frontComplete, backComplete]);

  // Scroll preview card to top when switching sides or uploading image (if form is visible)
  useEffect(() => {
    if (previewCardRef.current && !(frontComplete && backComplete && !editAreaExpanded)) {
      setTimeout(() => {
        previewCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 350);
    }
  }, [currentSide, portrait.original]);

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

      <main className="container mx-auto p-4 max-w-5xl">
        {/* Two-column layout on desktop */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left column: Settings + Preview */}
          <div className="flex-1 lg:max-w-[65%] space-y-4">
            {/* Voucher Settings */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <VoucherConfig />
              </div>
            </div>

            {/* Preview Card */}
            <div ref={previewCardRef} className="card bg-base-100 shadow-xl scroll-mt-4">
              <div className="card-body">
                <BillPreview onPortraitClick={handlePortraitClick} onFileDrop={handleFileDrop} />

                {/* Contextual Controls - below preview */}
                {(currentSide === 'back' || portrait.original) && (
                  <div>
                    {/* Content - collapsible only when all fields are complete */}
                    <div
                      ref={editAreaRef}
                      className="overflow-hidden transition-all duration-500 ease-out"
                      style={{
                        maxHeight: (frontComplete && backComplete && !editAreaExpanded) ? '0' : '500px',
                        opacity: (frontComplete && backComplete && !editAreaExpanded) ? 0 : 1,
                      }}
                    >
                      <div className="pt-4 pb-4">
                        {currentSide === 'front' ? (
                          <PortraitUpload />
                        ) : (
                          <PersonalInfoForm focusField={focusField} onFocused={handleFocused} />
                        )}
                      </div>
                    </div>
                    {/* Action buttons */}
                    {frontComplete && backComplete ? (
                      <div className="flex justify-between items-center pt-4">
                        <button
                          className="btn btn-ghost text-error"
                          onClick={reset}
                        >
                          {appLanguage === 'de' ? 'Zurücksetzen' : 'Reset'}
                        </button>
                        <button
                          className="btn"
                          onClick={toggleEditArea}
                        >
                          {editAreaExpanded ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          )}
                          {editAreaExpanded
                            ? (appLanguage === 'de' ? 'Fertig' : 'Done')
                            : (appLanguage === 'de' ? 'Bearbeiten' : 'Edit')
                          }
                        </button>
                      </div>
                    ) : frontComplete && !backComplete && currentSide === 'front' && (
                      <div className="flex justify-end pt-4">
                        <button
                          className="btn"
                          onClick={() => setCurrentSide('back')}
                        >
                          {appLanguage === 'de' ? 'Weiter' : 'Continue'}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
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
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column: Checklist */}
          <div className="lg:w-[35%]">
            <div className="lg:sticky lg:top-4 card bg-base-100 shadow-xl">
              <div className="card-body">
                {checklistItems.some(item => !item.completed) && (
                  <div className="space-y-1 mb-4">
                    {[...checklistItems].sort((a, b) => (b.completed ? 1 : 0) - (a.completed ? 1 : 0)).map((item, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                          item.completed
                            ? ''
                            : 'cursor-pointer hover:bg-base-200'
                        }`}
                        onClick={item.action}
                      >
                        {/* Checkbox */}
                        {item.completed ? (
                          <div className="w-5 h-5 rounded border-2 border-success bg-success flex items-center justify-center shrink-0">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3 text-success-content"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded border-2 border-base-content/30 shrink-0" />
                        )}
                        <span className="flex-1">
                          {item.text}
                        </span>
                        {!item.completed && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-base-content/40"
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
                <ExportButton />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
