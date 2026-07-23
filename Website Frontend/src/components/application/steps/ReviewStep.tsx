import { ClipboardCheck } from 'lucide-react'
import { useFormContext } from 'react-hook-form'

import { DocumentPreview } from '@/components/application/DocumentPreview'
import { ReviewSection, type ReviewItem } from '@/components/application/ReviewSection'
import { StepCard } from '@/components/application/StepCard'
import { useWizard } from '@/components/application/wizard-context'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { TranslationKeys } from '@/i18n/translations'
import type { ApplicationFormValues } from '@/lib/application-validation'
import type { CloudinaryDocument } from '@/types/application.types'

interface ReviewStepProps {
  /** When false (PAYMENT_PENDING / SUBMITTED), hide Edit jumps. */
  editable?: boolean
}

export function ReviewStep({ editable = true }: ReviewStepProps) {
  const { t } = useTranslation()
  const { application, goToStep } = useWizard()
  const { watch } = useFormContext<ApplicationFormValues>()
  const v = watch()

  const genderLabel = (value: string): string => {
    if (!value) return '—'
    return t(`app.gender.${value}` as TranslationKeys)
  }

  const docStatus = (doc: CloudinaryDocument | null): ReviewItem['value'] =>
    doc ? t('app.review.uploaded') : undefined

  const text = (value: string): ReviewItem['value'] => (value?.trim() ? value : undefined)
  const onEdit = editable
    ? (step: number) => () => goToStep(step)
    : undefined

  return (
    <StepCard
      icon={ClipboardCheck}
      title={t('app.wizard.steps.review.title')}
      description={
        editable
          ? 'Please review your details before paying the registration fee.'
          : t('app.wizard.locked')
      }
    >
      <ReviewSection
        title={t('app.wizard.steps.personal.title')}
        onEdit={onEdit?.(0)}
        items={[
          { label: t('app.fields.photo'), value: docStatus(application.photo) },
          { label: t('app.fields.fullName'), value: text(v.fullName), missing: !v.fullName?.trim() },
          { label: t('app.fields.dob'), value: text(v.dob), missing: !v.dob?.trim() },
          {
            label: t('app.fields.gender'),
            value: v.gender ? genderLabel(v.gender) : undefined,
            missing: !v.gender,
          },
          {
            label: t('app.fields.phone'),
            value: text(
              v.phone || application.phoneNumber || application.phone || '',
            ),
          },
          { label: t('app.fields.email'), value: text(v.email) },
        ]}
      />

      <ReviewSection
        title={t('app.wizard.steps.address.title')}
        onEdit={onEdit?.(1)}
        items={[
          { label: t('app.fields.district'), value: text(v.district), missing: !v.district?.trim() },
          { label: t('app.fields.taluka'), value: text(v.taluka), missing: !v.taluka?.trim() },
          { label: t('app.fields.village'), value: text(v.village), missing: !v.village?.trim() },
          { label: t('app.fields.address'), value: text(v.address), missing: !v.address?.trim() },
          { label: t('app.fields.pincode'), value: text(v.pincode), missing: !v.pincode?.trim() },
        ]}
      />

      <ReviewSection
        title={t('app.wizard.steps.aadhaar.title')}
        onEdit={onEdit?.(2)}
        items={[
          {
            label: t('app.fields.aadhaar'),
            value: text(v.aadhaarNumber),
            missing: !v.aadhaarNumber?.trim(),
          },
          {
            label: t('app.fields.aadhaarFront'),
            value: docStatus(application.aadhaarFront),
            missing: !application.aadhaarFront,
          },
          {
            label: t('app.fields.aadhaarBack'),
            value: docStatus(application.aadhaarBack),
            missing: !application.aadhaarBack,
          },
        ]}
      />

      <ReviewSection
        title={t('app.wizard.steps.bank.title')}
        onEdit={onEdit?.(3)}
        items={[
          {
            label: t('app.fields.bankHolder'),
            value: text(v.bankAccountHolder),
            missing: !v.bankAccountHolder?.trim(),
          },
          {
            label: t('app.fields.accountNumber'),
            value: text(v.bankAccountNumber),
            missing: !v.bankAccountNumber?.trim(),
          },
          { label: t('app.fields.ifsc'), value: text(v.bankIFSC), missing: !v.bankIFSC?.trim() },
          { label: t('app.fields.bankName'), value: text(v.bankName), missing: !v.bankName?.trim() },
          {
            label: t('app.fields.cheque'),
            value: docStatus(application.cancelledChequeImage),
            missing: !application.cancelledChequeImage,
          },
        ]}
      />

      <section className="rounded-2xl border border-border bg-white/70 p-4 shadow-soft sm:p-5">
        <h3 className="mb-3 text-sm font-bold text-ink sm:text-base">
          {t('app.wizard.steps.review.title')}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              [t('app.fields.photo'), application.photo],
              [t('app.fields.aadhaarFront'), application.aadhaarFront],
              [t('app.fields.aadhaarBack'), application.aadhaarBack],
              [t('app.fields.cheque'), application.cancelledChequeImage],
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
