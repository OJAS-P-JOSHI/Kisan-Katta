import type { TranslationKeys } from '@/i18n/translations'

export interface FAQItem {
  id: string
  questionKey: TranslationKeys
  answerKey: TranslationKeys
}

export const faqItems: FAQItem[] = [
  {
    id: 'what-is-kisan-katta',
    questionKey: 'faq.whatIs.q',
    answerKey: 'faq.whatIs.a',
  },
  {
    id: 'who-can-use',
    questionKey: 'faq.whoCan.q',
    answerKey: 'faq.whoCan.a',
  },
  {
    id: 'what-is-gram-sahakari',
    questionKey: 'faq.whatGram.q',
    answerKey: 'faq.whatGram.a',
  },
  {
    id: 'how-to-become-gram-sahakari',
    questionKey: 'faq.howBecome.q',
    answerKey: 'faq.howBecome.a',
  },
  {
    id: 'is-app-free',
    questionKey: 'faq.isFree.q',
    answerKey: 'faq.isFree.a',
  },
  {
    id: 'which-districts',
    questionKey: 'faq.districts.q',
    answerKey: 'faq.districts.a',
  },
  {
    id: 'data-source',
    questionKey: 'faq.dataSource.q',
    answerKey: 'faq.dataSource.a',
  },
  {
    id: 'contact-support',
    questionKey: 'faq.contact.q',
    answerKey: 'faq.contact.a',
  },
]
