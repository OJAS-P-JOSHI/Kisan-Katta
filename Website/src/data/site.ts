export const navLinks = [
  { key: 'nav.home' as const, href: '/' },
  { key: 'nav.about' as const, href: '/about' },
  { key: 'nav.features' as const, href: '/features' },
  { key: 'nav.gramSahakari' as const, href: '/become-gram-sahakari' },
  { key: 'nav.faq' as const, href: '/faq' },
  { key: 'nav.contact' as const, href: '/contact' },
] as const

export const drawerPortalLinks = [
  { key: 'nav.portal' as const, href: '/login', highlight: true as const },
  { key: 'nav.login' as const, href: '/login', highlight: false as const },
] as const

export const footerLinks = {
  quick: [
    { key: 'nav.about' as const, href: '/about' },
    { key: 'nav.features' as const, href: '/features' },
    { key: 'nav.gramSahakari' as const, href: '/become-gram-sahakari' },
    { key: 'nav.faq' as const, href: '/faq' },
    { key: 'nav.contact' as const, href: '/contact' },
  ],
  support: [
    { key: 'footer.helpCenter' as const, href: '/faq' },
    { key: 'footer.contactSupport' as const, href: '/contact' },
    { key: 'nav.portal' as const, href: '/login' },
  ],
  legal: [
    { key: 'footer.privacy' as const, href: '/privacy' },
    { key: 'footer.terms' as const, href: '/terms' },
  ],
} as const

export const contactInfo = {
  email: 'support@kisankatta.in',
  phone: '+91 98765 43210',
  address: 'Pune, Maharashtra, India',
} as const

export const appDownloadHref = '#download'
