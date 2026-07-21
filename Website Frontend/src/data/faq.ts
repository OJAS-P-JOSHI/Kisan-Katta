export interface FAQItem {
  id: string
  question: string
  answer: string
}

export const faqItems: FAQItem[] = [
  {
    id: 'what-is-kisan-katta',
    question: 'What is Kisan Katta?',
    answer:
      'Kisan Katta is a Maharashtra-focused AgriTech platform that helps farmers access weather updates, government mandi prices, community price insights, and a local marketplace — all in Marathi.',
  },
  {
    id: 'who-can-use',
    question: 'Who can use the Kisan Katta app?',
    answer:
      'Any farmer, agricultural worker, or rural community member in Maharashtra can download and use the app for free. Gram Sahakari volunteers help onboard new users in villages.',
  },
  {
    id: 'what-is-gram-sahakari',
    question: 'What is a Gram Sahakari?',
    answer:
      'A Gram Sahakari is a trusted village volunteer who helps farmers install the app, guides them through features, promotes digital farming, and connects villages to the Kisan Katta ecosystem.',
  },
  {
    id: 'how-to-become-gram-sahakari',
    question: 'How do I become a Gram Sahakari?',
    answer:
      'Visit the Become Gram Sahakari page, fill out the application form, complete verification and profile setup, and once approved you will receive your digital ID card to start helping farmers.',
  },
  {
    id: 'is-app-free',
    question: 'Is the app free to use?',
    answer:
      'Yes, Kisan Katta is completely free for farmers. There are no hidden charges for accessing weather, market prices, or community features.',
  },
  {
    id: 'which-districts',
    question: 'Which districts does Kisan Katta cover?',
    answer:
      'Kisan Katta is built for all 36 districts of Maharashtra. Market data and community features are localized to your district and nearby mandis.',
  },
  {
    id: 'data-source',
    question: 'Where do market prices come from?',
    answer:
      'Government mandi prices are sourced from official agricultural market data. Farmer expected prices come from community submissions within your district.',
  },
  {
    id: 'contact-support',
    question: 'How can I contact support?',
    answer:
      'You can reach us through the Contact page, email us at support@kisankatta.in, or ask your local Gram Sahakari volunteer for assistance.',
  },
]
