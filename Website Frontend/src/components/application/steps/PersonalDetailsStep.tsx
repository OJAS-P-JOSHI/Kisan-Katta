import { User } from 'lucide-react'

import { StepCard } from '@/components/application/StepCard'
import { UploadCard } from '@/components/application/UploadCard'
import {
  SelectField,
  TextField,
} from '@/components/application/FormFields'
import { useWizard } from '@/components/application/wizard-context'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/i18n/LanguageProvider'
import { GENDERS } from '@/types/application.types'

export function PersonalDetailsStep() {
  const { application, applyUpload } = useWizard()
  const { t } = useTranslation()
  const { user } = useAuth()

  const genderOptions = GENDERS.map((value) => ({
    value,
    label: t(`app.gender.${value}`),
  }))

  const verifiedPhone =
    application.phoneNumber ?? application.phone ?? user?.mobile ?? ''

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
        <div className="space-y-1.5">
          <label
            htmlFor="verified-phone"
            className="block text-sm font-medium text-ink"
          >
            {t('app.fields.phone')}
          </label>
          <input
            id="verified-phone"
            type="tel"
            readOnly
            value={verifiedPhone}
            className="flex h-12 w-full cursor-not-allowed rounded-xl border border-border bg-mist/40 px-4 text-base text-foreground"
            aria-readonly="true"
          />
          <p className="text-xs text-muted-foreground">
            Verified login mobile — cannot be changed here.
          </p>
        </div>
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
