import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, Modal, Portal, Text, TextInput } from 'react-native-paper';

import {
  getCropLabel,
  normalizeFavoriteCrops,
  useCropSearch,
  useCrops,
  type CropListItem,
} from '@/features/crop';
import { useMyProfile } from '@/features/profile/hooks/useMyProfile';
import { useDebouncedValue } from '@/features/profile/hooks/useDebouncedValue';
import { radius, spacing, useAppTheme } from '@/theme';

import { marketplaceStrings } from '../marketplace.strings';
import { mp } from '../marketplace.ui';

type CropSelectorProps = {
  value: string;
  onSelect: (cropValue: string) => void;
  error?: string;
};

const SEARCH_DEBOUNCE_MS = 200;

/**
 * Marketplace crop picker — Crop Master APIs only (no hardcoded commodity lists).
 */
export function CropSelector({ value, onSelect, error }: CropSelectorProps) {
  const theme = useAppTheme();
  const { data: profile } = useMyProfile();
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);

  const {
    data: allCrops,
    loading: cropsLoading,
    error: cropsError,
    refresh: refreshCrops,
  } = useCrops();

  const query = debouncedSearch.trim();
  const isSearching = query.length > 0;

  const {
    data: searchResults,
    loading: searchLoading,
    error: searchError,
    refresh: refreshSearch,
  } = useCropSearch(isSearching ? query : null);

  const favoriteCrops = useMemo(
    () => normalizeFavoriteCrops(profile?.favoriteCrops ?? [], allCrops),
    [profile?.favoriteCrops, allCrops],
  );

  const browseList = useMemo(() => {
    if (isSearching) return searchResults;
    return allCrops;
  }, [allCrops, isSearching, searchResults]);

  const favoriteFiltered = useMemo(() => {
    const favSet = new Set(favoriteCrops);
    return browseList.filter((crop) => favSet.has(crop.name));
  }, [browseList, favoriteCrops]);

  const otherFiltered = useMemo(() => {
    const favSet = new Set(favoriteCrops);
    return browseList.filter((crop) => !favSet.has(crop.name));
  }, [browseList, favoriteCrops]);

  const displayValue = value ? getCropLabel(value, allCrops) : '';

  const handleSelect = (crop: CropListItem) => {
    onSelect(crop.name);
    setModalVisible(false);
    setSearch('');
  };

  const listBusy = isSearching ? searchLoading : cropsLoading;
  const listError = isSearching ? searchError : cropsError;
  const onRetry = isSearching ? refreshSearch : refreshCrops;

  const listData = useMemo(
    () => [
      ...(favoriteFiltered.length > 0
        ? [
            {
              type: 'header' as const,
              key: 'fav-header',
              title: marketplaceStrings.create.favoriteCropsTitle,
            },
          ]
        : []),
      ...favoriteFiltered.map((crop) => ({
        type: 'crop' as const,
        key: `fav-${crop.cropId}`,
        crop,
      })),
      {
        type: 'header' as const,
        key: 'all-header',
        title: marketplaceStrings.create.allCropsTitle,
      },
      ...otherFiltered.map((crop) => ({
        type: 'crop' as const,
        key: String(crop.cropId),
        crop,
      })),
    ],
    [favoriteFiltered, otherFiltered],
  );

  return (
    <View>
      {favoriteCrops.length > 0 ? (
        <View style={styles.section}>
          <Text variant="labelLarge" style={{ color: theme.colors.onSurface }}>
            {marketplaceStrings.create.favoriteCropsTitle}
          </Text>
          <View style={styles.chipRow}>
            {favoriteCrops.map((cropName) => (
              <Chip
                key={`fav-${cropName}`}
                selected={value === cropName}
                onPress={() => onSelect(cropName)}
                style={styles.chip}
                compact
              >
                {getCropLabel(cropName, allCrops)}
              </Chip>
            ))}
          </View>
        </View>
      ) : null}

      <Pressable onPress={() => setModalVisible(true)}>
        <View pointerEvents="none">
          <TextInput
            mode="outlined"
            label={marketplaceStrings.create.crop}
            placeholder={marketplaceStrings.create.cropPlaceholder}
            value={displayValue}
            editable={false}
            error={!!error}
            outlineColor={mp.searchBorder}
            activeOutlineColor={mp.primaryGreen}
            style={{ backgroundColor: mp.white }}
            right={<TextInput.Icon icon="chevron-down" />}
          />
        </View>
      </Pressable>
      {error ? <HelperText type="error">{error}</HelperText> : null}

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>
            {marketplaceStrings.create.allCropsTitle}
          </Text>
          <TextInput
            mode="outlined"
            placeholder={marketplaceStrings.home.searchPlaceholder}
            value={search}
            onChangeText={setSearch}
            left={<TextInput.Icon icon="magnify" />}
            style={styles.searchInput}
          />

          {listBusy ? (
            <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
          ) : listError ? (
            <View style={styles.errorBox}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                {listError}
              </Text>
              <Button mode="text" onPress={() => void onRetry()}>
                {marketplaceStrings.listings.retry}
              </Button>
            </View>
          ) : (
            <FlatList
              data={listData}
              keyExtractor={(item) => item.key}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              renderItem={({ item }) => {
                if (item.type === 'header') {
                  return (
                    <Text
                      variant="labelLarge"
                      style={[styles.sectionHeader, { color: theme.colors.primary }]}
                    >
                      {item.title}
                    </Text>
                  );
                }
                const selected = value === item.crop.name;
                return (
                  <Pressable
                    onPress={() => handleSelect(item.crop)}
                    style={[
                      styles.cropRow,
                      {
                        backgroundColor: selected
                          ? theme.colors.primaryContainer
                          : theme.colors.surface,
                      },
                    ]}
                  >
                    <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                      {getCropLabel(item.crop)}
                    </Text>
                  </Pressable>
                );
              }}
            />
          )}
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { marginBottom: 0 },
  modal: {
    margin: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    maxHeight: '80%',
  },
  modalTitle: { marginBottom: spacing.sm },
  searchInput: { marginBottom: spacing.sm },
  list: { flexGrow: 0 },
  sectionHeader: { marginTop: spacing.sm, marginBottom: spacing.xs, fontWeight: '600' },
  cropRow: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  loader: { marginVertical: spacing.lg },
  errorBox: { paddingVertical: spacing.md, alignItems: 'center', gap: spacing.sm },
});
