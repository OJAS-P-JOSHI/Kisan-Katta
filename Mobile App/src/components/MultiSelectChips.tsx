import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, HelperText, IconButton, Text, TextInput } from 'react-native-paper';

import { spacing, useAppTheme } from '@/theme';

export type MultiSelectChipsProps = {
  label: string;
  helperText?: string;
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  max: number;
  error?: string;
};

/**
 * Generic multi-select control built from react-native-paper `Chip`s.
 * Supports both a predefined option list and freeform custom entries
 * (crop names are not restricted by the backend), capped at `max` items.
 */
export function MultiSelectChips({
  label,
  helperText,
  options,
  selected,
  onChange,
  max,
  error,
}: MultiSelectChipsProps) {
  const theme = useAppTheme();
  const [customValue, setCustomValue] = useState('');

  const atLimit = selected.length >= max;
  const customSelected = selected.filter((item) => !options.includes(item));

  const toggle = (item: string) => {
    if (selected.includes(item)) {
      onChange(selected.filter((c) => c !== item));
      return;
    }
    if (atLimit) return;
    onChange([...selected, item]);
  };

  const addCustom = () => {
    const trimmed = customValue.trim();
    if (!trimmed || atLimit || selected.includes(trimmed)) return;
    onChange([...selected, trimmed]);
    setCustomValue('');
  };

  return (
    <View>
      <View style={styles.headerRow}>
        <Text variant="labelLarge" style={{ color: theme.colors.onSurface }}>
          {label}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {selected.length}/{max}
        </Text>
      </View>
      {!!helperText && (
        <Text variant="bodySmall" style={[styles.helper, { color: theme.colors.onSurfaceVariant }]}>
          {helperText}
        </Text>
      )}

      <View style={styles.chipRow}>
        {options.map((item) => {
          const isSelected = selected.includes(item);
          return (
            <Chip
              key={item}
              selected={isSelected}
              mode={isSelected ? 'flat' : 'outlined'}
              onPress={() => toggle(item)}
              disabled={!isSelected && atLimit}
              style={styles.chip}
            >
              {item}
            </Chip>
          );
        })}
        {customSelected.map((item) => (
          <Chip key={item} selected mode="flat" onClose={() => toggle(item)} style={styles.chip}>
            {item}
          </Chip>
        ))}
      </View>

      <View style={styles.addRow}>
        <TextInput
          mode="outlined"
          dense
          style={styles.addInput}
          placeholder="Add another crop"
          value={customValue}
          onChangeText={setCustomValue}
          onSubmitEditing={addCustom}
          returnKeyType="done"
          editable={!atLimit}
        />
        <IconButton icon="plus" mode="contained" onPress={addCustom} disabled={!customValue.trim() || atLimit} />
      </View>

      {!!error && <HelperText type="error">{error}</HelperText>}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  helper: { marginTop: 2, marginBottom: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  chip: { marginBottom: spacing.xs },
  addRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, gap: spacing.xs },
  addInput: { flex: 1 },
});
