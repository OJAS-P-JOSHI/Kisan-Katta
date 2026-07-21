import { BadgeCheck } from 'lucide-react'

import { StepCard } from '@/components/application/StepCard'
import { TextField } from '@/components/application/FormFields'
import { UploadCard } from '@/components/application/UploadCard'
import { useWizard } from '@/components/application/wizard-context'
import { sanitizeDigits } from '@/lib/field-transforms'

export function AadhaarStep() {
  const { application, applyUpload } = useWizard()

  return (
    <StepCard
      icon={BadgeCheck}
      title="Aadhaar"
      description="Enter your Aadhaar number and upload clear front and back images."
    >
      <TextField
        name="aadhaarNumber"
        label="Aadhaar Number"
        inputMode="numeric"
        placeholder="12-digit Aadhaar"
        maxLength={12}
        transform={(v) => sanitizeDigits(v, 12)}
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <UploadCard
          label="Aadhaar Front"
          documentType="aadhaarFront"
          document={application.aadhaarFront}
          required
          onUploaded={applyUpload}
        />
        <UploadCard
          label="Aadhaar Back"
          documentType="aadhaarBack"
          document={application.aadhaarBack}
          required
          onUploaded={applyUpload}
        />
      </div>
    </StepCard>
  )
}
