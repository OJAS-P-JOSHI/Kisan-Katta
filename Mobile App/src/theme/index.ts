import { useTheme } from 'react-native-paper';

import type { AppTheme } from './theme';

export { palette, lightColors, type ColorToken } from './colors';
export {
  paperTheme,
  navigationTheme,
  spacing,
  radius,
  elevation,
  cardSurface,
  buttonSurface,
  type AppTheme,
  type Spacing,
  type Radius,
} from './theme';
export {
  typography,
  iconSize,
  type TypographyToken,
  type IconSizeToken,
} from './typography';

/** Strongly-typed accessor for the app theme inside components. */
export const useAppTheme = (): AppTheme => useTheme<AppTheme>();
