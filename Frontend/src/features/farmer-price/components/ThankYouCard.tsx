import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import {
  cardSurface,
  iconSize,
  palette,
  radius,
  spacing,
  typography,
  useAppTheme,
} from '@/theme';

import { farmerPriceStrings, getReasonTypeLabel } from '../farmer-price.strings';
import type { SubmittedVoteLocal } from '../farmer-price.types';
import { formatRupee } from '../farmer-price.utils';

type ThankYouCardProps = {
  vote: SubmittedVoteLocal;
};

export function ThankYouCard({ vote }: ThankYouCardProps) {
  const theme = useAppTheme();
  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 7, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 240, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale]);

  const hasPrice = vote.expectedPrice > 0;
  const hasReason = Boolean(vote.reasonType || vote.reasonText);

  return (
    <Animated.View style={{ opacity, transform: [{ scale }] }}>
      <Card
        mode="elevated"
        style={[styles.card, cardSurface, { backgroundColor: theme.colors.surface }]}
        accessibilityLabel={farmerPriceStrings.thankYou.a11y}
      >
        <Card.Content style={styles.content}>
          <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons
              name="check-circle"
              size={iconSize.hero}
              color={palette.green700}
            />
          </View>
          <Text style={[typography.sectionTitle, styles.heading, { color: theme.colors.onSurface }]}>
            {farmerPriceStrings.thankYou.heading}
          </Text>
          <Text style={[typography.body, styles.body, { color: theme.colors.onSurfaceVariant }]}>
            {farmerPriceStrings.thankYou.body}
          </Text>

          {hasPrice ? (
            <View style={[styles.readOnlyBlock, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
                {farmerPriceStrings.thankYou.submittedPrice}
              </Text>
              <Text style={[typography.sectionTitle, { color: theme.colors.onSurface }]}>
                {formatRupee(vote.expectedPrice)}{' '}
                <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
                  {farmerPriceStrings.poll.perQuintal}
                </Text>
              </Text>
            </View>
          ) : null}

          {hasReason ? (
            <View style={[styles.readOnlyBlock, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
                {farmerPriceStrings.thankYou.submittedReason}
              </Text>
              {vote.reasonType ? (
                <Text style={[typography.body, { color: theme.colors.onSurface, fontWeight: '600' }]}>
                  {getReasonTypeLabel(vote.reasonType)}
                </Text>
              ) : null}
              {vote.reasonText ? (
                <Text style={[typography.body, { color: theme.colors.onSurfaceVariant }]}>
                  {vote.reasonText}
                </Text>
              ) : null}
            </View>
          ) : null}
        </Card.Content>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {},
  content: {
    padding: spacing.md + 4,
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  heading: {
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  readOnlyBlock: {
    alignSelf: 'stretch',
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
});
