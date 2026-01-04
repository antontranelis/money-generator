import { useEffect, useRef } from 'react';
import { useBillStore } from '../stores/billStore';
import { t } from '../constants/translations';

interface PersonalInfoFormProps {
  focusField?: 'name' | 'email' | 'phone' | null;
  onFocused?: () => void;
}

export function PersonalInfoForm({ focusField, onFocused }: PersonalInfoFormProps = {}) {
  const appLanguage = useBillStore((state) => state.appLanguage);
  const personalInfo = useBillStore((state) => state.personalInfo);
  const setPersonalInfo = useBillStore((state) => state.setPersonalInfo);
  const trans = t(appLanguage);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusField) {
      const ref = focusField === 'name' ? nameRef : focusField === 'email' ? emailRef : phoneRef;
      // Small delay to ensure the element is rendered after side flip
      setTimeout(() => {
        // Use click() instead of focus() to trigger browser autofill dropdown
        ref.current?.click();
        ref.current?.focus();
        onFocused?.();
      }, 100);
    }
  }, [focusField, onFocused]);

  return (
    <div className="space-y-4">
      {/* Name */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">{trans.form.personalInfo.name}</span>
        </label>
        <input
          ref={nameRef}
          type="text"
          name="name"
          autoComplete="name"
          placeholder={trans.form.personalInfo.namePlaceholder}
          className="input input-bordered w-full"
          value={personalInfo.name}
          onChange={(e) => setPersonalInfo({ name: e.target.value })}
        />
      </div>

      {/* Email */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">{trans.form.personalInfo.email}</span>
        </label>
        <input
          ref={emailRef}
          type="email"
          name="email"
          autoComplete="email"
          placeholder={trans.form.personalInfo.emailPlaceholder}
          className="input input-bordered w-full"
          value={personalInfo.email}
          onChange={(e) => setPersonalInfo({ email: e.target.value })}
        />
      </div>

      {/* Phone */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">{trans.form.personalInfo.phone}</span>
        </label>
        <input
          ref={phoneRef}
          type="tel"
          name="phone"
          autoComplete="tel"
          placeholder={trans.form.personalInfo.phonePlaceholder}
          className="input input-bordered w-full"
          value={personalInfo.phone}
          onChange={(e) => setPersonalInfo({ phone: e.target.value })}
        />
      </div>
    </div>
  );
}
