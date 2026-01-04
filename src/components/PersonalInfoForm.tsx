import { useEffect, useRef, useState } from 'react';
import { useBillStore } from '../stores/billStore';
import { t } from '../constants/translations';

interface PersonalInfoFormProps {
  focusField?: 'name' | 'email' | 'phone' | null;
  onFocused?: () => void;
}

// Simple email validation
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Phone validation - at least 6 digits
function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 6;
}

export function PersonalInfoForm({ focusField, onFocused }: PersonalInfoFormProps = {}) {
  const appLanguage = useBillStore((state) => state.appLanguage);
  const personalInfo = useBillStore((state) => state.personalInfo);
  const setPersonalInfo = useBillStore((state) => state.setPersonalInfo);
  const trans = t(appLanguage);

  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);

  const emailError = emailTouched && personalInfo.email.trim() && !isValidEmail(personalInfo.email);
  const phoneError = phoneTouched && personalInfo.phone.trim() && !isValidPhone(personalInfo.phone);

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
          className="input input-bordered w-full input-lg sm:input-md"
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
          className={`input input-bordered w-full input-lg sm:input-md ${emailError ? 'input-error' : ''}`}
          value={personalInfo.email}
          onChange={(e) => setPersonalInfo({ email: e.target.value })}
          onBlur={() => setEmailTouched(true)}
        />
        {emailError && (
          <label className="label">
            <span className="label-text-alt text-error">
              {appLanguage === 'de' ? 'Bitte gib eine gültige E-Mail-Adresse ein' : 'Please enter a valid email address'}
            </span>
          </label>
        )}
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
          className={`input input-bordered w-full input-lg sm:input-md ${phoneError ? 'input-error' : ''}`}
          value={personalInfo.phone}
          onChange={(e) => setPersonalInfo({ phone: e.target.value })}
          onBlur={() => setPhoneTouched(true)}
        />
        {phoneError && (
          <label className="label">
            <span className="label-text-alt text-error">
              {appLanguage === 'de' ? 'Bitte gib eine gültige Telefonnummer ein' : 'Please enter a valid phone number'}
            </span>
          </label>
        )}
      </div>
    </div>
  );
}
