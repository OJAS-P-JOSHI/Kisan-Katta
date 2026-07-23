import { BadgeCheck } from 'lucide-react'

import { StepCard } from '@/components/application/StepCard'
import { TextField } from '@/components/application/FormFields'
import { UploadCard } from '@/components/application/UploadCard'
import { useWizard } from '@/components/application/wizard-context'
import { useTranslation } from '@/i18n/LanguageProvider'
import { sanitizeDigits } from '@/lib/field-transforms'

export function AadhaarStep() {
  const { application, applyUpload } = useWizard()
  const { t } = useTranslation()

  return (
    <StepCard
      icon={BadgeCheck}
      title={t('app.wizard.steps.aadhaar.title')}
      description={t('app.wizard.steps.aadhaar.desc')}
    >
      <TextField
        name="aadhaarNumber"
        label={t('app.fields.aadhaar')}
        inputMode="numeric"
        placeholder={t('app.fields.aadhaarPh')}
        maxLength={12}
        transform={(v) => sanitizeDigits(v, 12)}
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <UploadCard
          label={t('app.fields.aadhaarFront')}
          documentType="aadhaarFront"
          document={application.aadhaarFront}
          required
          onUploaded={applyUpload}
        />
        <UploadCard
          label={t('app.fields.aadhaarBack')}
          documentType="aadhaarBack"
          document={application.aadhaarBack}
          required
          onUploaded={applyUpload}
        />
      </div>
    </StepCard>
  )
}
