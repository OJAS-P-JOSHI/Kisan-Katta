import {
  CloudSun,
  Globe,
  Handshake,
  Languages,
  ShoppingBasket,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

export interface Feature {
  id: string
  title: string
  titleMarathi?: string
  description: string
  icon: LucideIcon
}

export const features: Feature[] = [
  {
    id: 'weather',
    title: 'Weather Updates',
    titleMarathi: 'हवामान अद्यतने',
    description:
      'Accurate local weather forecasts and alerts tailored for Maharashtra’s farming seasons and crop cycles.',
    icon: CloudSun,
  },
  {
    id: 'gov-prices',
    title: 'Government Market Prices',
    titleMarathi: 'सरकारी बाजार भाव',
    description:
      'Live mandi rates sourced from official government data — transparent, reliable, and updated daily.',
    icon: TrendingUp,
  },
  {
    id: 'farmer-price',
    title: 'Farmer Expected Price',
    titleMarathi: 'शेतकऱ्यांचा अपेक्षित भाव',
    description:
      'Community-driven price insights from farmers in your district — know what others expect before you sell.',
    icon: Handshake,
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    titleMarathi: 'बाजारपेठ',
    description:
      'Buy and sell produce, seeds, and farm supplies directly within your trusted farming community.',
    icon: ShoppingBasket,
  },
  {
    id: 'marathi',
    title: 'Marathi Language',
    titleMarathi: 'मराठी भाषा',
    description:
      'Built Marathi-first so every farmer in Maharashtra can use the app comfortably in their own language.',
    icon: Languages,
  },
  {
    id: 'community',
    title: 'Community',
    titleMarathi: 'समुदाय',
    description:
      'Connect with fellow farmers, share knowledge, and stay informed about local agricultural developments.',
    icon: Globe,
  },
]

export const whyChooseItems = [
  {
    title: 'Government Data',
    description: 'Official mandi prices you can trust, not guesswork.',
  },
  {
    title: 'Easy to Use',
    description: 'Simple, intuitive design made for farmers of all ages.',
  },
  {
    title: 'Marathi First',
    description: 'Every screen, every label — in the language you speak.',
  },
  {
    title: 'Fast',
    description: 'Lightweight app that works even on basic smartphones.',
  },
  {
    title: 'Reliable',
    description: 'Built for rural connectivity with offline-friendly design.',
  },
  {
    title: 'Community Driven',
    description: 'Powered by farmers, for farmers across Maharashtra.',
  },
]

export const stats = [
  { label: 'Farmers Connected', value: 50000, suffix: '+' },
  { label: 'Districts Covered', value: 36, suffix: '' },
  { label: 'Market Updates Daily', value: 500, suffix: '+' },
  { label: 'Daily Active Users', value: 12000, suffix: '+' },
]
