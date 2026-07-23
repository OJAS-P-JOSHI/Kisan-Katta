import { MapPin } from 'lucide-react'

import { StepCard } from '@/components/application/StepCard'
import {
  SelectField,
  TextAreaField,
  TextField,
} from '@/components/application/FormFields'
import { DISTRICTS } from '@/data/application-options'
import { useTranslation } from '@/i18n/LanguageProvider'
import { sanitizeDigits } from '@/lib/field-transforms'

const DISTRICT_OPTIONS = DISTRICTS.map((d) => ({ value: d, label: d }))

export function AddressStep() {
  const { t } = useTranslation()

  return (
    <StepCard
      icon={MapPin}
      title={t('app.wizard.steps.address.title')}
      description={t('app.wizard.steps.address.desc')}
    >
      <SelectField
        name="district"
        label={t('app.fields.district')}
        options={DISTRICT_OPTIONS}
        placeholder={t('app.fields.districtPh')}
        required
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          name="taluka"
          label={t('app.fields.taluka')}
          placeholder={t('app.fields.talukaPh')}
          required
        />
        <TextField
          name="village"
          label={t('app.fields.village')}
          placeholder={t('app.fields.villagePh')}
          required
        />
      </div>
      <TextAreaField
        name="address"
        label={t('app.fields.address')}
        placeholder={t('app.fields.addressPh')}
        rows={3}
        required
      />
      <TextField
        name="pincode"
        label={t('app.fields.pincode')}
        inputMode="numeric"
        placeholder={t('app.fields.pincodePh')}
        maxLength={6}
        transform={(v) => sanitizeDigits(v, 6)}
        required
      />
    </StepCard>
  )
}
