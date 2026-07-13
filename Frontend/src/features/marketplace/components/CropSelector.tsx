import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Chip, HelperText, Modal, Portal, Text, TextInput } from 'react-native-paper';

import { AGMARKNET_COMMODITIES } from '@/constants/agmarknetCommodities';
import {
  getMaharashtraCropLabel,
  MAHARASHTRA_CROP_BY_VALUE,
  normalizeFavoriteCrops,
} from '@/constants/maharashtraCrops';
import { useMyProfile } from '@/features/profile/hooks/useMyProfile';
import { radius, spacing, useAppTheme } from '@/theme';

import { marketplaceStrings } from '../marketplace.strings';

type CropSelectorProps = {
  value: string;
  onSelect: (cropValue: string) => void;
  error?: string;
};

const getCropDisplayLabel = (cropValue: string): string =>
  MAHARASHTRA_CROP_BY_VALUE.get(cropValue)?.label ?? cropValue;

export function CropSelector({ value, onSelect, error }: CropSelectorProps) {
  const theme = useAppTheme();
  const { data: profile } = useMyProfile();
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  const favoriteCrops = useMemo(
    () => normalizeFavoriteCrops(profile?.favoriteCrops ?? []),
    [profile?.favoriteCrops],
  );

  const allCrops = useMemo(() => [...AGMARKNET_COMMODITIES].sort((a, b) => a.localeCompare(b)), []);

  const filteredCrops = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return allCrops;
    return allCrops.filter((crop) => {
      const label = getCropDisplayLabel(crop).toLowerCase();
      return crop.toLowerCase().includes(query) || label.includes(query);
    });
  }, [allCrops, search]);

  const favoriteFiltered = useMemo(
    () => filteredCrops.filter((crop) => favoriteCrops.includes(crop)),
    [favoriteCrops, filteredCrops],
  );

  const otherFiltered = useMemo(
    () => filteredCrops.filter((crop) => !favoriteCrops.includes(crop)),
    [favoriteCrops, filteredCrops],
  );

  const displayValue = value ? getMaharashtraCropLabel(value) : '';

  const handleSelect = (crop: string) => {
    onSelect(crop);
    setModalVisible(false);
    setSearch('');
  };

  return (
    <View>
      {favoriteCrops.length > 0 ? (
        <View style={styles.section}>
          <Text variant="labelLarge" style={{ color: theme.colors.onSurface }}>
            {marketplaceStrings.create.favoriteCropsTitle}
          </Text>
          <View style={styles.chipRow}>
            {favoriteCrops.map((crop) => (
              <Chip
                key={`fav-${crop}`}
                selected={value === crop}
                onPress={() => onSelect(crop)}
                style={styles.chip}
                compact
              >
                {getMaharashtraCropLabel(crop)}
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

          <FlatList
            data={[
              ...(favoriteFiltered.length > 0
                ? [{ type: 'header' as const, key: 'fav-header', title: marketplaceStrings.create.favoriteCropsTitle }]
                : []),
              ...favoriteFiltered.map((crop) => ({ type: 'crop' as const, key: `fav-${crop}`, crop })),
              { type: 'header' as const, key: 'all-header', title: marketplaceStrings.create.allCropsTitle },
              ...otherFiltered.map((crop) => ({ type: 'crop' as const, key: crop, crop })),
            ]}
            keyExtractor={(item) => item.key}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            renderItem={({ item }) => {
              if (item.type === 'header') {
                return (
                  <Text variant="labelLarge" style={[styles.sectionHeader, { color: theme.colors.primary }]}>
                    {item.title}
                  </Text>
                );
              }
              const selected = value === item.crop;
              return (
                <Pressable
                  onPress={() => handleSelect(item.crop)}
                  style={[
                    styles.cropRow,
                    {
                      backgroundColor: selected ? theme.colors.primaryContainer : theme.colors.surface,
                    },
                  ]}
                >
                  <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                    {getCropDisplayLabel(item.crop)}
                  </Text>
                </Pressable>
              );
            }}
          />
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
});
