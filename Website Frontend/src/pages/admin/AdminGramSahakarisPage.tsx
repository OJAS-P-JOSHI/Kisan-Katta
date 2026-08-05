import { Navigate } from 'react-router-dom'

/** Old Village Representatives route — redirected into the Gram Sahakari hub. */
export function AdminGramSahakarisPage() {
  return (
    <Navigate to="/admin/gram-sahakari?view=representatives" replace />
  )
}
