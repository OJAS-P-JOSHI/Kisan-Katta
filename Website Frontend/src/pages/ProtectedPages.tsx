import { motion } from 'framer-motion'
import { LogOut } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { BrandLogo } from '@/components/common/BrandLogo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { defaultTransition, fadeUp } from '@/lib/motion'

function AuthenticatedShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async (): Promise<void> => {
    setLoggingOut(true)
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <BrandLogo size="md" />
        <div className="flex items-center gap-3">
          {user?.mobile && (
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user.mobile}
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut className="h-4 w-4" />
            {loggingOut ? 'Signing out…' : 'Logout'}
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={defaultTransition}
          className="w-full max-w-lg"
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}

function ComingSoon({ title, marathi }: { title: string; marathi: string }) {
  return (
    <AuthenticatedShell>
      <div className="glass rounded-3xl p-8 text-center shadow-lift">
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        <p className="font-marathi mt-1 text-sm text-forest-700">{marathi}</p>
        <p className="mt-6 text-sm text-muted-foreground">Coming soon.</p>
        <Link
          to="/application"
          className="mt-6 inline-block text-sm font-semibold text-forest-700 hover:text-forest-900"
        >
          ← Back to Application
        </Link>
      </div>
    </AuthenticatedShell>
  )
}

export function ProfilePage() {
  return <ComingSoon title="Profile" marathi="प्रोफाइल" />
}
