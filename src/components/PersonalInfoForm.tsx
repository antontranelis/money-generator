import { useBillStore } from '../stores/billStore';
import { t } from '../constants/translations';

export function PersonalInfoForm() {
  const language = useBillStore((state) => state.voucherConfig.language);
  const personalInfo = useBillStore((state) => state.personalInfo);
  const setPersonalInfo = useBillStore((state) => state.setPersonalInfo);
  const trans = t(language);

  return (
    <div className="space-y-4">
      {/* Name */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">{trans.form.personalInfo.name}</span>
        </label>
        <input
          type="text"
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
          type="email"
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
          type="tel"
          placeholder={trans.form.personalInfo.phonePlaceholder}
          className="input input-bordered w-full"
          value={personalInfo.phone}
          onChange={(e) => setPersonalInfo({ phone: e.target.value })}
        />
      </div>
    </div>
  );
}
