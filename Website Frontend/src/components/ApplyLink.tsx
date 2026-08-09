import { Link, type LinkProps } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'
import { APPLICATION_ENTRY_PATH } from '@/lib/application-entry'
import { getApplicantEntryPath } from '@/lib/auth-routing'
import { cn } from '@/lib/utils'

type ApplyLinkProps = Omit<LinkProps, 'to'> & {
  className?: string
}

/**
 * Primary CTA into the Gram Sahakari application flow (or Admin Portal).
 *
 * - Unauthenticated → `/application` (ProtectedRoute sends them through login)
 * - Farmer → `/application`
 * - ADMIN → `/admin/dashboard` (never the applicant wizard)
 */
export function ApplyLink({ className, children, ...props }: ApplyLinkProps) {
  const { user, isAuthenticated } = useAuth()
  const to = isAuthenticated ? getApplicantEntryPath(user) : APPLICATION_ENTRY_PATH

  return (
    <Link to={to} className={cn(className)} {...props}>
      {children}
    </Link>
  )
}
