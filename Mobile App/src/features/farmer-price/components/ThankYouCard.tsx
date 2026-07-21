import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { iconSize, palette, radius, useAppTheme } from '@/theme';

import { farmerPriceStrings } from '../farmer-price.strings';
import type { SubmittedVoteLocal } from '../farmer-price.types';
import { formatRupee } from '../farmer-price.utils';

type ThankYouCardProps = {
  vote: SubmittedVoteLocal;
};

/** Compact submitted-vote row — price only, no reason/comment. */
export function ThankYouCard({ vote }: ThankYouCardProps) {
  const theme = useAppTheme();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  const hasPrice = vote.expectedPrice > 0;

  return (
    <Animated.View style={[styles.root, { opacity }]} accessibilityLabel={farmerPriceStrings.thankYou.a11y}>
      <View style={styles.headerRow}>
        <View style={[styles.checkCircle, { backgroundColor: palette.green100 }]}>
          <MaterialCommunityIcons name="check" size={iconSize.sm} color={palette.green900} />
        </View>
        <Text style={[styles.heading, { color: theme.colors.onSurface }]}>
          {farmerPriceStrings.thankYou.heading}
        </Text>
      </View>
      {hasPrice ? (
        <Text style={[styles.price, { color: palette.green900 }]}>
          {farmerPriceStrings.thankYou.priceLine(formatRupee(vote.expectedPrice))}
        </Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  price: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: -0.3,
    paddingLeft: 32,
  },
});
