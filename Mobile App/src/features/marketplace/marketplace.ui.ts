import { Platform, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

/**
 * Marketplace visual tokens — aligned with the hub (cream, Agrisathi green,
 * harvest gold, labour blue). Presentation only.
 */
export const mp = {
  cream: '#FDF9F3',
  headingGreen: '#1B5E20',
  primaryGreen: '#006A2C',
  tagline: '#5C5348',
  bodyGrey: '#6B6560',
  muted: '#8A847C',
  white: '#FFFFFF',
  searchBorder: '#E4DFD4',
  searchBorderFocus: '#8FBF98',
  searchWashFocus: '#F7FBF7',
  produceBg: '#E8F5EC',
  produceWash: '#D7EEDD',
  productBg: '#F6EEDC',
  productWash: '#EFE3C8',
  productCta: '#C9A227',
  productTitle: '#3E3428',
  labourBg: '#E4EEF5',
  labourWash: '#D3E2EE',
  labourTitle: '#2F5F7A',
  cardLine: 'rgba(27, 94, 32, 0.09)',
  infoBorder: 'rgba(0, 106, 44, 0.16)',
  inkShadow: '#1A1C19',
  whatsapp: '#128C7E',
} as const;

export const mpRadius = {
  card: 18,
  tile: 16,
  control: 14,
  chip: 999,
} as const;

export const mpShadow = {
  card: {
    shadowColor: mp.inkShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  soft: {
    shadowColor: mp.inkShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;

export const listingTypeAccent = {
  produce: mp.primaryGreen,
  product: mp.productCta,
  labour: mp.labourTitle,
} as const;

export const listingTypeWash = {
  produce: mp.produceBg,
  product: mp.productBg,
  labour: mp.labourBg,
} as const;

export const mpCard: ViewStyle = {
  backgroundColor: mp.white,
  borderRadius: mpRadius.card,
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: mp.cardLine,
  ...mpShadow.card,
};

export const mpSearchPill: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  minHeight: 50,
  borderRadius: 999,
  backgroundColor: mp.white,
  borderWidth: 1,
  borderColor: mp.searchBorder,
  paddingHorizontal: 4,
  ...mpShadow.soft,
};

export const mpSearchInput: TextStyle = {
  flex: 1,
  minWidth: 0,
  minHeight: 44,
  paddingVertical: Platform.OS === 'android' ? 0 : 8,
  color: mp.headingGreen,
  fontWeight: '500',
  textAlignVertical: 'center',
  includeFontPadding: false,
};

export const mpPage: ViewStyle = {
  flex: 1,
  backgroundColor: mp.cream,
};
