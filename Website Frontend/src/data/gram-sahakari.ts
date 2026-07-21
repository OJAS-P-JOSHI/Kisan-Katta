export interface TimelineStep {
  id: string
  title: string
  description: string
}

export const gramSahakariTimelineSteps: TimelineStep[] = [
  {
    id: 'apply',
    title: 'Apply',
    description: 'Submit your application to become a Gram Sahakari volunteer.',
  },
  {
    id: 'verification',
    title: 'Verification',
    description: 'Our team verifies your details and local village connection.',
  },
  {
    id: 'profile',
    title: 'Profile Completion',
    description: 'Complete your profile with photo, district, and village details.',
  },
  {
    id: 'registration',
    title: 'Registration',
    description: 'Finalize your registration in the Gram Sahakari network.',
  },
  {
    id: 'approval',
    title: 'Approval',
    description: 'Receive official approval from the Kisan Katta team.',
  },
  {
    id: 'id-card',
    title: 'Digital ID Card',
    description: 'Get your verified digital Gram Sahakari ID card.',
  },
  {
    id: 'start',
    title: 'Start Helping Farmers',
    description: 'Begin onboarding and guiding farmers in your village.',
  },
]

export const gramSahakariBenefits = [
  {
    title: 'Digital ID Card',
    description: 'Receive an official Gram Sahakari digital ID recognized across Maharashtra.',
  },
  {
    title: 'Serve Your Village',
    description: 'Make a lasting impact by helping fellow farmers adopt digital tools.',
  },
  {
    title: 'Join a Network',
    description: 'Connect with 2,000+ Gram Sahakari volunteers and share best practices.',
  },
  {
    title: 'Community Recognition',
    description: 'Get recognized for your contribution to digital farming in your district.',
  },
]

export const gramSahakariResponsibilities = [
  'Help farmers install the Kisan Katta app',
  'Guide them through weather, prices, and marketplace features',
  'Promote digital farming in your village',
  'Connect your gram panchayat to the Kisan Katta network',
  'Assist farmers with questions and onboarding',
]

export const villageImpactStats = [
  { label: 'Farmers per Village', value: '150+' },
  { label: 'Villages Connected', value: '500+' },
  { label: 'Districts Active', value: '36' },
]

export interface Testimonial {
  id: string
  name: string
  role: string
  location: string
  quote: string
}

export const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Placeholder Farmer',
    role: 'Soybean Farmer',
    location: 'Nashik, Maharashtra',
    quote:
      'Kisan Katta helped me check mandi prices before selling my crop. I got a better rate because I knew what to expect.',
  },
  {
    id: '2',
    name: 'Placeholder Volunteer',
    role: 'Gram Sahakari',
    location: 'Solapur, Maharashtra',
    quote:
      'As a Gram Sahakari, I have helped over 200 farmers in my village use the app. The Marathi interface makes it easy for everyone.',
  },
  {
    id: '3',
    name: 'Placeholder Farmer',
    role: 'Cotton Farmer',
    location: 'Yavatmal, Maharashtra',
    quote:
      'Weather alerts saved my crop last season. I planted at the right time because I had accurate local forecasts.',
  },
]
