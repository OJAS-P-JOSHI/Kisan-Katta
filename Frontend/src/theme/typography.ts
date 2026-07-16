/**
 * App-wide typography hierarchy.
 * Use these tokens for visual consistency; prefer Paper Text variants
 * that align closely, then layer these styles for weight/spacing.
 */
export const typography = {
  /** Screen-level hero titles (greeting name, marketplace title). */
  largeHeading: {
    fontSize: 26,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  /** Secondary screen titles (profile name, section heroes). */
  mediumHeading: {
    fontSize: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  /** Section headers and card titles. */
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  /** Primary readable body copy. */
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 22,
  },
  /** Supporting labels, captions, meta. */
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    letterSpacing: 0.1,
    lineHeight: 18,
  },
} as const;

/** Consistent MaterialCommunityIcons sizes across the app. */
export const iconSize = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  hero: 48,
} as const;

export type TypographyToken = keyof typeof typography;
export type IconSizeToken = keyof typeof iconSize;
