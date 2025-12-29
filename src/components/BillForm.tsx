import { useBillStore } from '../stores/billStore';
import { t } from '../constants/translations';
import { PersonalInfoForm } from './PersonalInfoForm';
import { PortraitUpload } from './PortraitUpload';
import { VoucherConfig } from './VoucherConfig';

export function BillForm() {
  const language = useBillStore((state) => state.voucherConfig.language);
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
