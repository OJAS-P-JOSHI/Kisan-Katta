import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import {
  cardSurface,
  iconSize,
  radius,
  spacing,
  typography,
  useAppTheme,
} from '@/theme';

import { RECENT_INSIGHTS_LIMIT } from '../farmer-price.constants';
import { farmerPriceStrings, getReasonTypeLabel } from '../farmer-price.strings';
import type { RecentInsightDTO } from '../farmer-price.types';
import { formatRelativeTime } from '../farmer-price.utils';

type RecentInsightsCardProps = {
  insights: RecentInsightDTO[];
};

function reasonIcon(reasonType: RecentInsightDTO['reasonType']) {
  switch (reasonType) {
    case 'HIGH_DEMAND':
      return 'trending-up' as const;
    case 'LOW_SUPPLY':
      return 'package-variant-closed' as const;
    case 'GOOD_QUALITY':
      return 'star-outline' as const;
    case 'EXPORT_DEMAND':
      return 'airplane' as const;
    case 'HIGH_TRANSPORT_COST':
      return 'truck-outline' as const;
    case 'LOW_QUALITY':
      return 'alert-circle-outline' as const;
    case 'STORAGE_AVAILABLE':
      return 'warehouse' as const;
    default:
      return 'comment-text-outline' as const;
  }
}

export function RecentInsightsCard({ insights }: RecentInsightsCardProps) {
  const theme = useAppTheme();
  const items = insights.slice(0, RECENT_INSIGHTS_LIMIT);

  return (
    <Card
      mode="elevated"
      style={[styles.card, cardSurface, { backgroundColor: theme.colors.surface }]}
    >
      <Card.Content style={styles.content}>
        <Text style={[typography.sectionTitle, { color: theme.colors.onSurface }]}>
          {farmerPriceStrings.insights.title}
        </Text>

        {items.length === 0 ? (
          <Text style={[typography.body, { color: theme.colors.onSurfaceVariant }]}>
            {farmerPriceStrings.insights.empty}
          </Text>
        ) : (
          items.map((insight, index) => (
            <View
              key={`${insight.createdAt}-${index}`}
              style={[
                styles.item,
                index < items.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: theme.colors.outlineVariant,
                },
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
                <MaterialCommunityIcons
                  name={reasonIcon(insight.reasonType)}
                  size={iconSize.md}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.itemBody}>
                <View style={[styles.badge, { backgroundColor: theme.colors.secondaryContainer }]}>
                  <Text
                    style={[
                      typography.caption,
                      { color: theme.colors.onSecondaryContainer, fontWeight: '700' },
                    ]}
                  >
                    {getReasonTypeLabel(insight.reasonType)}
                  </Text>
                </View>
                <Text style={[typography.body, { color: theme.colors.onSurface }]}>
                  {insight.reasonText}
                </Text>
                <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
                  {formatRelativeTime(insight.createdAt)} ·{' '}
                  {insight.author || farmerPriceStrings.insights.anonymousAuthor}
                </Text>
              </View>
            </View>
          ))
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {},
  content: {
    padding: spacing.md + 4,
    gap: spacing.md,
  },
  item: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  itemBody: {
    flex: 1,
    gap: spacing.xs,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
});
