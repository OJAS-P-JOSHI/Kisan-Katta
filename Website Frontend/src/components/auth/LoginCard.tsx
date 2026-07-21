import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Phone } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { COUNTRY_CODE, mobileSchema, sanitizeMobile, type MobileFormValues } from '@/lib/validation'

interface LoginCardProps {
  /** Called with the 10-digit mobile number on valid submit. */
  onSubmit: (mobile: string) => void
  loading: boolean
  /** Backend / network error message to display, if any. */
  serverError?: string | null
  /** Prefills the field (e.g. when returning from the OTP screen). */
  defaultMobile?: string
}

/** Phone-number entry card. Validation is powered by React Hook Form + Zod. */
export function LoginCard({
  onSubmit,
  loading,
  serverError,
  defaultMobile = '',
}: LoginCardProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<MobileFormValues>({
    resolver: zodResolver(mobileSchema),
    defaultValues: { mobile: defaultMobile },
    mode: 'onSubmit',
  })

  const fieldError = errors.mobile?.message
  const displayedError = fieldError ?? serverError ?? null

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(values.mobile))}
      className="space-y-5"
      noValidate
    >
      <div>
        <label htmlFor="mobile" className="mb-2 block text-sm font-medium text-ink">
          Mobile Number
        </label>
        <div className="flex items-stretch gap-2">
          <span className="flex min-h-12 items-center rounded-xl border border-border bg-cream px-3 text-base font-semibold text-forest-900">
            {COUNTRY_CODE}
          </span>
          <div className="relative flex-1">
            <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Controller
              control={control}
              name="mobile"
              render={({ field }) => (
                <Input
                  id="mobile"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="98765 43210"
                  className="min-h-12 pl-11 text-base"
                  aria-invalid={Boolean(displayedError)}
                  value={field.value}
                  onChange={(e) => field.onChange(sanitizeMobile(e.target.value))}
                  onBlur={field.onBlur}
                  autoFocus
                />
              )}
            />
          </div>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {COUNTRY_CODE} prefix added automatically
        </p>
      </div>

      {displayedError && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {displayedError}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? 'Sending OTP…' : 'Send OTP'}
        {!loading && <ArrowRight className="h-4 w-4" />}
      </Button>
    </form>
  )
}
