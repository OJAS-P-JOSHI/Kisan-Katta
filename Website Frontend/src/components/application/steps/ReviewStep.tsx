import { ClipboardCheck } from 'lucide-react'
import { useFormContext } from 'react-hook-form'

import { DocumentPreview } from '@/components/application/DocumentPreview'
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

interface ReviewStepProps {
  /** When false (PAYMENT_PENDING / SUBMITTED), hide Edit jumps. */
  editable?: boolean
}

export function ReviewStep({ editable = true }: ReviewStepProps) {
  const { application, goToStep } = useWizard()
  const { watch } = useFormContext<ApplicationFormValues>()
  const v = watch()

  const text = (value: string): ReviewItem['value'] => (value?.trim() ? value : undefined)
  const onEdit = editable
    ? (step: number) => () => goToStep(step)
    : undefined

  return (
    <StepCard
      icon={ClipboardCheck}
      title="Review Application"
      description={
        editable
          ? 'Please review your details before paying the registration fee.'
          : 'Your application details are locked for editing.'
      }
    >
      <ReviewSection
        title="Personal Details"
        onEdit={onEdit?.(0)}
        items={[
          { label: 'Profile Photo', value: docStatus(application.photo) },
          { label: 'Full Name', value: text(v.fullName), missing: !v.fullName?.trim() },
          { label: 'Date of Birth', value: text(v.dob), missing: !v.dob?.trim() },
          { label: 'Gender', value: v.gender ? genderLabel(v.gender) : undefined, missing: !v.gender },
          { label: 'Phone', value: text(v.phone) },
          { label: 'Email', value: text(v.email) },
        ]}
      />

      <ReviewSection
        title="Address"
        onEdit={onEdit?.(1)}
        items={[
          { label: 'District', value: text(v.district), missing: !v.district?.trim() },
          { label: 'Taluka', value: text(v.taluka), missing: !v.taluka?.trim() },
          { label: 'Village', value: text(v.village), missing: !v.village?.trim() },
          { label: 'Address', value: text(v.address), missing: !v.address?.trim() },
          { label: 'Pincode', value: text(v.pincode), missing: !v.pincode?.trim() },
        ]}
      />

      <ReviewSection
        title="Aadhaar"
        onEdit={onEdit?.(2)}
        items={[
          { label: 'Aadhaar Number', value: text(v.aadhaarNumber), missing: !v.aadhaarNumber?.trim() },
          {
            label: 'Aadhaar Front',
            value: docStatus(application.aadhaarFront),
            missing: !application.aadhaarFront,
          },
          {
            label: 'Aadhaar Back',
            value: docStatus(application.aadhaarBack),
            missing: !application.aadhaarBack,
          },
        ]}
      />

      <ReviewSection
        title="Bank"
        onEdit={onEdit?.(3)}
        items={[
          { label: 'Account Holder', value: text(v.bankAccountHolder), missing: !v.bankAccountHolder?.trim() },
          { label: 'Account Number', value: text(v.bankAccountNumber), missing: !v.bankAccountNumber?.trim() },
          { label: 'IFSC', value: text(v.bankIFSC), missing: !v.bankIFSC?.trim() },
          { label: 'Bank Name', value: text(v.bankName), missing: !v.bankName?.trim() },
          {
            label: 'Cancelled Cheque / Passbook',
            value: docStatus(application.cancelledChequeImage),
            missing: !application.cancelledChequeImage,
          },
        ]}
      />

      <section className="rounded-2xl border border-border bg-white/70 p-4 shadow-soft sm:p-5">
        <h3 className="mb-3 text-sm font-bold text-ink sm:text-base">Uploaded Images</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              ['Photo', application.photo],
              ['Aadhaar Front', application.aadhaarFront],
              ['Aadhaar Back', application.aadhaarBack],
              ['Cheque / Passbook', application.cancelledChequeImage],
            ] as const
          ).map(([label, doc]) =>
            doc ? (
              <div key={label}>
                <p className="mb-1 text-xs text-muted-foreground">{label}</p>
                <DocumentPreview url={doc.url} alt={label} />
              </div>
            ) : null,
          )}
        </div>
      </section>
    </StepCard>
  )
}
