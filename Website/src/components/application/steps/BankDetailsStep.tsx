import { Landmark } from 'lucide-react'

import { StepCard } from '@/components/application/StepCard'
import { UploadCard } from '@/components/application/UploadCard'
import { TextField } from '@/components/application/FormFields'
import { useWizard } from '@/components/application/wizard-context'
import { sanitizeDigits, sanitizeUpperAlnum } from '@/lib/field-transforms'

export function BankDetailsStep() {
  const { application, applyUpload } = useWizard()

  return (
    <StepCard
      icon={Landmark}
      title="Bank Details"
      description="Used for verification and future payouts."
    >
      <TextField
        name="bankAccountHolder"
        label="Account Holder Name"
        placeholder="As per bank records"
        required
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          name="bankAccountNumber"
          label="Account Number"
          inputMode="numeric"
          placeholder="9–18 digits"
          maxLength={18}
          transform={(v) => sanitizeDigits(v, 18)}
          required
        />
        <TextField
          name="bankIFSC"
          label="IFSC Code"
          placeholder="ABCD0123456"
          maxLength={11}
          transform={(v) => sanitizeUpperAlnum(v, 11)}
          required
        />
      </div>
      <TextField name="bankName" label="Bank Name" placeholder="e.g. State Bank of India" required />

      <UploadCard
        label="Cancelled Cheque"
        description="Image of a cancelled cheque for account verification."
        documentType="cancelledCheque"
        document={application.cancelledChequeImage}
        required
        onUploaded={applyUpload}
      />
    </StepCard>
  )
}
