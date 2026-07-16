import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Chip, Divider, Text } from 'react-native-paper';

import { cardSurface, iconSize, radius, spacing, typography, useAppTheme } from '@/theme';

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
      <Card.Content>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons name={icon} size={iconSize.md} color={theme.colors.primary} />
          </View>
          <View style={styles.titleBlock}>
            <Text style={[typography.sectionTitle, { color: theme.colors.onSurface }]}>
              {title}
            </Text>
            <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
              {subtitle}
            </Text>
          </View>
        </View>
        <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
        <View style={styles.body}>
          <Text style={[typography.body, { color: theme.colors.onSurfaceVariant, flex: 1 }]}>
            {message}
          </Text>
          <Chip compact mode="outlined" style={styles.chip} textStyle={styles.chipText}>
            Coming Soon
          </Chip>
        </View>
      </Card.Content>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: { marginHorizontal: spacing.md, marginBottom: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: { flex: 1, gap: 2 },
  divider: { marginVertical: spacing.sm },
  body: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chip: { flexShrink: 0 },
  chipText: { fontSize: 11, lineHeight: 14 },
});
