import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { Input } from '@/components/ui/input'
import type { ApplicationFormValues } from '@/lib/application-validation'
import { cn } from '@/lib/utils'

type FieldName = keyof ApplicationFormValues

function FieldShell({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
}: {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

type TextFieldProps = {
  name: FieldName
  label: string
  placeholder?: string
  type?: string
  inputMode?: 'text' | 'numeric' | 'email' | 'tel'
  maxLength?: number
  required?: boolean
  hint?: string
  autoComplete?: string
  /** Sanitizes each keystroke (e.g. digits-only, uppercase). */
  transform?: (value: string) => string
}

export function TextField({
  name,
  label,
  placeholder,
  type = 'text',
  inputMode,
  maxLength,
  required,
  hint,
  autoComplete,
  transform,
}: TextFieldProps) {
  const { control } = useFormContext<ApplicationFormValues>()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FieldShell label={label} htmlFor={name} required={required} error={fieldState.error?.message} hint={hint}>
          <Input
            id={name}
            type={type}
            inputMode={inputMode}
            maxLength={maxLength}
            autoComplete={autoComplete}
            placeholder={placeholder}
            aria-invalid={Boolean(fieldState.error)}
            value={typeof field.value === 'string' ? field.value : ''}
            onBlur={field.onBlur}
            onChange={(e) =>
              field.onChange(transform ? transform(e.target.value) : e.target.value)
            }
            className={cn(fieldState.error && 'border-red-400 focus-visible:ring-red-400')}
          />
        </FieldShell>
      )}
    />
  )
}

type SelectFieldProps = {
  name: FieldName
  label: string
  options: { value: string; label: string }[]
  placeholder?: string
  required?: boolean
  hint?: string
}

export function SelectField({
  name,
  label,
  options,
  placeholder = 'Select…',
  required,
  hint,
}: SelectFieldProps) {
  const { control } = useFormContext<ApplicationFormValues>()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FieldShell label={label} htmlFor={name} required={required} error={fieldState.error?.message} hint={hint}>
          <div className="relative">
            <select
              id={name}
              value={typeof field.value === 'string' ? field.value : ''}
              onBlur={field.onBlur}
              onChange={(e) => field.onChange(e.target.value)}
              aria-invalid={Boolean(fieldState.error)}
              className={cn(
                'h-12 w-full appearance-none rounded-xl border border-border bg-white px-4 pr-10 text-base text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                !field.value && 'text-muted-foreground',
                fieldState.error && 'border-red-400 focus-visible:ring-red-400',
              )}
            >
              <option value="" disabled>
                {placeholder}
              </option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </FieldShell>
      )}
    />
  )
}

type TextAreaFieldProps = {
  name: FieldName
  label: string
  placeholder?: string
  rows?: number
  required?: boolean
  hint?: string
  showCount?: boolean
}

export function TextAreaField({
  name,
  label,
  placeholder,
  rows = 4,
  required,
  hint,
  showCount,
}: TextAreaFieldProps) {
  const { control } = useFormContext<ApplicationFormValues>()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const value = typeof field.value === 'string' ? field.value : ''
        return (
          <FieldShell
            label={label}
            htmlFor={name}
            required={required}
            error={fieldState.error?.message}
            hint={hint}
          >
            <textarea
              id={name}
              rows={rows}
              placeholder={placeholder}
              value={value}
              onBlur={field.onBlur}
              onChange={(e) => field.onChange(e.target.value)}
              aria-invalid={Boolean(fieldState.error)}
              className={cn(
                'w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                fieldState.error && 'border-red-400 focus-visible:ring-red-400',
              )}
            />
            {showCount && (
              <p className="text-right text-xs text-muted-foreground">
                {value.trim().length} characters
              </p>
            )}
          </FieldShell>
        )
      }}
    />
  )
}
