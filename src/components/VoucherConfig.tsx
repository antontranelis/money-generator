import { useBillStore } from '../stores/billStore';
import { t } from '../constants/translations';

export function VoucherConfig() {
  const language = useBillStore((state) => state.voucherConfig.language);
  const templateHue = useBillStore((state) => state.voucherConfig.templateHue);
  const setTemplateHue = useBillStore((state) => state.setTemplateHue);
  const trans = t(language);

  return (
    <div className="space-y-4">
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
