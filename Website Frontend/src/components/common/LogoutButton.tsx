import { useQueryClient } from '@tanstack/react-query'
import { Loader2, LogOut } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useToast } from '@/components/common/Toast'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/i18n/LanguageProvider'
import { cn } from '@/lib/utils'

interface LogoutButtonProps {
  className?: string
  /** Where to send the user after a clean sign-out. Defaults to `/login`. */
  redirectTo?: string
  size?: 'sm' | 'default'
}

/**
 * Premium logout control used on authenticated shells.
 * Clears auth + React Query cache, prevents double-submit, and toasts result.
 */
export function LogoutButton({
  className,
  redirectTo = '/login',
  size = 'sm',
}: LogoutButtonProps) {
  const { t } = useTranslation()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { success, error: toastError } = useToast()
  const [busy, setBusy] = useState(false)

  const handleLogout = useCallback(async () => {
    if (busy) return
    setBusy(true)
    try {
      const { remoteOk } = await logout()
      queryClient.clear()
      if (remoteOk) {
        success(t('common.logoutSuccess'))
      } else {
        // Local session cleared; remote ack failed (offline / expired / 5xx).
        toastError(t('common.logoutNetworkHint'))
      }
      window.setTimeout(() => {
        navigate(redirectTo, { replace: true })
      }, 280)
    } catch {
      queryClient.clear()
      toastError(t('common.logoutNetworkHint'))
      navigate(redirectTo, { replace: true })
    }
  }, [busy, logout, navigate, queryClient, redirectTo, success, t, toastError])

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={() => void handleLogout()}
      disabled={busy}
      aria-busy={busy}
      className={cn(
        'group/logout gap-2 border-border/80 bg-white/80 px-3.5 shadow-soft backdrop-blur-sm',
        'hover:border-forest-100 hover:bg-forest-50 hover:text-forest-900 hover:shadow-card',
        'focus-visible:ring-forest-700/40',
        'active:scale-[0.97]',
        className,
      )}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-forest-700" aria-hidden />
      ) : (
        <LogOut
          className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover/logout:-translate-x-0.5"
          aria-hidden
        />
      )}
      <span className="leading-none tracking-tight">
        {busy ? t('common.signingOut') : t('common.logout')}
      </span>
    </Button>
  )
}
