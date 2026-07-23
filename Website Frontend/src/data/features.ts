import {
  CloudSun,
  Globe,
  Handshake,
  Languages,
  ShoppingBasket,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

import type { TranslationKeys } from '@/i18n/translations'

export interface Feature {
  id: string
  titleKey: TranslationKeys
  titleMrKey: TranslationKeys
  descriptionKey: TranslationKeys
  icon: LucideIcon
}

export const features: Feature[] = [
  {
    id: 'weather',
    titleKey: 'feature.weather.title',
    titleMrKey: 'feature.weather.titleMr',
    descriptionKey: 'feature.weather.description',
    icon: CloudSun,
  },
  {
    id: 'gov-prices',
    titleKey: 'feature.govPrices.title',
    titleMrKey: 'feature.govPrices.titleMr',
    descriptionKey: 'feature.govPrices.description',
    icon: TrendingUp,
  },
  {
    id: 'farmer-price',
    titleKey: 'feature.farmerPrice.title',
    titleMrKey: 'feature.farmerPrice.titleMr',
    descriptionKey: 'feature.farmerPrice.description',
    icon: Handshake,
  },
  {
    id: 'marketplace',
    titleKey: 'feature.marketplace.title',
    titleMrKey: 'feature.marketplace.titleMr',
    descriptionKey: 'feature.marketplace.description',
    icon: ShoppingBasket,
  },
  {
    id: 'marathi',
    titleKey: 'feature.marathi.title',
    titleMrKey: 'feature.marathi.titleMr',
    descriptionKey: 'feature.marathi.description',
    icon: Languages,
  },
  {
    id: 'community',
    titleKey: 'feature.community.title',
    titleMrKey: 'feature.community.titleMr',
    descriptionKey: 'feature.community.description',
    icon: Globe,
  },
]

export const whyChooseItems: {
  titleKey: TranslationKeys
  descriptionKey: TranslationKeys
}[] = [
  {
    titleKey: 'why.govData.title',
    descriptionKey: 'why.govData.description',
  },
  {
    titleKey: 'why.easy.title',
    descriptionKey: 'why.easy.description',
  },
  {
    titleKey: 'why.marathi.title',
    descriptionKey: 'why.marathi.description',
  },
  {
    titleKey: 'why.fast.title',
    descriptionKey: 'why.fast.description',
  },
  {
    titleKey: 'why.reliable.title',
    descriptionKey: 'why.reliable.description',
  },
  {
    titleKey: 'why.community.title',
    descriptionKey: 'why.community.description',
  },
]

export const stats: { labelKey: TranslationKeys; value: number; suffix: string }[] = [
  { labelKey: 'stats.farmers', value: 50000, suffix: '+' },
  { labelKey: 'stats.districts', value: 36, suffix: '' },
  { labelKey: 'stats.updates', value: 500, suffix: '+' },
  { labelKey: 'stats.activeUsers', value: 12000, suffix: '+' },
]
