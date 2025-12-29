import { useBillStore } from '../stores/billStore';
import { t } from '../constants/translations';
import type { HourValue } from '../types/bill';

const HOUR_OPTIONS: HourValue[] = [1, 5, 10];

export function VoucherConfig() {
  const language = useBillStore((state) => state.voucherConfig.language);
  const voucherConfig = useBillStore((state) => state.voucherConfig);
  const setHours = useBillStore((state) => state.setHours);
  const setVoucherConfig = useBillStore((state) => state.setVoucherConfig);
  const trans = t(language);

  const getHourLabel = (hours: number) => {
    return hours === 1 ? trans.form.voucher.hourLabel : trans.form.voucher.hoursLabel;
  };

  return (
    <div className="space-y-4">
      {/* Hours Selection */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">{trans.form.voucher.hours}</span>
        </label>
        <div className="join w-full">
          {HOUR_OPTIONS.map((hours) => (
            <button
              key={hours}
              className={`join-item btn flex-1 ${
                voucherConfig.hours === hours ? 'btn-primary' : 'btn-outline'
              }`}
              onClick={() => setHours(hours)}
            >
              {hours} {getHourLabel(hours)}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">{trans.form.voucher.description}</span>
        </label>
        <textarea
          className="textarea textarea-bordered h-24 resize-none w-full"
          placeholder={trans.form.voucher.descriptionPlaceholder}
          value={voucherConfig.description}
          onChange={(e) => setVoucherConfig({ description: e.target.value })}
          maxLength={200}
        />
        <label className="label">
          <span className="label-text-alt"></span>
          <span className="label-text-alt">{voucherConfig.description.length}/200</span>
        </label>
      </div>
    </div>
  );
}
