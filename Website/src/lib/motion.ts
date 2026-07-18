export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
} as const

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
} as const

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
} as const

export const cardHover = {
  rest: { y: 0, boxShadow: '0 8px 32px -8px rgb(26 28 25 / 0.1)' },
  hover: { y: -6, boxShadow: '0 16px 48px -12px rgb(26 28 25 / 0.14)' },
} as const

export const defaultTransition = {
  duration: 0.5,
  ease: [0.22, 1, 0.36, 1] as const,
}
