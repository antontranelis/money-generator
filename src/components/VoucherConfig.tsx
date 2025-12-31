// Temporarily disabled - hours and description inputs
// TODO: Re-enable when ready
export function VoucherConfig() {
  return null;

  /*
  return (
    <div className="space-y-4">
      {/* Hours Selection * /}
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

      {/* Description * /}
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
  */
}
