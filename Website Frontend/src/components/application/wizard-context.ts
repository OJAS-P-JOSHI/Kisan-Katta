import { createContext, useContext } from 'react'

import type { ApplicationDTO, UploadDocumentResponse } from '@/types/application.types'

export type WizardContextValue = {
  /** Latest application snapshot (documents live here, not in the form). */
  application: ApplicationDTO
  /** Merge an upload result into the application snapshot. */
  applyUpload: (result: UploadDocumentResponse) => void
  /** Jump to a specific step (used by the Review step's Edit actions). */
  goToStep: (index: number) => void
}

export const WizardContext = createContext<WizardContextValue | undefined>(undefined)

export function useWizard(): WizardContextValue {
  const context = useContext(WizardContext)
  if (!context) {
    throw new Error('useWizard must be used within the application wizard.')
  }
  return context
}
