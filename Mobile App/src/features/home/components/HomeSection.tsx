import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { iconSize, spacing, useAppTheme } from '@/theme';

import { homeSpacing, homeText } from '../home.theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type HomeSectionVariant = 'hero' | 'primary' | 'utility';

type HomeSectionProps = {
  icon: IconName;
  title: string;
  subtitle?: string;
  variant?: HomeSectionVariant;
  children?: ReactNode;
};

const titleStyle = {
  hero: homeText.sectionHero,
  primary: homeText.sectionPrimary,
  utility: homeText.sectionUtility,
} as const;

export const HomeSection = memo(function HomeSection({
  icon,
  title,
  subtitle,
  variant = 'primary',
  children,
}: HomeSectionProps) {
  const theme = useAppTheme();
  const isHero = variant === 'hero';
  const iconBg = isHero ? theme.colors.primaryContainer : theme.colors.surfaceVariant;
  const iconColor = isHero ? theme.colors.primary : theme.colors.onSurfaceVariant;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={[styles.iconPill, { backgroundColor: iconBg }]}>
          <MaterialCommunityIcons name={icon} size={iconSize.sm} color={iconColor} />
        </View>
        <View style={styles.titleBlock}>
          <Text
            style={[titleStyle[variant], { color: theme.colors.onBackground }]}
            numberOfLines={2}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[homeText.marathiCaption, { color: theme.colors.onSurfaceVariant, fontSize: 13 }]}
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    marginBottom: homeSpacing.sectionGapTight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: homeSpacing.horizontal,
    paddingBottom: spacing.md,
  },
  iconPill: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
});
