import { MapPin } from 'lucide-react'

import { StepCard } from '@/components/application/StepCard'
import {
  SelectField,
  TextAreaField,
  TextField,
} from '@/components/application/FormFields'
import { DISTRICTS } from '@/data/application-options'
import { sanitizeDigits } from '@/lib/field-transforms'

const DISTRICT_OPTIONS = DISTRICTS.map((d) => ({ value: d, label: d }))

export function AddressStep() {
  return (
    <StepCard icon={MapPin} title="Address" description="Where are you based?">
      <SelectField
        name="district"
        label="District"
        options={DISTRICT_OPTIONS}
        placeholder="Select your district"
        required
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="taluka" label="Taluka" placeholder="Taluka" required />
        <TextField name="village" label="Village" placeholder="Village" required />
      </div>
      <TextAreaField
        name="address"
        label="Full Address"
        placeholder="House / street / landmark"
        rows={3}
        required
      />
      <TextField
        name="pincode"
        label="Pincode"
        inputMode="numeric"
        placeholder="6-digit pincode"
        maxLength={6}
        transform={(v) => sanitizeDigits(v, 6)}
        required
      />
    </StepCard>
  )
}
