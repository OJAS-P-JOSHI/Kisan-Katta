import { User } from 'lucide-react'

import { StepCard } from '@/components/application/StepCard'
import { UploadCard } from '@/components/application/UploadCard'
import {
  SelectField,
  TextField,
} from '@/components/application/FormFields'
import { useWizard } from '@/components/application/wizard-context'
import { GENDERS } from '@/types/application.types'
import { useTranslation } from '@/i18n/LanguageProvider'

export function PersonalDetailsStep() {
  const { application, applyUpload } = useWizard()
  const { t } = useTranslation()

  const genderOptions = GENDERS.map((value) => ({
    value,
    label: t(`app.gender.${value}`),
  }))

  return (
    <StepCard
      icon={User}
      title={t('app.wizard.steps.personal.title')}
      description={t('app.wizard.steps.personal.desc')}
    >
      <UploadCard
        label={t('app.fields.photo')}
        description={t('app.fields.photoDesc')}
        documentType="photo"
        document={application.photo}
        onUploaded={applyUpload}
      />
      <TextField
        name="fullName"
        label={t('app.fields.fullName')}
        placeholder={t('app.fields.fullNamePh')}
        required
        autoComplete="name"
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="dob" label={t('app.fields.dob')} type="date" required />
        <SelectField
          name="gender"
          label={t('app.fields.gender')}
          options={genderOptions}
          placeholder={t('app.fields.select')}
          required
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          name="phone"
          label={t('app.fields.phone')}
          type="tel"
          inputMode="tel"
          placeholder={t('app.fields.phonePh')}
          autoComplete="tel"
          hint={t('app.fields.optional')}
        />
        <TextField
          name="email"
          label={t('app.fields.email')}
          type="email"
          inputMode="email"
          placeholder={t('app.fields.emailPh')}
          autoComplete="email"
          hint={t('app.fields.optional')}
        />
      </div>
    </StepCard>
  )
}
