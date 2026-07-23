export const navLinks = [
  { key: 'nav.home' as const, href: '/' },
  { key: 'nav.about' as const, href: '/about' },
  { key: 'nav.features' as const, href: '/features' },
  { key: 'nav.gramSahakari' as const, href: '/become-gram-sahakari' },
  { key: 'nav.faq' as const, href: '/faq' },
  { key: 'nav.contact' as const, href: '/contact' },
] as const

/** Primary links shown inline on desktop navigation. */
export const desktopNavLinks = [
  { key: 'nav.home' as const, href: '/' },
  { key: 'nav.about' as const, href: '/about' },
  { key: 'nav.gramSahakari' as const, href: '/become-gram-sahakari' },
  { key: 'nav.contact' as const, href: '/contact' },
] as const

/**
 * Portal enters the application flow (`/application`).
 * Unauthenticated users are redirected to login by ProtectedRoute.
 * Non-DRAFT applications are redirected to status by ApplicationPage.
 */
export const drawerPortalLinks = [
  { key: 'nav.portal' as const, href: '/application', highlight: true as const },
  { key: 'nav.login' as const, href: '/login', highlight: false as const },
] as const

export const footerLinks = {
  company: [
    { key: 'footer.aboutKisanKatta' as const, href: '/about' },
    { key: 'nav.gramSahakari' as const, href: '/become-gram-sahakari' },
    { key: 'nav.contact' as const, href: '/contact' },
  ],
  resources: [
    { key: 'footer.privacy' as const, href: '/privacy-policy' },
    { key: 'footer.terms' as const, href: '/terms-and-conditions' },
    { key: 'footer.refund' as const, href: '/refund-policy' },
  ],
} as const

export const contactInfo = {
  email: 'm.chautmal2020@gmail.com',
  phone: '+91 77410 75483',
  phoneHref: '+917741075483',
  addressLines: [
    'Solanapur',
    'Rahatgaon',
    'Paithan',
    'Chhatrapati Sambhajinagar',
    'Maharashtra – 431107',
  ],
  address: 'Solanapur, Rahatgaon, Paithan, Chhatrapati Sambhajinagar, Maharashtra – 431107',
  hours: {
    daysKey: 'contact.hoursDaysValue' as const,
    timeKey: 'contact.hoursTimeValue' as const,
  },
} as const

/** Scroll target on the landing page download section. */
export const appDownloadHref = '/#download'
