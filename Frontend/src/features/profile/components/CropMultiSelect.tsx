import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Chip, HelperText, Modal, Portal, Snackbar, Text, TextInput } from 'react-native-paper';

import { AGMARKNET_COMMODITIES } from '@/constants/agmarknetCommodities';
import {
  getMaharashtraCropLabel,
  MAHARASHTRA_CROPS,
  MAHARASHTRA_CROP_BY_VALUE,
  MAHARASHTRA_CROP_VALUES,
  type MaharashtraCrop,
} from '@/constants/maharashtraCrops';
import { radius, spacing, useAppTheme } from '@/theme';

import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { profileStrings } from '../profile.strings';

const SEARCH_DEBOUNCE_MS = 300;
const TOUCH_MIN = 48;

export type CropMultiSelectProps = {
  label: string;
  helperText?: string;
  selected: string[];
  onChange: (next: string[]) => void;
  max: number;
  error?: string;
  disabled?: boolean;
};

type MatchRank = 0 | 1 | 2;

const getCommodityMatchRank = (commodity: string, query: string): MatchRank | null => {
  const haystack = commodity.toLowerCase();
  const label = MAHARASHTRA_CROP_BY_VALUE.get(commodity)?.label.toLowerCase() ?? '';

  if (haystack === query || label === query) return 0;
  if (haystack.startsWith(query) || label.startsWith(query)) return 1;
  if (haystack.includes(query) || label.includes(query)) return 2;
  return null;
};

/** Ranked Agmarknet search: exact → startsWith → contains, then A–Z within each rank. */
const filterRankedAgmarknet = (query: string): string[] => {
  if (!query) return [];

  const matched: { value: string; rank: MatchRank }[] = [];
  for (const commodity of AGMARKNET_COMMODITIES) {
    if (MAHARASHTRA_CROP_VALUES.has(commodity)) continue;
    const rank = getCommodityMatchRank(commodity, query);
    if (rank === null) continue;
    matched.push({ value: commodity, rank });
  }

  matched.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return a.value.localeCompare(b.value);
  });

  return matched.map((item) => item.value);
};

type CropRowProps = {
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
};

const CropRow = memo(function CropRow({ label, selected, disabled, onPress }: CropRowProps) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        pressed && !disabled ? { backgroundColor: theme.colors.surfaceVariant } : null,
        disabled && !selected ? styles.optionDisabled : null,
      ]}
    >
      <Text
        variant="bodyLarge"
        style={{
          flex: 1,
          color: selected ? theme.colors.primary : theme.colors.onSurface,
          paddingRight: spacing.sm,
        }}
      >
        {profileStrings.crops.chipPrefix} {label}
      </Text>
      {selected ? (
        <MaterialCommunityIcons name="check-circle" size={22} color={theme.colors.primary} />
      ) : null}
    </Pressable>
  );
});

/**
 * Hybrid favourite-crop picker: curated Maharashtra crops up front,
 * full Agmarknet search below. Always stores exact Agmarknet values.
 */
