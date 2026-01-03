import { useBillStore } from '../stores/billStore';
import { t } from '../constants/translations';
import type { HourValue } from '../types/bill';

export function VoucherConfig() {
  const appLanguage = useBillStore((state) => state.appLanguage);
  const billLanguage = useBillStore((state) => state.voucherConfig.language);
  const hours = useBillStore((state) => state.voucherConfig.hours);
  const templateHue = useBillStore((state) => state.voucherConfig.templateHue);
  const setBillLanguage = useBillStore((state) => state.setBillLanguage);
  const setHours = useBillStore((state) => state.setHours);
  const setTemplateHue = useBillStore((state) => state.setTemplateHue);
  const trans = t(appLanguage);

  const hourOptions: HourValue[] = [1, 5, 10];

  return (
    <div className="space-y-4">
      {/* Bill Language Selector */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">{trans.form.voucher.billLanguage}</span>
        </label>
        <div className="join">
          <button
            className={`join-item btn btn-sm ${billLanguage === 'de' ? 'btn-active btn-primary' : 'btn-ghost'}`}
            onClick={() => setBillLanguage('de')}
          >
            {trans.form.voucher.billLanguageGerman}
          </button>
          <button
            className={`join-item btn btn-sm ${billLanguage === 'en' ? 'btn-active btn-primary' : 'btn-ghost'}`}
            onClick={() => setBillLanguage('en')}
          >
            {trans.form.voucher.billLanguageEnglish}
          </button>
        </div>
      </div>

      {/* Hours Selector */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">{trans.form.voucher.hours}</span>
        </label>
        <div className="join">
          {hourOptions.map((h) => (
            <button
              key={h}
              className={`join-item btn btn-sm ${hours === h ? 'btn-active btn-primary' : 'btn-ghost'}`}
              onClick={() => setHours(h)}
            >
              {h} {h === 1 ? trans.form.voucher.hourLabel : trans.form.voucher.hoursLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Bill Color Slider */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">{trans.form.billColor.label}</span>
        </label>
        <input
          type="range"
          min="0"
          max="360"
          value={templateHue}
          onChange={(e) => setTemplateHue(Number(e.target.value))}
          className="w-full h-3 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gray-300 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-gray-300"
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
      </div>
    </div>
  );
}
