import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Divider, Text } from 'react-native-paper';

import { strings } from '@/constants';
import { iconSize, palette, radius, spacing, typography, useAppTheme } from '@/theme';

import { homeSpacing, homeSurfaces, homeText } from '../home.theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type PlaceholderCardProps = {
  icon: IconName;
  title: string;
  subtitle: string;
  message: string;
  variant?: 'default' | 'compact';
};

export const PlaceholderCard = memo(function PlaceholderCard({
  icon,
  title,
  subtitle,
  message,
  variant = 'default',
}: PlaceholderCardProps) {
  const theme = useAppTheme();
  const isCompact = variant === 'compact';

  return (
    <Card
      mode="elevated"
      style={[styles.card, homeSurfaces.utility, isCompact && styles.cardCompact]}
    >
      <Card.Content style={[styles.content, isCompact && styles.contentCompact]}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
            <MaterialCommunityIcons
              name={icon}
              size={isCompact ? iconSize.sm : iconSize.md}
              color={theme.colors.onSurfaceVariant}
            />
          </View>
          <View style={styles.titleBlock}>
            <Text
              style={[
                isCompact ? homeText.sectionUtility : typography.sectionTitle,
                { color: theme.colors.onSurface },
              ]}
              numberOfLines={2}
            >
              {title}
            </Text>
            {!isCompact ? (
              <Text
                style={[typography.caption, homeText.marathiCaption, { color: theme.colors.onSurfaceVariant }]}
                numberOfLines={2}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
          <View style={styles.comingSoonPill}>
            <Text style={styles.comingSoonText}>{strings.home.comingSoon}</Text>
          </View>
        </View>
        {!isCompact ? (
          <>
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
            <Text
              style={[typography.body, homeText.marathiBody, { color: theme.colors.onSurfaceVariant, fontSize: 14 }]}
              numberOfLines={2}
            >
              {message}
            </Text>
          </>
        ) : null}
      </Card.Content>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: homeSpacing.horizontal,
  },
  cardCompact: {
    opacity: 0.92,
  },
  content: {
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  contentCompact: {
    paddingVertical: spacing.sm + 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: { flex: 1, gap: 2, minWidth: 0 },
  comingSoonPill: {
    backgroundColor: palette.amber100,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  comingSoonText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
    color: palette.orange800,
  },
  divider: { marginVertical: spacing.sm },
});
