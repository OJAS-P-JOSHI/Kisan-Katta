import { z } from 'zod'

import { GENDERS, type ApplicationDTO, type UpdateApplicationBody } from '@/types/application.types'

/**
 * Validation for the Gram Sahakari wizard, replicated byte-for-byte from the
 * backend (`gram-sahakari.constants.ts` + `application.validation.ts`). Single
 * source of truth — do not duplicate these regex elsewhere.
 */
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/
export const PINCODE_REGEX = /^[1-9][0-9]{5}$/
export const AADHAAR_REGEX = /^[0-9]{12}$/
export const INDIAN_PHONE_REGEX = /^(\+91[6-9][0-9]{9}|[6-9][0-9]{9})$/
export const BANK_ACCOUNT_REGEX = /^[0-9]{9,18}$/
export const WHY_JOIN_MIN = 20

const dobRefinement = (value: string): boolean => {
  if (Number.isNaN(Date.parse(value))) return false
  return new Date(value).getTime() <= Date.now()
}

/**
 * Per-field schemas. Each mirrors a backend rule so a value that passes here
 * will pass the backend's `PUT /application` validation.
 */
const fieldValidators = {
  fullName: z.string().trim().min(1, 'Full name is required.'),
  phone: z
    .string()
    .trim()
    .regex(INDIAN_PHONE_REGEX, 'Enter a valid Indian mobile number.'),
  email: z.string().trim().email('Enter a valid email address.'),
  gender: z
    .string()
    .refine((v) => (GENDERS as readonly string[]).includes(v), 'Please select a gender.'),
  dob: z.string().trim().refine(dobRefinement, 'Enter a valid date of birth.'),
  district: z.string().trim().min(1, 'Select a district.'),
  taluka: z.string().trim().min(1, 'Taluka is required.'),
  village: z.string().trim().min(1, 'Village is required.'),
  address: z.string().trim().min(1, 'Address is required.'),
  pincode: z.string().trim().regex(PINCODE_REGEX, 'Enter a valid 6-digit pincode.'),
  aadhaarNumber: z
    .string()
    .trim()
    .regex(AADHAAR_REGEX, 'Aadhaar must be exactly 12 digits.'),
  panNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(PAN_REGEX, 'PAN must match format ABCDE1234F.'),
  bankAccountHolder: z.string().trim().min(1, 'Account holder name is required.'),
  bankAccountNumber: z
    .string()
    .trim()
    .regex(BANK_ACCOUNT_REGEX, 'Account number must be 9 to 18 digits.'),
  bankIFSC: z
    .string()
    .trim()
    .toUpperCase()
    .regex(IFSC_REGEX, 'IFSC must match format ABCD0123456.'),
  bankName: z.string().trim().min(1, 'Bank name is required.'),
  education: z.string().trim().min(1, 'Education is required.'),
  occupation: z.string().trim().min(1, 'Occupation is required.'),
  languages: z
    .array(z.string().trim().min(1))
    .min(1, 'Select at least one language.'),
  experience: z.string().trim().min(1),
  whyJoin: z
    .string()
    .trim()
    .min(WHY_JOIN_MIN, `Please write at least ${WHY_JOIN_MIN} characters.`),
} as const

/** Full form schema used by React Hook Form's resolver. */
export const applicationFormSchema = z.object({
  fullName: fieldValidators.fullName,
  dob: fieldValidators.dob,
  gender: fieldValidators.gender,
  phone: fieldValidators.phone,
  email: fieldValidators.email,
  district: fieldValidators.district,
  taluka: fieldValidators.taluka,
  village: fieldValidators.village,
  address: fieldValidators.address,
  pincode: fieldValidators.pincode,
  aadhaarNumber: fieldValidators.aadhaarNumber,
  panNumber: fieldValidators.panNumber,
  education: fieldValidators.education,
  occupation: fieldValidators.occupation,
  languages: fieldValidators.languages,
  experience: z.string(),
  whyJoin: fieldValidators.whyJoin,
  bankAccountHolder: fieldValidators.bankAccountHolder,
  bankAccountNumber: fieldValidators.bankAccountNumber,
  bankIFSC: fieldValidators.bankIFSC,
  bankName: fieldValidators.bankName,
})

export type ApplicationFormValues = {
  fullName: string
  dob: string
  gender: string
  phone: string
  email: string
  district: string
  taluka: string
  village: string
  address: string
  pincode: string
  aadhaarNumber: string
  panNumber: string
  education: string
  occupation: string
  languages: string[]
  experience: string
  whyJoin: string
  bankAccountHolder: string
  bankAccountNumber: string
  bankIFSC: string
  bankName: string
}

/** Field groups per wizard step, used to trigger validation before advancing. */
export const STEP_FIELDS: Record<number, (keyof ApplicationFormValues)[]> = {
  0: ['fullName', 'dob', 'gender', 'phone', 'email'],
  1: ['district', 'taluka', 'village', 'address', 'pincode'],
  2: ['aadhaarNumber', 'panNumber', 'education', 'occupation', 'languages', 'whyJoin'],
  3: ['bankAccountHolder', 'bankAccountNumber', 'bankIFSC', 'bankName'],
}

/** ISO date-time → `YYYY-MM-DD` for a native date input. */
export const isoToDateInput = (iso: string | null): string =>
  iso ? iso.slice(0, 10) : ''

/** Seeds the RHF form from a (possibly empty) draft application. */
export const getFormDefaults = (
  application: ApplicationDTO,
  fallbackPhone = '',
): ApplicationFormValues => ({
  fullName: application.fullName ?? '',
  dob: isoToDateInput(application.dob),
  gender: application.gender ?? '',
  phone: application.phone ?? fallbackPhone,
  email: application.email ?? '',
  district: application.district ?? '',
  taluka: application.taluka ?? '',
  village: application.village ?? '',
  address: application.address ?? '',
  pincode: application.pincode ?? '',
  aadhaarNumber: application.aadhaarNumber ?? '',
  panNumber: application.panNumber ?? '',
  education: application.education ?? '',
  occupation: application.occupation ?? '',
  languages: application.languages ?? [],
  experience: application.experience ?? '',
  whyJoin: application.whyJoin ?? '',
  bankAccountHolder: application.bankAccountHolder ?? '',
  bankAccountNumber: application.bankAccountNumber ?? '',
  bankIFSC: application.bankIFSC ?? '',
  bankName: application.bankName ?? '',
})

/**
 * Builds a `PUT /application` payload containing only fields that are non-empty
 * AND individually valid, so partially-typed values never trigger a 400 during
 * auto-save. Matches the backend's strict, per-field validation.
 */
export const buildUpdatePayload = (
  values: ApplicationFormValues,
): UpdateApplicationBody => {
  const payload: UpdateApplicationBody = {}

  ;(Object.keys(fieldValidators) as (keyof typeof fieldValidators)[]).forEach(
    (key) => {
      if (key === 'languages') {
        const langs = values.languages
        if (Array.isArray(langs) && langs.length > 0) {
          const parsed = fieldValidators.languages.safeParse(langs)
          if (parsed.success) payload.languages = parsed.data
        }
        return
      }

      const raw = values[key]
      if (typeof raw !== 'string' || raw.trim() === '') return

      const parsed = fieldValidators[key].safeParse(raw)
      if (parsed.success) {
        // parsed.data applies trim/uppercase transforms where relevant.
        ;(payload as Record<string, unknown>)[key] = parsed.data
      }
    },
  )

  return payload
}
