import { useCallback, useEffect, useRef, useState } from 'react';
import { PersonalInfoForm } from './PersonalInfoForm';
import { PortraitUpload } from './PortraitUpload';
import { VoucherConfig } from './VoucherConfig';
import { BillPreview } from './BillPreview';
import { ExportButton } from './ExportButton';
import { TemplateV2Demo } from './TemplateV2Demo';
import { useBillStore } from '../stores/billStore';
import { templateProviderV2 } from '../templates/templateLoader';
import type { TemplateV2 } from '../templates/schema';

export function VoucherEditor() {
  const appLanguage = useBillStore((state) => state.appLanguage);
  const currentSide = useBillStore((state) => state.currentSide);
  const portrait = useBillStore((state) => state.portrait);
  const personalInfo = useBillStore((state) => state.personalInfo);
  const setCurrentSide = useBillStore((state) => state.setCurrentSide);
  const reset = useBillStore((state) => state.reset);
  const templateId = useBillStore((state) => state.voucherConfig.templateId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentTemplate, setCurrentTemplate] = useState<TemplateV2 | null>(null);
  const [isTemplateLoading, setIsTemplateLoading] = useState(true);

  // Load template when templateId changes
  useEffect(() => {
    let cancelled = false;
    setIsTemplateLoading(true);
    templateProviderV2.getTemplate(templateId).then((template) => {
      if (!cancelled) {
        setCurrentTemplate(template);
        setIsTemplateLoading(false);
      }
    }).catch((err) => {
      console.warn('Failed to load template:', err);
      if (!cancelled) {
        setCurrentTemplate(null);
        setIsTemplateLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [templateId]);

  // Check if current template requires portrait
  // While loading, assume false to avoid showing incorrect checklist items
  const templateRequiresPortrait = isTemplateLoading
    ? false
    : currentTemplate?.features?.portraitEditing
      ? Object.values(currentTemplate.features.portraitEditing).some(v => v === true)
      : true; // Default to requiring portrait for backwards compatibility
  const editAreaRef = useRef<HTMLDivElement>(null);
  const previewCardRef = useRef<HTMLDivElement>(null);
  const resetDialogRef = useRef<HTMLDialogElement>(null);
  const [focusField, setFocusField] = useState<'name' | 'email' | 'phone' | null>(null);
  const [editAreaExpanded, setEditAreaExpanded] = useState(true);
  const [isFormFocused, setIsFormFocused] = useState(false);

  // Handle reset with confirmation dialog
  const handleResetClick = useCallback(() => {
    resetDialogRef.current?.showModal();
  }, []);

  const handleResetConfirm = useCallback(() => {
    reset();
    resetDialogRef.current?.close();
  }, [reset]);

  // Toggle edit area and scroll preview card to top when opening
  const toggleEditArea = useCallback(() => {
    const willExpand = !editAreaExpanded;
    setEditAreaExpanded(willExpand);
    if (willExpand) {
      setTimeout(() => {
        previewCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 350);
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

    const { resizeImage, clearImageCache } = await import('../services/imageEffects');
    const { useBillStore } = await import('../stores/billStore');
    const store = useBillStore.getState();

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUrl = evt.target?.result as string;
      const resizedImage = await resizeImage(dataUrl);
      clearImageCache();
      store.setPortraitRawImage(resizedImage);
      store.setPortrait(resizedImage);
      store.setPortraitZoom(1);
      store.setPortraitPan(0, 0);
      store.setPortraitBgRemoved(false, null);
      store.setPortraitBgOpacity(0);
      store.setPortraitBgBlur(0);
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

  // Check which fields are required by the template
  // Returns null while template is loading to indicate "unknown"
  const isFieldRequired = (fieldId: string): boolean | null => {
    if (isTemplateLoading || !currentTemplate?.schema?.fields) return null;
    const field = currentTemplate.schema.fields.find(f => f.id === fieldId);
    return field?.required ?? true;
  };

  // Build checklist with completed and pending items
  // Only build checklist once template is loaded
  const checklistItems: { text: string; completed: boolean; action?: () => void }[] = [];

  // Photo upload - completed if we have original OR rawImage (during reload recompute)
  // Only add to checklist if template requires portrait and template is loaded
  const hasPortrait = !!portrait.original || !!portrait.rawImage;
  if (!isTemplateLoading && templateRequiresPortrait) {
    checklistItems.push({
      text: appLanguage === 'de' ? 'Foto hochladen' : 'Upload photo',
      completed: hasPortrait,
      action: !hasPortrait ? () => {
        if (currentSide !== 'front') {
          setCurrentSide('front');
        }
        fileInputRef.current?.click();
      } : undefined,
    });
  }

  // Name - check if required by template
  const nameRequired = isFieldRequired('name');
  const nameValid = nameRequired === null ? true : (!nameRequired || !!personalInfo.name.trim());
  if (nameRequired === true) {
    checklistItems.push({
      text: appLanguage === 'de' ? 'Namen eingeben' : 'Enter name',
      completed: !!personalInfo.name.trim(),
      action: !personalInfo.name.trim() ? () => handleFocusField('name') : undefined,
    });
  }

  // Email - check if required by template, must be valid format if provided
  const emailRequired = isFieldRequired('email');
  const emailFilled = !!personalInfo.email.trim() && isValidEmail(personalInfo.email);
  const emailValid = emailRequired === null ? true : (!emailRequired || emailFilled);
  if (emailRequired === true) {
    checklistItems.push({
      text: appLanguage === 'de' ? 'Email eingeben' : 'Enter email',
      completed: emailFilled,
      action: !emailFilled ? () => handleFocusField('email') : undefined,
    });
  }

  // Phone - check if required by template, must have at least 6 digits if provided
  const phoneRequired = isFieldRequired('phone');
  const phoneFilled = !!personalInfo.phone.trim() && isValidPhone(personalInfo.phone);
  const phoneValid = phoneRequired === null ? true : (!phoneRequired || phoneFilled);
  if (phoneRequired === true) {
    checklistItems.push({
      text: appLanguage === 'de' ? 'Telefonnummer eingeben' : 'Enter phone number',
      completed: phoneFilled,
      action: !phoneFilled ? () => handleFocusField('phone') : undefined,
    });
  }

  // Check if all fields for current side are complete
  // While template is loading, treat as incomplete to avoid premature navigation
  // frontComplete: either portrait is not required, or we have one
  const frontComplete = isTemplateLoading ? false : (!templateRequiresPortrait || hasPortrait);
  const backComplete = isTemplateLoading ? false : (nameValid && emailValid && phoneValid);

  // Auto-collapse only when completing fields (not on side switch)
  const prevFrontComplete = useRef(frontComplete);
  const prevBackComplete = useRef(backComplete);

  useEffect(() => {
    if (isFormFocused) {
      prevFrontComplete.current = frontComplete;
      prevBackComplete.current = backComplete;
      return;
    }
    if (currentSide === 'back' && backComplete && !prevBackComplete.current && editAreaExpanded) {
      setEditAreaExpanded(false);
    }
    prevFrontComplete.current = frontComplete;
    prevBackComplete.current = backComplete;
  }, [currentSide, frontComplete, backComplete, editAreaExpanded, isFormFocused]);

  // Scroll preview card to top when switching sides or uploading image (if form is visible)
  useEffect(() => {
    if (previewCardRef.current && !(frontComplete && backComplete && !editAreaExpanded)) {
      setTimeout(() => {
        previewCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 350);
    }
  }, [currentSide, hasPortrait]);

  return (
    <>
      {/* Hidden file input for portrait upload via preview click */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="container mx-auto p-4 max-w-5xl">
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
            <div ref={previewCardRef} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <BillPreview onPortraitClick={handlePortraitClick} onFileDrop={handleFileDrop} />

                {/* Contextual Controls - below preview */}
                {/* Show controls if: on back side, or have portrait, or template doesn't require portrait */}
                {(currentSide === 'back' || hasPortrait || !templateRequiresPortrait) && (
                  <div
                    ref={editAreaRef}
                    className="overflow-hidden transition-all duration-500 ease-out"
                    style={{
                      maxHeight: (frontComplete && backComplete && !editAreaExpanded) ? '0' : '500px',
                      opacity: (frontComplete && backComplete && !editAreaExpanded) ? 0 : 1,
                    }}
                  >
                    <div className="pt-4 pb-4 px-1">
                      {currentSide === 'front' && templateRequiresPortrait ? (
                        <PortraitUpload />
                      ) : (
                        <PersonalInfoForm focusField={focusField} onFocused={handleFocused} onFormFocusChange={setIsFormFocused} />
                      )}
                    </div>
                  </div>
                )}

                {/* Action buttons - always visible */}
                <div className="flex justify-end items-center pt-4">
                  {/* Reset button - only when inputs exist */}
                  {(hasPortrait || personalInfo.name || personalInfo.email || personalInfo.phone) && (
                    <button
                      className="btn text-error mr-auto"
                      onClick={handleResetClick}
                    >
                      {appLanguage === 'de' ? 'Zurücksetzen' : 'Reset'}
                    </button>
                  )}
                  {(() => {
                    const allComplete = frontComplete && backComplete;

                    if (allComplete && !editAreaExpanded) {
                      return (
                        <button
                          className="btn"
                          onClick={toggleEditArea}
                        >
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
                          {appLanguage === 'de' ? 'Bearbeiten' : 'Edit'}
                        </button>
                      );
                    }

                    if (currentSide === 'front' && !backComplete) {
                      return (
                        <button
                          className="btn"
                          onClick={() => setCurrentSide('back')}
                          disabled={!frontComplete}
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
                      );
                    }

                    return (
                      <button
                        className="btn"
                        onClick={allComplete ? toggleEditArea : undefined}
                        disabled={!allComplete}
                      >
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
                        {appLanguage === 'de' ? 'Fertig' : 'Done'}
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Right column: Checklist */}
          <div className="lg:w-[35%]">
            <div className="lg:sticky lg:top-4 space-y-4">
              <div className="card bg-base-100 shadow-xl">
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
                        {item.completed ? (
                          <div className="w-5 h-5 rounded border-2 border-primary bg-primary flex items-center justify-center shrink-0">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3 text-primary-content"
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

              {/* Template Selection Card */}
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <TemplateV2Demo />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset confirmation dialog */}
      <dialog ref={resetDialogRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">
            {appLanguage === 'de' ? 'Zurücksetzen?' : 'Reset?'}
          </h3>
          <p className="py-4">
            {appLanguage === 'de'
              ? 'Möchtest du wirklich alle Eingaben löschen und von vorne beginnen?'
              : 'Do you really want to delete all entries and start over?'}
          </p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-ghost">
                {appLanguage === 'de' ? 'Abbrechen' : 'Cancel'}
              </button>
            </form>
            <button className="btn btn-error" onClick={handleResetConfirm}>
              {appLanguage === 'de' ? 'Zurücksetzen' : 'Reset'}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
}
