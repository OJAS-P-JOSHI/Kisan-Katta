import { FileText, Plus, Upload } from 'lucide-react'
import { useRef } from 'react'

import { DocumentPreview } from '@/components/application/DocumentPreview'
import { StepCard } from '@/components/application/StepCard'
import { UploadCard } from '@/components/application/UploadCard'
import { useWizard } from '@/components/application/wizard-context'
import { useDocumentUpload } from '@/hooks/useDocumentUpload'

const MAX_CERTIFICATES = 5

function ExperienceCertificatesUploader() {
  const { application, applyUpload } = useWizard()
  const inputRef = useRef<HTMLInputElement>(null)
  const { status, progress, error, upload } = useDocumentUpload()

  const certificates = application.experienceCertificates ?? []
  const reachedLimit = certificates.length >= MAX_CERTIFICATES
  const isUploading = status === 'uploading'

  const onChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (file) void upload('experienceCertificate', file, applyUpload)
    e.target.value = ''
  }

  return (
    <div className="rounded-2xl border border-border bg-white/70 p-4 shadow-soft">
      <div className="mb-3">
        <p className="text-sm font-semibold text-ink">Experience Certificates (optional)</p>
        <p className="text-xs text-muted-foreground">
          Upload up to {MAX_CERTIFICATES} certificates. {certificates.length}/{MAX_CERTIFICATES} added.
        </p>
      </div>

      {certificates.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {certificates.map((cert, index) => (
            <DocumentPreview
              key={cert.publicId}
              url={cert.url}
              alt={cert.label ?? `Certificate ${index + 1}`}
            />
          ))}
        </div>
      )}

      {!reachedLimit && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-cream/50 px-4 py-4 text-sm font-medium text-slate transition-colors hover:border-forest-500 hover:bg-forest-50 disabled:opacity-60"
        >
          {isUploading ? (
            <>
              <Upload className="h-4 w-4 animate-pulse" /> Uploading… {progress}%
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" /> Add certificate
            </>
          )}
        </button>
      )}

      {status === 'error' && error && (
        <p className="mt-2 text-xs font-medium text-red-600">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onChange}
      />
    </div>
  )
}

export function DocumentsStep() {
  const { application, applyUpload } = useWizard()

  return (
    <StepCard
      icon={FileText}
      title="Documents"
      description="Upload clear images. JPEG, PNG or WebP, up to 5 MB each."
    >
      <UploadCard
        label="Passport Photo"
        documentType="photo"
        document={application.photo}
        required
        onUploaded={applyUpload}
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
      <UploadCard
        label="PAN Card"
        documentType="pan"
        document={application.panImage}
        required
        onUploaded={applyUpload}
      />
      <ExperienceCertificatesUploader />
    </StepCard>
  )
}
