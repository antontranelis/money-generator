import { useBillStore } from '../stores/billStore';
import { t } from '../constants/translations';
import { PersonalInfoForm } from './PersonalInfoForm';
import { PortraitUpload } from './PortraitUpload';
import { VoucherConfig } from './VoucherConfig';

export function BillForm() {
  const language = useBillStore((state) => state.voucherConfig.language);
  const templateHue = useBillStore((state) => state.voucherConfig.templateHue);
  const setTemplateHue = useBillStore((state) => state.setTemplateHue);
  const trans = t(language);

  return (
    <div className="space-y-6">
      {/* Personal Info */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title font-currency text-currency-green">
            {trans.form.personalInfo.title}
          </h2>
          <PersonalInfoForm />
        </div>
      </div>

      {/* Portrait */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title font-currency text-currency-green">
            {trans.form.portrait.title}
          </h2>
          <PortraitUpload />
        </div>
      </div>

      {/* Bill Color */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title font-currency text-currency-green">
            {trans.form.billColor.title}
          </h2>
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

      {/* Voucher Config */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title font-currency text-currency-green">
            {trans.form.voucher.title}
          </h2>
          <VoucherConfig />
        </div>
      </div>
    </div>
  );
}
