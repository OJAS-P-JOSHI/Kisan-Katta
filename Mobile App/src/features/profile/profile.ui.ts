import { StyleSheet, type ViewStyle } from 'react-native';

import { elevation, palette, radius, spacing } from '@/theme';

/**
 * Profile-tab presentation tokens. Colors stay on the existing Agrisathi
 * palette — this file does not introduce a new brand.
 */
export const profileUi = {
  /** Must match `HeaderLandscapeStrip` cream so the scenic fade is seamless. */
  cream: '#FDF9F3',
  heading: palette.green900,
  primary: palette.green700,
  body: palette.slate,
  muted: palette.steel,
  white: palette.white,
  wash: palette.green50,
  line: 'rgba(46, 125, 50, 0.10)',
  logoutWash: palette.red100,
} as const;

export const profileCard: ViewStyle = {
  backgroundColor: profileUi.white,
  borderRadius: radius.xl,
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: profileUi.line,
  overflow: 'hidden',
  ...elevation.card,
};

export function profilePadX(width: number): number {
  if (width >= 600) return Math.max(spacing.lg, Math.round((width - 520) / 2));
  const scale = Math.min(Math.max(width / 390, 0.82), 1.06);
  return Math.max(14, Math.min(20, Math.round(18 * scale)));
}

export function profileAvatarSize(width: number): number {
  if (width < 360) return 112;
  if (width < 390) return 120;
  if (width >= 600) return 140;
  return 128;
}

export function profileNameSize(width: number): number {
  if (width < 360) return 24;
  if (width >= 600) return 30;
  return 28;
}

export function profileScrollBottomPad(safeBottom: number): number {
  return spacing.xxl * 2 + Math.max(safeBottom, spacing.sm);
}
