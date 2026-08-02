import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { iconSize, palette, radius, spacing, useAppTheme } from '@/theme';

import { MINIMUM_VOTES_REQUIRED } from '../farmer-price.constants';
import { farmerPriceStrings } from '../farmer-price.strings';
import type { SubmittedVoteLocal } from '../farmer-price.types';
import { formatRupee } from '../farmer-price.utils';

type ThankYouCardProps = {
  vote: SubmittedVoteLocal;
  district: string;
  /** When community price is still gated, explain that the vote still counts. */
  communityRevealed?: boolean;
};

/** Confirmation shown once an opinion is recorded — always shows submitted price. */
export function ThankYouCard({
  vote,
  district,
  communityRevealed = true,
}: ThankYouCardProps) {
  const theme = useAppTheme();
  const [appear] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(appear, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [appear]);

  const hasPrice = vote.expectedPrice > 0;

  return (
    <Animated.View
      style={[
        styles.root,
        {
          backgroundColor: palette.green50,
          opacity: appear,
          transform: [
            { translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
          ],
        },
      ]}
      accessibilityLabel={farmerPriceStrings.submitted.a11y}
    >
      <View style={styles.headerRow}>
        <View style={[styles.checkCircle, { backgroundColor: palette.green100 }]}>
          <MaterialCommunityIcons name="check" size={iconSize.sm} color={palette.green900} />
        </View>
        <Text style={[styles.heading, { color: palette.green900 }]}>
          {farmerPriceStrings.submitted.heading}
        </Text>
      </View>

      <Text style={[styles.body, { color: theme.colors.onSurface }]}>
        {farmerPriceStrings.submitted.thanks(district)}
      </Text>
      <Text style={[styles.body, { color: theme.colors.onSurfaceVariant }]}>
        {communityRevealed
          ? farmerPriceStrings.submitted.included
          : farmerPriceStrings.submitted.waitingConsensus(MINIMUM_VOTES_REQUIRED)}
      </Text>

      {hasPrice ? (
        <View style={styles.priceBlock}>
          <Text style={[styles.priceLabel, { color: theme.colors.onSurfaceVariant }]}>
            {farmerPriceStrings.submitted.yourSubmittedPrice}
          </Text>
          <Text style={[styles.price, { color: palette.green900 }]}>
            {`${formatRupee(vote.expectedPrice)} ${farmerPriceStrings.vote.suffix}`}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 6,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  priceBlock: {
    marginTop: 6,
    gap: 2,
  },
  priceLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  price: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
});