export function CropMultiSelect({
  label,
  helperText,
  selected,
  onChange,
  max,
  error,
  disabled,
}: CropMultiSelectProps) {
  const theme = useAppTheme();
  const [visible, setVisible] = useState(false);
  const [cropSearch, setCropSearch] = useState('');
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(cropSearch, SEARCH_DEBOUNCE_MS);

  const atLimit = selected.length >= max;
  const query = debouncedSearch.trim().toLowerCase();
  const isSearching = query.length > 0;

  const filteredResults = useMemo(() => filterRankedAgmarknet(query), [query]);

  const summary =
    selected.length === 0
      ? ''
      : selected.length === 1
        ? getMaharashtraCropLabel(selected[0]!)
        : profileStrings.crops.selectedSummary(selected.length);

  const toggle = useCallback(
    (value: string): void => {
      if (selected.includes(value)) {
        onChange(selected.filter((item) => item !== value));
        return;
      }
      if (selected.length >= max) {
        setSnackbar(profileStrings.crops.maxReached);
        return;
      }
      onChange([...selected, value]);
    },
    [max, onChange, selected],
  );

  const remove = useCallback(
    (value: string): void => {
      onChange(selected.filter((item) => item !== value));
    },
    [onChange, selected],
  );

  const closeModal = useCallback((): void => {
    setVisible(false);
    setCropSearch('');
  }, []);

  const renderRecommended = useCallback(
    ({ item }: { item: MaharashtraCrop }) => {
      const isSelected = selected.includes(item.value);
      const canSelect = isSelected || !atLimit;
      return (
        <CropRow
          label={item.label}
          selected={isSelected}
          disabled={!canSelect}
          onPress={() => toggle(item.value)}
        />
      );
    },
    [atLimit, selected, toggle],
  );

  const renderResult = useCallback(
    ({ item }: { item: string }) => {
      const isSelected = selected.includes(item);
      const canSelect = isSelected || !atLimit;
      return (
        <CropRow
          label={getMaharashtraCropLabel(item)}
          selected={isSelected}
          disabled={!canSelect}
          onPress={() => toggle(item)}
        />
      );
    },
    [atLimit, selected, toggle],
  );

  const showEmptyResults = isSearching && filteredResults.length === 0;

  return (
    <View>
      <Pressable onPress={() => !disabled && setVisible(true)} disabled={disabled}>
        <View pointerEvents="none">
          <TextInput
            mode="outlined"
            dense
            label={`${label} (${selected.length}/${max})`}
            value={summary}
            placeholder={profileStrings.crops.fieldPlaceholder}
            editable={false}
            error={!!error}
            right={<TextInput.Icon icon="chevron-down" />}
          />
        </View>
      </Pressable>

      {!!helperText && !error && (
        <HelperText type="info" padding="none" style={styles.helper}>
          {helperText}
        </HelperText>
      )}

      {selected.length > 0 && (
        <View style={styles.chipRow}>
          {selected.map((value) => (
            <Chip
              key={value}
              mode="flat"
              compact
              onClose={disabled ? undefined : () => remove(value)}
              style={styles.chip}
            >
              {profileStrings.crops.chipPrefix} {getMaharashtraCropLabel(value)}
            </Chip>
          ))}
        </View>
      )}

      {!!error && <HelperText type="error">{error}</HelperText>}

      <Portal>
        <Modal
          visible={visible}
          onDismiss={closeModal}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>
            {label}
          </Text>

          <Text variant="labelLarge" style={[styles.sectionHeader, { color: theme.colors.primary }]}>
            {profileStrings.crops.recommendedTitle}
          </Text>

          <FlatList
            data={MAHARASHTRA_CROPS}
            keyExtractor={(item) => item.id}
            style={styles.recommendedList}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={12}
            maxToRenderPerBatch={16}
            windowSize={6}
            renderItem={renderRecommended}
          />

          <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

          <TextInput
            mode="outlined"
            dense
            placeholder={`🔍 ${profileStrings.crops.searchPlaceholder}`}
            value={cropSearch}
            onChangeText={setCropSearch}
            left={<TextInput.Icon icon="magnify" />}
            right={
              cropSearch ? (
                <TextInput.Icon icon="close" onPress={() => setCropSearch('')} />
              ) : undefined
            }
            style={styles.search}
          />

          {isSearching ? (
            <>
              <Text
                variant="labelLarge"
                style={[styles.sectionHeader, { color: theme.colors.primary }]}
              >
                {profileStrings.crops.searchResultsTitle}
              </Text>
              {showEmptyResults ? (
                <View style={styles.empty}>
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
                  >
                    {profileStrings.crops.emptySearch}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      textAlign: 'center',
                      marginTop: spacing.xs,
                    }}
                  >
                    {profileStrings.crops.emptySearchHint}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredResults}
                  keyExtractor={(item) => item}
                  style={styles.resultsList}
                  keyboardShouldPersistTaps="handled"
                  initialNumToRender={16}
                  maxToRenderPerBatch={20}
                  windowSize={8}
                  renderItem={renderResult}
                />
              )}
            </>
          ) : null}
        </Modal>

        <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={3000}>
          {snackbar}
        </Snackbar>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  helper: { marginTop: 0, marginBottom: 0 },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  chip: { marginBottom: 2, borderRadius: radius.pill },
  modal: {
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    maxHeight: '85%',
    minHeight: '70%',
  },
  modalTitle: { marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  sectionHeader: {
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
    fontWeight: '700',
  },
  recommendedList: { flexGrow: 1, flexShrink: 1, maxHeight: 280 },
  resultsList: { flexGrow: 1, flexShrink: 1, maxHeight: 220 },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.sm,
  },
  search: { marginBottom: spacing.sm, borderRadius: radius.md },
  empty: { paddingVertical: spacing.md, paddingHorizontal: spacing.md },
  option: {
    minHeight: TOUCH_MIN,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
  },
  optionDisabled: { opacity: 0.4 },
});
