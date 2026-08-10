import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence } from 'framer-motion'
import { AlertCircle, ArrowLeft, ArrowRight, CreditCard, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import { WizardLayout } from '@/components/application/WizardLayout'
import type { StepMeta } from '@/components/application/Stepper'
import { WizardContext } from '@/components/application/wizard-context'
import { AadhaarStep } from '@/components/application/steps/AadhaarStep'
import { AddressStep } from '@/components/application/steps/AddressStep'
import { BankDetailsStep } from '@/components/application/steps/BankDetailsStep'
import { PersonalDetailsStep } from '@/components/application/steps/PersonalDetailsStep'
import { ReviewStep } from '@/components/application/steps/ReviewStep'
import { Button } from '@/components/ui/button'
import { useApplicationPayment } from '@/hooks/useApplicationPayment'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { TranslationKeys } from '@/i18n/translations'
import {
  createApplicationFormSchema,
  getFormDefaults,
  STEP_FIELDS,
  type ApplicationFormValues,
} from '@/lib/application-validation'
import { paymentDebug } from '@/lib/payment-debug'
import type { ApplicationDTO, UploadDocumentResponse } from '@/types/application.types'

const STEP_KEYS: { titleKey: TranslationKeys; shortKey: TranslationKeys }[] = [
  {
    titleKey: 'app.wizard.steps.personal.title',
    shortKey: 'app.wizard.steps.personal.short',
  },
  {
    titleKey: 'app.wizard.steps.address.title',
    shortKey: 'app.wizard.steps.address.short',
  },
  {
    titleKey: 'app.wizard.steps.aadhaar.title',
    shortKey: 'app.wizard.steps.aadhaar.short',
  },
  {
    titleKey: 'app.wizard.steps.bank.title',
    shortKey: 'app.wizard.steps.bank.short',
  },
  {
    titleKey: 'app.wizard.steps.review.title',
    shortKey: 'app.wizard.steps.review.short',
  },
]

const AADHAAR_STEP = 2
const BANK_STEP = 3
const REVIEW_STEP = 4

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
    case 'cancelledCheque':
      return { ...app, cancelledChequeImage: result.document }
    default:
      return app
  }
}

/** Docs required by backend assertSubmitReady (photo is optional). */
const requiredDocsPresent = (app: ApplicationDTO): boolean =>
  Boolean(app.aadhaarFront && app.aadhaarBack && app.cancelledChequeImage)

interface ApplicationWizardProps {
  initialApplication: ApplicationDTO
  fallbackPhone: string
}

