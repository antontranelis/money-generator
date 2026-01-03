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
  );
}
