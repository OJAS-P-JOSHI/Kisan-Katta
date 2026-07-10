import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Chip, HelperText, Modal, Portal, Text, TextInput } from 'react-native-paper';

import type { MaharashtraCrop } from '@/constants/maharashtraCrops';
import { MAHARASHTRA_CROP_BY_VALUE } from '@/constants/maharashtraCrops';
import { radius, spacing, useAppTheme } from '@/theme';

export type CropMultiSelectProps = {
  label: string;
  helperText?: string;
  options: readonly MaharashtraCrop[];
  selected: string[];
  onChange: (next: string[]) => void;
  max: number;
  error?: string;
  disabled?: boolean;
};

/**
 * Searchable multi-select for Maharashtra favourite crops.
 * Selection state stores Agmarknet `value` strings; search filters on `label`.
 */
export function CropMultiSelect({
  label,
  helperText,
  options,
  selected,
  onChange,
  max,
  error,
  disabled,
}: CropMultiSelectProps) {
  const theme = useAppTheme();
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');

  const atLimit = selected.length >= max;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((crop) => crop.label.toLowerCase().includes(q));
  }, [options, query]);

  const selectedCrops = useMemo(
    () =>
      selected
        .map((value) => MAHARASHTRA_CROP_BY_VALUE.get(value))
        .filter((crop): crop is MaharashtraCrop => Boolean(crop)),
    [selected],
  );

  const summary =
    selectedCrops.length === 0
      ? ''
      : selectedCrops.length === 1
        ? selectedCrops[0].label
        : `${selectedCrops.length} crops selected`;

  const toggle = (value: string): void => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
      return;
    }
    if (atLimit) return;
    onChange([...selected, value]);
  };

  const remove = (value: string): void => {
    onChange(selected.filter((item) => item !== value));
  };

  const closeModal = (): void => {
    setVisible(false);
    setQuery('');
  };

  return (
    <View>
      <Pressable onPress={() => !disabled && setVisible(true)} disabled={disabled}>
        <View pointerEvents="none">
          <TextInput
            mode="outlined"
            dense
            label={`${label} (${selected.length}/${max})`}
            value={summary}
            placeholder="Search and select crops"
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

      {selectedCrops.length > 0 && (
        <View style={styles.chipRow}>
          {selectedCrops.map((crop) => (
            <Chip
              key={crop.id}
              mode="flat"
              compact
              onClose={disabled ? undefined : () => remove(crop.value)}
              style={styles.chip}
            >
              {crop.label}
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
            placeholder="Search crops…"
            value={query}
            onChangeText={setQuery}
            left={<TextInput.Icon icon="magnify" />}
            right={
              query ? <TextInput.Icon icon="close" onPress={() => setQuery('')} /> : undefined
            }
            style={styles.search}
            autoFocus
          />
          {atLimit && (
            <Text variant="bodySmall" style={[styles.limitHint, { color: theme.colors.onSurfaceVariant }]}>
              Maximum {max} crops selected
            </Text>
          )}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text
                variant="bodyMedium"
                style={[styles.empty, { color: theme.colors.onSurfaceVariant }]}
              >
                No crops match your search
              </Text>
            }
            renderItem={({ item }) => {
              const isSelected = selected.includes(item.value);
              const canSelect = isSelected || !atLimit;
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.option,
                    pressed && canSelect && { backgroundColor: theme.colors.surfaceVariant },
                    !canSelect && styles.optionDisabled,
                  ]}
                  disabled={!canSelect}
                  onPress={() => toggle(item.value)}
                >
                  <View style={styles.optionText}>
                    <Text
                      variant="bodyLarge"
                      style={{
                        color: isSelected ? theme.colors.primary : theme.colors.onSurface,
                      }}
                    >
                      {item.label}
                    </Text>
                  </View>
                  {isSelected && (
                    <MaterialCommunityIcons name="check-circle" size={22} color={theme.colors.primary} />
                  )}
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
  helper: { marginTop: 0, marginBottom: 0 },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  chip: { marginBottom: 2 },
  modal: {
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    maxHeight: '80%',
  },
  modalTitle: { marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  search: { marginBottom: spacing.xs },
  limitHint: { marginBottom: spacing.xs, paddingHorizontal: spacing.xs },
  list: { flexGrow: 0 },
  empty: { textAlign: 'center', paddingVertical: spacing.lg },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  optionDisabled: { opacity: 0.4 },
  optionText: { flex: 1, paddingRight: spacing.sm },
});
