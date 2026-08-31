import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, Modal, Portal, Snackbar, Text, TextInput } from 'react-native-paper';

import { getCropLabel, useCropSearch, useCrops, type CropListItem } from '@/features/crop';
import { radius, spacing, typography, useAppTheme } from '@/theme';

import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { profileStrings } from '../profile.strings';

const SEARCH_DEBOUNCE_MS = 200;
const TOUCH_MIN = 48;

export type CropMultiSelectProps = {
  label: string;
  helperText?: string;
  selected: string[];
  onChange: (next: string[]) => void;
  max: number;
  error?: string;
  disabled?: boolean;
  /** Presentation-only left icon (Complete Profile). */
  leftIcon?: string;
  /** Presentation-only field chrome. Defaults keep Edit Profile unchanged. */
  appearance?: 'default' | 'onboarding';
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
 * Favourite-crop multi-select backed by Crop Master APIs.
 * Browse = GET /crops; search = GET /crops/search (backend aliases).
 */
export function CropMultiSelect({
  label,
  helperText,
  selected,
  onChange,
  max,
  error,
  disabled,
  leftIcon,
  appearance = 'default',
}: CropMultiSelectProps) {
  const theme = useAppTheme();
  const [visible, setVisible] = useState(false);
  const [cropSearch, setCropSearch] = useState('');
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(cropSearch, SEARCH_DEBOUNCE_MS);

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

  const atLimit = selected.length >= max;

  /** Crops with verified Marathi — browse/recommended section.
   * Milk (दूध) is pinned last when present (Farmer Expected Price favourite). */
  const recommended = useMemo(() => {
    const withMr = allCrops.filter((c) => c.nameMr.trim().length > 0);
    const milk = withMr.find((c) => c.name === 'Milk');
    if (!milk) return withMr;
    return [...withMr.filter((c) => c.name !== 'Milk'), milk];
  }, [allCrops]);

  const labelFor = useCallback(
    (name: string): string => getCropLabel(name, allCrops),
    [allCrops],
  );

  const summary =
    selected.length === 0
      ? ''
      : selected.length === 1
        ? labelFor(selected[0]!)
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

  const renderCrop = useCallback(
    ({ item }: { item: CropListItem }) => {
      const isSelected = selected.includes(item.name);
      const canSelect = isSelected || !atLimit;
      return (
        <CropRow
          label={getCropLabel(item)}
          selected={isSelected}
          disabled={!canSelect}
          onPress={() => toggle(item.name)}
        />
      );
    },
    [atLimit, selected, toggle],
  );

  const showEmptyResults = isSearching && !searchLoading && !searchError && searchResults.length === 0;
  const listBusy = isSearching ? searchLoading : cropsLoading;
  const listError = isSearching ? searchError : cropsError;
  const onRetry = isSearching ? refreshSearch : refreshCrops;
  const onboarding = appearance === 'onboarding';

  return (
    <View>
      {onboarding ? null : (
        <View style={styles.fieldHeader}>
          <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant, fontWeight: '500' }]}>
            {label}
          </Text>
          <Text style={[typography.caption, { color: theme.colors.primary, fontWeight: '600' }]}>
            {profileStrings.crops.selectedCount(selected.length, max)}
          </Text>
        </View>
      )}

      <Pressable onPress={() => !disabled && setVisible(true)} disabled={disabled}>
        <View pointerEvents="none">
          <TextInput
            mode="outlined"
            label={onboarding ? profileStrings.crops.fieldPlaceholder : undefined}
            value={summary}
            placeholder={profileStrings.crops.fieldPlaceholder}
            editable={false}
            error={!!error}
            outlineStyle={onboarding ? styles.onboardingOutline : styles.inputOutline}
            style={[styles.input, onboarding ? styles.onboardingInput : null]}
            outlineColor={onboarding ? '#E5E0D4' : undefined}
            activeOutlineColor={onboarding ? '#006A2C' : undefined}
            left={leftIcon ? <TextInput.Icon icon={leftIcon} color={onboarding ? '#006A2C' : undefined} /> : undefined}
            right={<TextInput.Icon icon="chevron-down" />}
          />
        </View>
      </Pressable>

      {onboarding ? (
        <View style={styles.favBar}>
          <MaterialCommunityIcons name="leaf" size={16} color={theme.colors.primary} />
          <Text style={[styles.favBarLabel, { color: theme.colors.onSurface }]}>{label}</Text>
          <Text style={[styles.favBarCount, { color: theme.colors.primary }]}>
            {profileStrings.crops.selectedCount(selected.length, max)}
          </Text>
        </View>
      ) : null}

      {!!helperText && !error && !onboarding && (
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
              onClose={disabled ? undefined : () => remove(value)}
              style={[styles.chip, { backgroundColor: theme.colors.primaryContainer }]}
              textStyle={[styles.chipText, { color: theme.colors.onPrimaryContainer }]}
            >
              {profileStrings.crops.chipPrefix} {labelFor(value)}
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

          {listBusy ? (
            <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
          ) : listError ? (
            <View style={styles.empty}>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
              >
                {listError}
              </Text>
              <Button mode="text" onPress={() => void onRetry()} style={styles.retry}>
                {profileStrings.crops.retry}
              </Button>
            </View>
          ) : isSearching ? (
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
                  data={searchResults}
                  keyExtractor={(item) => String(item.cropId)}
                  style={styles.resultsList}
                  keyboardShouldPersistTaps="handled"
                  initialNumToRender={16}
                  maxToRenderPerBatch={20}
                  windowSize={8}
                  renderItem={renderCrop}
                />
              )}
            </>
          ) : (
            <>
              <Text
                variant="labelLarge"
                style={[styles.sectionHeader, { color: theme.colors.primary }]}
              >
                {profileStrings.crops.recommendedTitle}
              </Text>
              {recommended.length === 0 ? (
                <View style={styles.empty}>
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
                  >
                    {profileStrings.crops.emptyList}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={recommended}
                  keyExtractor={(item) => String(item.cropId)}
                  style={styles.recommendedList}
                  keyboardShouldPersistTaps="handled"
                  initialNumToRender={12}
                  maxToRenderPerBatch={16}
                  windowSize={6}
                  renderItem={renderCrop}
                />
              )}
            </>
          )}
        </Modal>

        <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={3000}>
          {snackbar}
        </Snackbar>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    paddingHorizontal: 2,
  },
  input: { backgroundColor: 'transparent' },
  inputOutline: { borderRadius: radius.lg },
  onboardingInput: {
    backgroundColor: '#F6F3EC',
    minHeight: 56,
  },
  onboardingOutline: { borderRadius: radius.md },
  favBar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    backgroundColor: '#F6F3EC',
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  favBarLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  favBarCount: {
    fontSize: 12,
    fontWeight: '700',
  },
  helper: { marginTop: 0, marginBottom: 0 },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chip: {
    marginBottom: 0,
    borderRadius: radius.pill,
    minHeight: 36,
    paddingHorizontal: spacing.xs,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 13,
    lineHeight: 18,
    marginVertical: 4,
  },
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
  recommendedList: { flexGrow: 1, flexShrink: 1, maxHeight: 360 },
  resultsList: { flexGrow: 1, flexShrink: 1, maxHeight: 360 },
  search: { marginBottom: spacing.sm, borderRadius: radius.md },
  empty: { paddingVertical: spacing.md, paddingHorizontal: spacing.md },
  loader: { marginVertical: spacing.lg },
  retry: { marginTop: spacing.sm },
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
