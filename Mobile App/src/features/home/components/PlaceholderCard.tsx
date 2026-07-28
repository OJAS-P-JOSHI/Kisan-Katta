import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Divider, Text } from 'react-native-paper';

import { strings } from '@/constants';
import { cardSurface, iconSize, palette, radius, spacing, typography, useAppTheme } from '@/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type PlaceholderCardProps = {
  icon: IconName;
  title: string;
  subtitle: string;
  message: string;
};

export const PlaceholderCard = memo(function PlaceholderCard({
  icon,
  title,
  subtitle,
  message,
}: PlaceholderCardProps) {
  const theme = useAppTheme();

  return (
    <Card mode="elevated" style={[styles.card, cardSurface]}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons name={icon} size={iconSize.md} color={theme.colors.primary} />
          </View>
          <View style={styles.titleBlock}>
            <Text style={[typography.sectionTitle, { color: theme.colors.onSurface }]} numberOfLines={2}>
              {title}
            </Text>
            <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
              {subtitle}
            </Text>
          </View>
          <View style={styles.comingSoonPill}>
            <Text style={styles.comingSoonText}>{strings.home.comingSoon}</Text>
          </View>
        </View>
        <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
        <Text style={[typography.body, { color: theme.colors.onSurfaceVariant }]} numberOfLines={3}>
          {message}
        </Text>
      </Card.Content>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  content: {
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: { flex: 1, gap: 3, minWidth: 0 },
  comingSoonPill: {
    backgroundColor: palette.amber100,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  comingSoonText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    color: palette.orange800,
  },
  divider: { marginVertical: spacing.md },
});
