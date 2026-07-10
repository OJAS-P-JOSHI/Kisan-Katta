import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Searchbar, Text } from 'react-native-paper';

import { strings } from '@/constants';
import { radius, spacing, useAppTheme } from '@/theme';

import { SEARCH_DEBOUNCE_MS } from './marketplace.constants';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { marketplaceStrings } from './marketplace.strings';

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
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Searchbar
        placeholder={marketplaceStrings.home.searchPlaceholder}
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmitEditing={handleSearchSubmit}
        onIconPress={handleSearchSubmit}
        style={[styles.searchbar, { backgroundColor: theme.colors.surface }]}
        inputStyle={styles.searchInput}
        icon={() => (
          <MaterialCommunityIcons name="magnify" size={22} color={theme.colors.onSurfaceVariant} />
        )}
      />

      <Pressable onPress={() => navigateToProduce()}>
        <Card style={[styles.heroCard, { backgroundColor: theme.colors.primaryContainer }]} mode="elevated">
          <Card.Content style={styles.heroContent}>
            <Text variant="headlineSmall" style={{ color: theme.colors.onPrimaryContainer }}>
              🌾 {marketplaceStrings.home.produceCardTitle}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer }}>
              {marketplaceStrings.home.produceCardSubtitle}
            </Text>
            <Button
              mode="contained"
              onPress={() => navigateToProduce()}
              style={styles.heroButton}
              contentStyle={styles.heroButtonContent}
            >
              {marketplaceStrings.home.produceCardAction}
            </Button>
          </Card.Content>
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push('/marketplace-products' as Href)}>
        <Card style={[styles.heroCard, { backgroundColor: theme.colors.secondaryContainer }]} mode="elevated">
          <Card.Content style={styles.heroContent}>
            <Text variant="headlineSmall" style={{ color: theme.colors.onSecondaryContainer }}>
              🛒 {marketplaceStrings.home.productCardTitle}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSecondaryContainer }}>
              {marketplaceStrings.home.productCardSubtitle}
            </Text>
            <Button
              mode="contained"
              onPress={() => router.push('/marketplace-products' as Href)}
              style={styles.heroButton}
              contentStyle={styles.heroButtonContent}
            >
              {marketplaceStrings.home.productCardAction}
            </Button>
          </Card.Content>
        </Card>
      </Pressable>

      <View style={styles.quickActions}>
        <QuickAction
          icon="heart-outline"
          label={marketplaceStrings.home.savedListings}
          onPress={() => router.push('/marketplace-saved' as Href)}
        />
        <QuickAction
          icon="package-variant-closed"
          label={marketplaceStrings.home.myListings}
          onPress={() => router.push('/marketplace-my-listings' as Href)}
        />
        <QuickAction
          icon="plus-circle-outline"
          label={marketplaceStrings.home.sellSomething}
          onPress={() => router.push('/marketplace-create' as Href)}
        />
      </View>

      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
        {strings.marketplace.subtitle}
      </Text>
    </ScrollView>
  );
}

function QuickAction({
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
    <Pressable onPress={onPress} style={[styles.quickAction, { backgroundColor: theme.colors.surface }]}>
      <MaterialCommunityIcons name={icon} size={28} color={theme.colors.primary} />
      <Text variant="labelLarge" style={{ color: theme.colors.onSurface, textAlign: 'center' }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  searchbar: { borderRadius: radius.md, elevation: 0 },
  searchInput: { minHeight: 0 },
  heroCard: { borderRadius: radius.lg },
  heroContent: { gap: spacing.sm, paddingVertical: spacing.lg },
  heroButton: { alignSelf: 'flex-start', marginTop: spacing.sm },
  heroButtonContent: { paddingVertical: spacing.xs },
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
});
