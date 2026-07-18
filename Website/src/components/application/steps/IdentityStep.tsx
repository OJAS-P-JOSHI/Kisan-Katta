import { BadgeCheck } from 'lucide-react'

import { StepCard } from '@/components/application/StepCard'
import {
  LanguageSelectField,
  SelectField,
  TextAreaField,
  TextField,
} from '@/components/application/FormFields'
import {
  EDUCATION_OPTIONS,
  LANGUAGE_OPTIONS,
  OCCUPATION_OPTIONS,
} from '@/data/application-options'
import { sanitizeDigits, sanitizeUpperAlnum } from '@/lib/field-transforms'

const toOptions = (values: string[]) => values.map((v) => ({ value: v, label: v }))

export function IdentityStep() {
  return (
    <StepCard
      icon={BadgeCheck}
      title="Identity & Background"
      description="Your identity and why you want to join."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          name="aadhaarNumber"
          label="Aadhaar Number"
          inputMode="numeric"
          placeholder="12-digit Aadhaar"
          maxLength={12}
          transform={(v) => sanitizeDigits(v, 12)}
          required
        />
        <TextField
          name="panNumber"
          label="PAN"
          placeholder="ABCDE1234F"
          maxLength={10}
          transform={(v) => sanitizeUpperAlnum(v, 10)}
          required
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          name="education"
          label="Education"
          options={toOptions(EDUCATION_OPTIONS)}
          required
        />
        <SelectField
          name="occupation"
          label="Occupation"
          options={toOptions(OCCUPATION_OPTIONS)}
          required
        />
      </div>
      <LanguageSelectField
        name="languages"
        label="Languages Known"
        options={LANGUAGE_OPTIONS}
        required
      />
      <TextField
        name="experience"
        label="Relevant Experience (optional)"
        placeholder="e.g. 3 years in agri-services"
      />
      <TextAreaField
        name="whyJoin"
        label="Why do you want to join?"
        placeholder="Share your motivation (at least 20 characters)"
        rows={4}
        required
        showCount
      />
    </StepCard>
  )
}
