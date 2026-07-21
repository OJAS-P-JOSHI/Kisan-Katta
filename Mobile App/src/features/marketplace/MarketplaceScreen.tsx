import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Searchbar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLeaves } from '@/components/BrandLeaves';
import { OrganicBackground } from '@/components/OrganicBackground';
import {
  cardSurface,
  elevation,
  iconSize,
  palette,
  radius,
  spacing,
  typography,
  useAppTheme,
} from '@/theme';

import { SEARCH_DEBOUNCE_MS } from './marketplace.constants';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { marketplaceStrings } from './marketplace.strings';

type HeroCardProps = {
  title: string;
  subtitle: string;
  actionLabel: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  onPress: () => void;
};

/**
 * Entire card is one Pressable. The CTA is a non-interactive View pill
 * so React Native Web never nests <button> inside <button>.
 */
function HeroCard({
  title,
  subtitle,
  actionLabel,
  icon,
  backgroundColor,
  textColor,
  accentColor,
  onPress,
}: HeroCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${actionLabel}`}
    >
      <View style={[styles.heroCard, cardSurface, { backgroundColor }]}>
        <BrandLeaves variant="hero" />
        <View style={styles.heroRow}>
          <View style={styles.heroTextBlock}>
            <Text style={[typography.sectionTitle, styles.heroTitle, { color: textColor }]}>
              {title}
            </Text>
            <Text style={[typography.body, styles.heroSubtitle, { color: textColor }]}>
              {subtitle}
            </Text>
            <View style={[styles.heroCta, elevation.soft, { backgroundColor: palette.white }]}>
              <Text style={[typography.caption, styles.heroCtaLabel, { color: accentColor }]}>
                {actionLabel}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={iconSize.sm} color={accentColor} />
            </View>
          </View>
          <View style={[styles.heroIconWrap, { backgroundColor: `${palette.white}40` }]}>
            <MaterialCommunityIcons name={icon} size={52} color={textColor} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

type QuickActionTone = 'saved' | 'listings' | 'sell';

const QUICK_TONES: Record<
  QuickActionTone,
  { iconBg: string; iconColor: string }
> = {
  saved: { iconBg: palette.green50, iconColor: palette.green700 },
  listings: { iconBg: palette.mist, iconColor: palette.green900 },
  sell: { iconBg: palette.green100, iconColor: palette.green700 },
};

function QuickActionCard({
  icon,
  label,
  tone,
  onPress,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  tone: QuickActionTone;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const colors = QUICK_TONES[tone];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        cardSurface,
        { backgroundColor: theme.colors.surface },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.quickIconWrap, { backgroundColor: colors.iconBg }]}>
        <MaterialCommunityIcons name={icon} size={iconSize.xl} color={colors.iconColor} />
      </View>
      <Text
        style={[typography.caption, styles.quickLabel, { color: theme.colors.onSurface }]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function MarketplaceScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);

  const navigateToProduce = useCallback(
    (search?: string) => {
      const href = search
        ? (`/marketplace-produce?search=${encodeURIComponent(search)}` as Href)
        : ('/marketplace-produce' as Href);
      router.push(href);
    },
    [router],
  );

  const handleSearchSubmit = useCallback(() => {
    navigateToProduce(debouncedSearch.trim() || undefined);
  }, [debouncedSearch, navigateToProduce]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <OrganicBackground intensity="subtle" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[typography.largeHeading, styles.screenTitle, { color: theme.colors.onBackground }]}>
            {marketplaceStrings.home.title}
          </Text>
          <Text style={[typography.body, styles.screenSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            {marketplaceStrings.home.subtitle}
          </Text>
        </View>

        <Searchbar
          placeholder={marketplaceStrings.home.searchPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchSubmit}
          onIconPress={handleSearchSubmit}
          style={[styles.searchbar, elevation.card, { backgroundColor: theme.colors.surface }]}
          inputStyle={styles.searchInput}
          elevation={0}
          icon={() => (
            <MaterialCommunityIcons name="magnify" size={iconSize.lg} color={theme.colors.primary} />
          )}
        />

        <View style={styles.heroStack}>
          <HeroCard
            title={marketplaceStrings.home.produceCardTitle}
            subtitle={marketplaceStrings.home.produceCardSubtitle}
            actionLabel={marketplaceStrings.home.produceCardAction}
            icon="sprout"
            backgroundColor={theme.colors.primaryContainer}
            textColor={theme.colors.onPrimaryContainer}
            accentColor={palette.green700}
            onPress={() => navigateToProduce()}
          />

          <HeroCard
            title={marketplaceStrings.home.productCardTitle}
            subtitle={marketplaceStrings.home.productCardSubtitle}
            actionLabel={marketplaceStrings.home.productCardAction}
            icon="tractor"
            backgroundColor={theme.colors.secondaryContainer}
            textColor={theme.colors.onSecondaryContainer}
            accentColor={palette.green900}
            onPress={() => router.push('/marketplace-products' as Href)}
          />
        </View>

        <View style={styles.quickSection}>
          <Text style={[typography.sectionTitle, { color: theme.colors.onBackground }]}>
            {marketplaceStrings.home.quickActionsTitle}
          </Text>
          <View style={styles.quickActions}>
            <QuickActionCard
              icon="heart-outline"
              label={marketplaceStrings.home.savedListings}
              tone="saved"
              onPress={() => router.push('/marketplace-saved' as Href)}
            />
            <QuickActionCard
              icon="clipboard-list-outline"
              label={marketplaceStrings.home.myListings}
              tone="listings"
              onPress={() => router.push('/marketplace-my-listings' as Href)}
            />
            <QuickActionCard
              icon="plus-circle-outline"
              label={marketplaceStrings.home.sellSomething}
              tone="sell"
              onPress={() => router.push('/marketplace-create' as Href)}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: spacing.xxl,
  },
  header: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  screenTitle: {
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.6,
  },
  screenSubtitle: {
    opacity: 0.85,
    fontSize: 15,
    lineHeight: 22,
  },
  searchbar: {
    borderRadius: 28,
    height: 52,
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  searchInput: {
    minHeight: 48,
    fontSize: 15,
    alignSelf: 'center',
  },
  heroStack: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  heroCard: {
    minHeight: 148,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 22,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: spacing.md,
    minHeight: 148,
  },
  heroTextBlock: {
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  heroSubtitle: {
    opacity: 0.82,
    fontSize: 14,
    lineHeight: 20,
  },
  heroCta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  heroCtaLabel: {
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.15,
  },
  heroIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickSection: {
    gap: spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickAction: {
    flex: 1,
    borderRadius: 22,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 100,
  },
  quickIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
});
