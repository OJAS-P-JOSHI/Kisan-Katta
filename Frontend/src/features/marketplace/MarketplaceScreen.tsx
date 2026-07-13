import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Searchbar, Text } from 'react-native-paper';

import { elevation, palette, radius, spacing, useAppTheme } from '@/theme';

import { SEARCH_DEBOUNCE_MS } from './marketplace.constants';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { marketplaceStrings } from './marketplace.strings';

function MarketplaceBackground() {
  const theme = useAppTheme();
  return (
    <View style={styles.backgroundLayer} pointerEvents="none">
      <View style={[styles.hillLarge, { backgroundColor: theme.colors.primaryContainer }]} />
      <View style={[styles.hillSmall, { backgroundColor: palette.mist }]} />
    </View>
  );
}

type HeroCardProps = {
  title: string;
  subtitle: string;
  actionLabel: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  backgroundColor: string;
  textColor: string;
  onPress: () => void;
};

function HeroCard({
  title,
  subtitle,
  actionLabel,
  icon,
  backgroundColor,
  textColor,
  onPress,
}: HeroCardProps) {
  return (
    <Pressable onPress={onPress}>
      <Card style={[styles.heroCard, elevation.soft, { backgroundColor }]} mode="elevated">
        <View style={styles.heroRow}>
          <View style={styles.heroTextBlock}>
            <Text variant="titleLarge" style={{ color: textColor, fontWeight: '700' }}>
              {title}
            </Text>
            <Text variant="bodyMedium" style={{ color: textColor, opacity: 0.9 }}>
              {subtitle}
            </Text>
            <Button
              mode="contained"
              onPress={onPress}
              style={styles.heroButton}
              contentStyle={styles.heroButtonContent}
              buttonColor={palette.white}
              textColor={palette.green700}
            >
              {actionLabel}
            </Button>
          </View>
          <View style={[styles.heroIconWrap, { backgroundColor: `${palette.white}33` }]}>
            <MaterialCommunityIcons name={icon} size={48} color={textColor} />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

function QuickActionCard({
  icon,
  label,
  onPress,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.quickAction, elevation.soft, { backgroundColor: theme.colors.surface }]}
    >
      <View style={[styles.quickIconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
        <MaterialCommunityIcons name={icon} size={24} color={theme.colors.primary} />
      </View>
      <Text variant="labelMedium" style={{ color: theme.colors.onSurface, textAlign: 'center' }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function MarketplaceScreen() {
  const theme = useAppTheme();
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
      <MarketplaceBackground />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={{ color: theme.colors.onBackground, fontWeight: '700' }}>
            🌾 {marketplaceStrings.home.title}
          </Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            {marketplaceStrings.home.subtitle}
          </Text>
        </View>

        <Searchbar
          placeholder={marketplaceStrings.home.searchPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchSubmit}
          onIconPress={handleSearchSubmit}
          style={[styles.searchbar, elevation.soft, { backgroundColor: theme.colors.surface }]}
          inputStyle={styles.searchInput}
          elevation={0}
          icon={() => (
            <MaterialCommunityIcons name="magnify" size={24} color={theme.colors.primary} />
          )}
        />

        <HeroCard
          title={marketplaceStrings.home.produceCardTitle}
          subtitle={marketplaceStrings.home.produceCardSubtitle}
          actionLabel={marketplaceStrings.home.produceCardAction}
          icon="sprout"
          backgroundColor={theme.colors.primaryContainer}
          textColor={theme.colors.onPrimaryContainer}
          onPress={() => navigateToProduce()}
        />

        <HeroCard
          title={marketplaceStrings.home.productCardTitle}
          subtitle={marketplaceStrings.home.productCardSubtitle}
          actionLabel={marketplaceStrings.home.productCardAction}
          icon="tractor"
          backgroundColor={theme.colors.secondaryContainer}
          textColor={theme.colors.onSecondaryContainer}
          onPress={() => router.push('/marketplace-products' as Href)}
        />

        <View style={styles.quickActions}>
          <QuickActionCard
            icon="heart-outline"
            label={marketplaceStrings.home.savedListings}
            onPress={() => router.push('/marketplace-saved' as Href)}
          />
          <QuickActionCard
            icon="clipboard-list-outline"
            label={marketplaceStrings.home.myListings}
            onPress={() => router.push('/marketplace-my-listings' as Href)}
          />
          <QuickActionCard
            icon="plus-circle-outline"
            label={marketplaceStrings.home.sellSomething}
            onPress={() => router.push('/marketplace-create' as Href)}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backgroundLayer: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  hillLarge: {
    position: 'absolute',
    width: '140%',
    height: 220,
    borderRadius: 999,
    top: -80,
    right: -80,
  },
  hillSmall: {
    position: 'absolute',
    width: '90%',
    height: 140,
    borderRadius: 999,
    top: 40,
    left: -60,
    opacity: 0.5,
  },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  header: { gap: spacing.xs, marginTop: spacing.sm },
  searchbar: { borderRadius: radius.lg, minHeight: 52 },
  searchInput: { minHeight: 48, fontSize: 16 },
  heroCard: { borderRadius: radius.lg, minHeight: 152 },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    minHeight: 152,
  },
  heroTextBlock: { flex: 1, gap: spacing.xs },
  heroButton: { alignSelf: 'flex-start', marginTop: spacing.sm, borderRadius: radius.pill },
  heroButtonContent: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  heroIconWrap: {
    width: 80,
    height: 80,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActions: { flexDirection: 'row', gap: spacing.sm },
  quickAction: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 96,
  },
  quickIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
