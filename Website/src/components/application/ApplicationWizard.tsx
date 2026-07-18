import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence } from 'framer-motion'
import { AlertCircle, ArrowLeft, ArrowRight, Send } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import { submitApplication } from '@/api/application.api'
import { WizardLayout } from '@/components/application/WizardLayout'
import type { StepMeta } from '@/components/application/Stepper'
import { WizardContext } from '@/components/application/wizard-context'
import { AddressStep } from '@/components/application/steps/AddressStep'
import { BankDetailsStep } from '@/components/application/steps/BankDetailsStep'
import { DocumentsStep } from '@/components/application/steps/DocumentsStep'
import { IdentityStep } from '@/components/application/steps/IdentityStep'
import { PersonalDetailsStep } from '@/components/application/steps/PersonalDetailsStep'
import { ReviewStep } from '@/components/application/steps/ReviewStep'
import { Button } from '@/components/ui/button'
import { useAutoSave } from '@/hooks/useAutoSave'
import { getErrorMessage } from '@/lib/api-error'
import {
  applicationFormSchema,
  getFormDefaults,
  STEP_FIELDS,
  type ApplicationFormValues,
} from '@/lib/application-validation'
import type { ApplicationDTO, UploadDocumentResponse } from '@/types/application.types'

const STEPS: StepMeta[] = [
  { title: 'Personal Details', shortTitle: 'Personal' },
  { title: 'Address', shortTitle: 'Address' },
  { title: 'Identity', shortTitle: 'Identity' },
  { title: 'Bank Details', shortTitle: 'Bank' },
  { title: 'Documents', shortTitle: 'Docs' },
  { title: 'Review', shortTitle: 'Review' },
]

const DOCUMENTS_STEP = 4
const REVIEW_STEP = 5

/** Merges an upload result into the local application snapshot. */
const mergeUpload = (
  app: ApplicationDTO,
  result: UploadDocumentResponse,
): ApplicationDTO => {
  switch (result.documentType) {
    case 'photo':
      return { ...app, photo: result.document }
    case 'aadhaarFront':
      return { ...app, aadhaarFront: result.document }
    case 'aadhaarBack':
      return { ...app, aadhaarBack: result.document }
    case 'pan':
      return { ...app, panImage: result.document }
    case 'cancelledCheque':
      return { ...app, cancelledChequeImage: result.document }
    case 'experienceCertificate':
      return {
        ...app,
        experienceCertificates: [...app.experienceCertificates, result.document],
      }
    default:
      return app
  }
}

const requiredDocsPresent = (app: ApplicationDTO): boolean =>
  Boolean(
    app.photo &&
      app.aadhaarFront &&
      app.aadhaarBack &&
      app.panImage &&
      app.cancelledChequeImage,
  )

interface ApplicationWizardProps {
  initialApplication: ApplicationDTO
  fallbackPhone: string
}

export function ApplicationWizard({
  initialApplication,
  fallbackPhone,
}: ApplicationWizardProps) {
  const navigate = useNavigate()
  const [application, setApplication] = useState<ApplicationDTO>(initialApplication)
  const [currentStep, setCurrentStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: getFormDefaults(initialApplication, fallbackPhone),
    mode: 'onTouched',
  })

  // Auto-save persists text fields; documents are preserved from local state
  // (they are managed via the upload endpoint, not PUT).
  const handleSaved = useCallback((updated: ApplicationDTO) => {
    setApplication((prev) => ({
      ...updated,
      photo: prev.photo,
      aadhaarFront: prev.aadhaarFront,
      aadhaarBack: prev.aadhaarBack,
      panImage: prev.panImage,
      cancelledChequeImage: prev.cancelledChequeImage,
      experienceCertificates: prev.experienceCertificates,
    }))
  }, [])

  const { status: saveStatus, saveNow } = useAutoSave(form, handleSaved)

  const applyUpload = useCallback((result: UploadDocumentResponse) => {
    setApplication((prev) => mergeUpload(prev, result))
    // A successful upload clears any "documents required" error.
    setFormError(null)
  }, [])

  const goToStep = useCallback((index: number) => {
    setFormError(null)
    setCurrentStep(index)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleNext = useCallback(async () => {
    setFormError(null)

    if (currentStep === DOCUMENTS_STEP) {
      if (!requiredDocsPresent(application)) {
        setFormError('Please upload all required documents before continuing.')
        return
      }
      goToStep(currentStep + 1)
      return
    }

    const fields = STEP_FIELDS[currentStep]
    const valid = fields ? await form.trigger(fields) : true
    if (!valid) return

    // Flush pending auto-save so "Save & Next" truly persists before advancing.
    setAdvancing(true)
    try {
      await saveNow()
    } finally {
      setAdvancing(false)
    }
    goToStep(currentStep + 1)
  }, [application, currentStep, form, goToStep, saveNow])

  const handleSubmit = useCallback(async () => {
    setFormError(null)
    const valid = await form.trigger()
    if (!valid) {
      setFormError('Some details are incomplete. Please review the highlighted sections.')
      return
    }
    if (!requiredDocsPresent(application)) {
      setFormError('Please upload all required documents before submitting.')
      return
    }

    setSubmitting(true)
    try {
      await saveNow()
      await submitApplication()
      navigate('/application/status', { replace: true })
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to submit your application.'))
      setSubmitting(false)
    }
  }, [application, form, navigate, saveNow])

  const completedSteps = useMemo(
    () => Array.from({ length: currentStep }, (_, i) => i),
    [currentStep],
  )

  const wizardValue = useMemo(
    () => ({ application, applyUpload, goToStep }),
    [application, applyUpload, goToStep],
  )

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <PersonalDetailsStep key="step-0" />
      case 1:
        return <AddressStep key="step-1" />
      case 2:
        return <IdentityStep key="step-2" />
      case 3:
        return <BankDetailsStep key="step-3" />
      case 4:
        return <DocumentsStep key="step-4" />
      default:
        return <ReviewStep key="step-5" />
    }
  }

  return (
    <FormProvider {...form}>
      <WizardContext.Provider value={wizardValue}>
        <WizardLayout
          steps={STEPS}
          currentStep={currentStep}
          completedSteps={completedSteps}
          saveStatus={saveStatus}
          onStepClick={goToStep}
        >
          <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>

          {formError && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {formError}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => goToStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0 || submitting || advancing}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            {currentStep === REVIEW_STEP ? (
              <Button type="button" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Application'}
                {!submitting && <Send className="h-4 w-4" />}
              </Button>
            ) : (
              <Button type="button" onClick={handleNext} disabled={advancing}>
                {advancing ? 'Saving…' : 'Save & Next'}
                {!advancing && <ArrowRight className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </WizardLayout>
      </WizardContext.Provider>
    </FormProvider>
  )
}
