import type { Gender } from '@/types/application.types'

/**
 * Dropdown option lists for the application wizard. District values are the
 * canonical Maharashtra district names the backend resolves against
 * (`config/maharashtraDistrictCoordinates.ts`). Education / occupation are
 * free-text on the backend; these are convenience presets.
 */

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
]

/** Canonical Maharashtra districts accepted by the backend. */
export const DISTRICTS: string[] = [
  'Ahmednagar',
  'Akola',
  'Amravati',
  'Beed',
  'Bhandara',
  'Buldhana',
  'Chandrapur',
  'Chhatrapati Sambhajinagar',
  'Dharashiv',
  'Dhule',
  'Gadchiroli',
  'Gondia',
  'Hingoli',
  'Jalgaon',
  'Jalna',
  'Kolhapur',
  'Latur',
  'Mumbai City',
  'Mumbai Suburban',
  'Nagpur',
  'Nanded',
  'Nandurbar',
  'Nashik',
  'Palghar',
  'Parbhani',
  'Pune',
  'Raigad',
  'Ratnagiri',
  'Sangli',
  'Satara',
  'Sindhudurg',
  'Solapur',
  'Thane',
  'Wardha',
  'Washim',
  'Yavatmal',
]

export const EDUCATION_OPTIONS: string[] = [
  'Below 10th',
  '10th Pass (SSC)',
  '12th Pass (HSC)',
  'Diploma',
  'Graduate',
  'Post Graduate',
  'Other',
]

export const OCCUPATION_OPTIONS: string[] = [
  'Farmer',
  'Agriculture Trader',
  'Shopkeeper / Retailer',
  'Self-employed',
  'Student',
  'Private Service',
  'Government Service',
  'Other',
]

export const LANGUAGE_OPTIONS: string[] = [
  'Marathi',
  'Hindi',
  'English',
  'Gujarati',
  'Kannada',
  'Telugu',
  'Urdu',
]
