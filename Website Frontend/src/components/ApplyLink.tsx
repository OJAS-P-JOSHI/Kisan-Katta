import { Link, type LinkProps } from 'react-router-dom'

import { APPLICATION_ENTRY_PATH } from '@/lib/application-entry'
import { cn } from '@/lib/utils'

type ApplyLinkProps = Omit<LinkProps, 'to'> & {
  className?: string
}

/**
 * Primary CTA into the Gram Sahakari application flow.
 *
 * Routes to `/application`. Unauthenticated users are sent to login by
 * `ProtectedRoute` (with `from` preserved). Authenticated users with a
 * non-DRAFT application are redirected to the status page by `ApplicationPage`.
 */
export function ApplyLink({ className, children, ...props }: ApplyLinkProps) {
  return (
    <Link to={APPLICATION_ENTRY_PATH} className={cn(className)} {...props}>
      {children}
    </Link>
  )
}
