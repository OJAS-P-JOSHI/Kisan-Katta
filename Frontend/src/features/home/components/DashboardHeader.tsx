import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { radius, spacing, useAppTheme } from '@/theme';

import { getGreeting } from '../weather.utils';

/** Temporary placeholder until authentication and profile modules are implemented. */
const FARMER_NAME = 'Rajesh Patil';
const VILLAGE = 'Lasalgaon';
const DISTRICT = 'Nashik';

export const DashboardHeader = memo(function DashboardHeader() {
  const theme = useAppTheme();
  const greeting = getGreeting();

  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        <Text variant="headlineSmall" style={[styles.greeting, { color: theme.colors.onBackground }]}>
          {greeting},
        </Text>
        <Text variant="titleLarge" style={{ color: theme.colors.primary, fontWeight: '700' }}>
          {FARMER_NAME}
        </Text>
        <View style={styles.locationRow}>
          <MaterialCommunityIcons name="map-marker" size={14} color={theme.colors.onSurfaceVariant} />
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {VILLAGE}, {DISTRICT}
          </Text>
        </View>
      </View>
      <View style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
        <MaterialCommunityIcons name="sprout" size={30} color={theme.colors.primary} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  textBlock: { gap: spacing.xs, flex: 1 },
  greeting: { fontWeight: '400' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
});