export function ApplicationWizard({
  initialApplication,
  fallbackPhone,
}: ApplicationWizardProps) {
  const { t, locale } = useTranslation()
  const [application, setApplication] = useState<ApplicationDTO>(initialApplication)
  const [currentStep, setCurrentStep] = useState(0)
  const [advancing, setAdvancing] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const steps: StepMeta[] = useMemo(
    () =>
      STEP_KEYS.map((step) => ({
        title: t(step.titleKey),
        shortTitle: t(step.shortKey),
      })),
    [t],
  )

  const schema = useMemo(() => createApplicationFormSchema(t), [t])
  const schemaRef = useRef(schema)
  schemaRef.current = schema

  const form = useForm<ApplicationFormValues>({
    resolver: (values, context, options) =>
      zodResolver(schemaRef.current)(values, context, options),
    defaultValues: getFormDefaults(initialApplication, fallbackPhone),
    mode: 'onTouched',
  })

  useEffect(() => {
    form.clearErrors()
  }, [locale, form])

  const payment = useApplicationPayment({
    name: form.getValues('fullName') || undefined,
    contact: form.getValues('phone') || fallbackPhone || undefined,
    email: form.getValues('email') || undefined,
  })

  const handleSaved = useCallback((updated: ApplicationDTO) => {
    setApplication((prev) => ({
      ...updated,
      photo: prev.photo,
      aadhaarFront: prev.aadhaarFront,
      aadhaarBack: prev.aadhaarBack,
      cancelledChequeImage: prev.cancelledChequeImage,
    }))
  }, [])

  const { status: saveStatus, saveNow } = useAutoSave(
    form,
    handleSaved,
    !payment.awaitingPayment,
  )

  const applyUpload = useCallback((result: UploadDocumentResponse) => {
    setApplication((prev) => mergeUpload(prev, result))
    setFormError(null)
  }, [])

  const goToStep = useCallback((index: number) => {
    setFormError(null)
    setCurrentStep(index)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleNext = useCallback(async () => {
    setFormError(null)

    if (currentStep === AADHAAR_STEP) {
      const fields = STEP_FIELDS[AADHAAR_STEP]
      const valid = fields ? await form.trigger(fields) : true
      if (!valid) return
      if (!application.aadhaarFront || !application.aadhaarBack) {
        setFormError('Please upload Aadhaar front and back before continuing.')
        return
      }
      setAdvancing(true)
      try {
        await saveNow()
      } finally {
        setAdvancing(false)
      }
      goToStep(currentStep + 1)
      return
    }

    if (currentStep === BANK_STEP) {
      const fields = STEP_FIELDS[BANK_STEP]
      const valid = fields ? await form.trigger(fields) : true
      if (!valid) return
      if (!application.cancelledChequeImage) {
        setFormError('Please upload a cancelled cheque or passbook image.')
        return
      }
      setAdvancing(true)
      try {
        await saveNow()
      } finally {
        setAdvancing(false)
      }
      goToStep(currentStep + 1)
      return
    }

    const fields = STEP_FIELDS[currentStep]
    const valid = fields ? await form.trigger(fields) : true
    if (!valid) return

    setAdvancing(true)
    try {
      await saveNow()
    } finally {
      setAdvancing(false)
    }
    goToStep(currentStep + 1)
  }, [application, currentStep, form, goToStep, saveNow])

  const handlePayAndSubmit = useCallback(async () => {
    setFormError(null)
    const valid = await form.trigger()
    if (!valid) {
      setFormError('Some details are incomplete. Please review the highlighted sections.')
      return
    }
    if (!requiredDocsPresent(application)) {
      setFormError('Please upload Aadhaar front, Aadhaar back, and cancelled cheque / passbook.')
      return
    }

    await saveNow()
    paymentDebug('User clicked Pay', {
      applicationId: application.id,
      applicationNumber: application.applicationNumber,
      currentPaymentStatus: application.paymentStatus,
      currentStatus: application.status,
    })
    await payment.payAndSubmit()
  }, [application, form, payment, saveNow])

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
        return <AadhaarStep key="step-2" />
      case 3:
        return <BankDetailsStep key="step-3" />
      default:
        return <ReviewStep key="step-4" editable={!payment.awaitingPayment} />
    }
  }

  const displayError = formError || payment.error
  const locked = payment.busy

  return (
    <FormProvider {...form}>
      <WizardContext.Provider value={wizardValue}>
        <WizardLayout
          steps={steps}
          currentStep={currentStep}
          completedSteps={completedSteps}
          saveStatus={saveStatus}
          onStepClick={payment.awaitingPayment ? undefined : goToStep}
        >
          <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>

          {currentStep === REVIEW_STEP && (
            <div className="mt-6 rounded-2xl border border-forest-100 bg-forest-50/60 p-5 sm:p-6">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-semibold text-ink">Registration Fee</p>
                <p className="text-2xl font-bold text-forest-900">₹500</p>
              </div>
              <p className="mt-3 text-sm text-slate">
                By clicking the button below you agree to submit your application after
                successful payment.
              </p>
            </div>
          )}

          {displayError && (
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                {payment.phase === 'failed' && !formError ? (
                  <>
                    <p>{t('app.status.paymentNotCompletedTitle')}</p>
                    <p className="mt-1 font-normal text-red-500">
                      {t('app.status.paymentNotCompletedBody')}
                    </p>
                    {payment.error && (
                      <p className="mt-1 font-normal text-red-500">{payment.error}</p>
                    )}
                  </>
                ) : (
                  displayError
                )}
              </div>
            </div>
          )}

          {payment.loadingLabel && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              {payment.loadingLabel}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => goToStep(Math.max(0, currentStep - 1))}
              disabled={
                currentStep === 0 ||
                locked ||
                advancing ||
                payment.awaitingPayment
              }
            >
              <ArrowLeft className="h-4 w-4" />
              {t('app.wizard.back')}
            </Button>

            {currentStep === REVIEW_STEP ? (
              payment.awaitingPayment && payment.phase === 'failed' ? (
                <Button type="button" onClick={() => void payment.retryPayment()} disabled={locked}>
                  {locked ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('common.pleaseWait')}
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      {t('app.wizard.retryPayment')}
                    </>
                  )}
                </Button>
              ) : (
                <Button type="button" onClick={() => void handlePayAndSubmit()} disabled={locked}>
                  {locked ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('common.pleaseWait')}
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      {t('app.wizard.payAndSubmit')}
                    </>
                  )}
                </Button>
              )
            ) : (
              <Button type="button" onClick={() => void handleNext()} disabled={advancing || locked}>
                {advancing ? t('app.autosave.saving') : t('app.wizard.next')}
                {!advancing && <ArrowRight className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </WizardLayout>
      </WizardContext.Provider>
    </FormProvider>
  )
}
