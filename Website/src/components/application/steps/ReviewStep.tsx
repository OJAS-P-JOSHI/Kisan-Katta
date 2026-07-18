import { ClipboardCheck } from 'lucide-react'
import { useFormContext } from 'react-hook-form'

import { ReviewSection, type ReviewItem } from '@/components/application/ReviewSection'
import { StepCard } from '@/components/application/StepCard'
import { useWizard } from '@/components/application/wizard-context'
import { GENDER_OPTIONS } from '@/data/application-options'
import type { ApplicationFormValues } from '@/lib/application-validation'
import type { CloudinaryDocument } from '@/types/application.types'

const genderLabel = (value: string): string =>
  GENDER_OPTIONS.find((g) => g.value === value)?.label ?? '—'

const docStatus = (doc: CloudinaryDocument | null): ReviewItem['value'] =>
  doc ? 'Uploaded' : undefined

export function ReviewStep() {
  const { application, goToStep } = useWizard()
  const { watch } = useFormContext<ApplicationFormValues>()
  const v = watch()

  const text = (value: string): ReviewItem['value'] => (value?.trim() ? value : undefined)

  return (
    <StepCard
      icon={ClipboardCheck}
      title="Review & Submit"
      description="Please review your details. You can edit any section before submitting."
    >
      <ReviewSection
        title="Personal Details"
        onEdit={() => goToStep(0)}
        items={[
          { label: 'Profile Photo', value: docStatus(application.photo), missing: !application.photo },
          { label: 'Full Name', value: text(v.fullName), missing: !v.fullName?.trim() },
          { label: 'Date of Birth', value: text(v.dob), missing: !v.dob?.trim() },
          { label: 'Gender', value: v.gender ? genderLabel(v.gender) : undefined, missing: !v.gender },
          { label: 'Phone', value: text(v.phone), missing: !v.phone?.trim() },
          { label: 'Email', value: text(v.email), missing: !v.email?.trim() },
        ]}
      />

      <ReviewSection
        title="Address"
        onEdit={() => goToStep(1)}
        items={[
          { label: 'District', value: text(v.district), missing: !v.district?.trim() },
          { label: 'Taluka', value: text(v.taluka), missing: !v.taluka?.trim() },
          { label: 'Village', value: text(v.village), missing: !v.village?.trim() },
          { label: 'Address', value: text(v.address), missing: !v.address?.trim() },
          { label: 'Pincode', value: text(v.pincode), missing: !v.pincode?.trim() },
        ]}
      />

      <ReviewSection
        title="Identity & Background"
        onEdit={() => goToStep(2)}
        items={[
          { label: 'Aadhaar', value: text(v.aadhaarNumber), missing: !v.aadhaarNumber?.trim() },
          { label: 'PAN', value: text(v.panNumber), missing: !v.panNumber?.trim() },
          { label: 'Education', value: text(v.education), missing: !v.education?.trim() },
          { label: 'Occupation', value: text(v.occupation), missing: !v.occupation?.trim() },
          {
            label: 'Languages',
            value: v.languages?.length ? v.languages.join(', ') : undefined,
            missing: !v.languages?.length,
          },
          { label: 'Experience', value: text(v.experience) },
          { label: 'Why Join', value: text(v.whyJoin), missing: !v.whyJoin?.trim() },
        ]}
      />

      <ReviewSection
        title="Bank Details"
        onEdit={() => goToStep(3)}
        items={[
          { label: 'Account Holder', value: text(v.bankAccountHolder), missing: !v.bankAccountHolder?.trim() },
          { label: 'Account Number', value: text(v.bankAccountNumber), missing: !v.bankAccountNumber?.trim() },
          { label: 'IFSC', value: text(v.bankIFSC), missing: !v.bankIFSC?.trim() },
          { label: 'Bank Name', value: text(v.bankName), missing: !v.bankName?.trim() },
          {
            label: 'Cancelled Cheque',
            value: docStatus(application.cancelledChequeImage),
            missing: !application.cancelledChequeImage,
          },
        ]}
      />

      <ReviewSection
        title="Documents"
        onEdit={() => goToStep(4)}
        items={[
          { label: 'Passport Photo', value: docStatus(application.photo), missing: !application.photo },
          { label: 'Aadhaar Front', value: docStatus(application.aadhaarFront), missing: !application.aadhaarFront },
          { label: 'Aadhaar Back', value: docStatus(application.aadhaarBack), missing: !application.aadhaarBack },
          { label: 'PAN Card', value: docStatus(application.panImage), missing: !application.panImage },
          {
            label: 'Experience Certificates',
            value: `${application.experienceCertificates?.length ?? 0} uploaded`,
          },
        ]}
      />
    </StepCard>
  )
}
