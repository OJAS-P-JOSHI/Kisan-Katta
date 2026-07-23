import { Landmark } from 'lucide-react'

import { StepCard } from '@/components/application/StepCard'
import { UploadCard } from '@/components/application/UploadCard'
import { TextField } from '@/components/application/FormFields'
import { useWizard } from '@/components/application/wizard-context'
import { useTranslation } from '@/i18n/LanguageProvider'
import { sanitizeDigits, sanitizeUpperAlnum } from '@/lib/field-transforms'

export function BankDetailsStep() {
  const { application, applyUpload } = useWizard()
  const { t } = useTranslation()

  return (
    <StepCard
      icon={Landmark}
      title={t('app.wizard.steps.bank.title')}
      description={t('app.wizard.steps.bank.desc')}
    >
      <TextField
        name="bankAccountHolder"
        label={t('app.fields.bankHolder')}
        placeholder={t('app.fields.bankHolderPh')}
        required
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          name="bankAccountNumber"
          label={t('app.fields.accountNumber')}
          inputMode="numeric"
          placeholder={t('app.fields.accountNumberPh')}
          maxLength={18}
          transform={(v) => sanitizeDigits(v, 18)}
          required
        />
        <TextField
          name="bankIFSC"
          label={t('app.fields.ifsc')}
          placeholder={t('app.fields.ifscPh')}
          maxLength={11}
          transform={(v) => sanitizeUpperAlnum(v, 11)}
          required
        />
      </div>
      <TextField
        name="bankName"
        label={t('app.fields.bankName')}
        placeholder={t('app.fields.bankNamePh')}
        required
      />

      <UploadCard
        label={t('app.fields.cheque')}
        description={t('app.fields.chequeDesc')}
        documentType="cancelledCheque"
        document={application.cancelledChequeImage}
        required
        onUploaded={applyUpload}
      />
    </StepCard>
  )
}
