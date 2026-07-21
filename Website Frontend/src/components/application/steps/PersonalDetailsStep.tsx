import { User } from 'lucide-react'

import { StepCard } from '@/components/application/StepCard'
import { UploadCard } from '@/components/application/UploadCard'
import {
  SelectField,
  TextField,
} from '@/components/application/FormFields'
import { useWizard } from '@/components/application/wizard-context'
import { GENDER_OPTIONS } from '@/data/application-options'

export function PersonalDetailsStep() {
  const { application, applyUpload } = useWizard()

  return (
    <StepCard icon={User} title="Personal Details" description="Tell us about yourself.">
      <UploadCard
        label="Profile Photo"
        description="Optional. A clear passport-style photo."
        documentType="photo"
        document={application.photo}
        onUploaded={applyUpload}
      />
      <TextField name="fullName" label="Full Name" placeholder="As per Aadhaar" required autoComplete="name" />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="dob" label="Date of Birth" type="date" required />
        <SelectField name="gender" label="Gender" options={GENDER_OPTIONS} required />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          name="phone"
          label="Phone Number"
          type="tel"
          inputMode="tel"
          placeholder="10-digit mobile"
          autoComplete="tel"
          hint="Optional"
        />
        <TextField
          name="email"
          label="Email"
          type="email"
          inputMode="email"
          placeholder="you@example.com"
          autoComplete="email"
          hint="Optional"
        />
      </div>
    </StepCard>
  )
}
