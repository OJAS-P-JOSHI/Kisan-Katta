import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Button, HelperText, Modal, Portal, Text, TextInput } from 'react-native-paper';

import { radius, spacing, useAppTheme } from '@/theme';

import { locationStrings } from '../location.strings';

export type LocationOption = {
  code: number;
  name: string;
  /** Optional secondary line (e.g. Marathi village name). */
  subtitle?: string;
};

export type LocationSelectProps = {
  label: string;
  value: LocationOption | null;
  options: readonly LocationOption[];
  onSelect: (option: LocationOption) => void;
  error?: string;
  disabled?: boolean;
  loading?: boolean;
  loadError?: string | null;
  onRetry?: () => void;
  /** Enables in-modal search (recommended for villages). */
  searchable?: boolean;
  placeholder?: string;
};

/**
 * Code+name picker used for District / Taluka / Village.
 * Optional search filters by English name and subtitle (Marathi).
 */
export function LocationSelect({
  label,
  value,
  options,
  onSelect,
  error,
  disabled,
  loading,
  loadError,
  onRetry,
  searchable = false,
  placeholder,
}: LocationSelectProps) {
  const theme = useAppTheme();
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((item) => {
      const nameHit = item.name.toLowerCase().includes(q);
      const subHit = item.subtitle?.toLowerCase().includes(q) ?? false;
      return nameHit || subHit;
    });
  }, [options, query]);

  const open = (): void => {
    if (disabled || loading) return;
    setQuery('');
    setVisible(true);
  };

  const displayValue = value?.name ?? '';

  return (
    <View>
      <Pressable onPress={open} disabled={disabled || loading}>
        <View pointerEvents="none">
          <TextInput
            mode="outlined"
            label={label}
            value={displayValue}
            placeholder={placeholder}
            editable={false}
            error={!!error || !!loadError}
            outlineStyle={styles.inputOutline}
            style={styles.input}
            right={
              loading ? (
                <TextInput.Icon icon={() => <ActivityIndicator size={18} color={theme.colors.primary} />} />
              ) : (
                <TextInput.Icon icon="chevron-down" />
              )
            }
          />
        </View>
      </Pressable>

      {!!error && <HelperText type="error">{error}</HelperText>}

      {!!loadError && (
        <View style={styles.errorRow}>
          <HelperText type="error" style={styles.errorText}>
            {loadError}
          </HelperText>
          {onRetry ? (
            <Button compact mode="text" onPress={onRetry}>
              {locationStrings.retry}
            </Button>
          ) : null}
        </View>
      )}

      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>
            {label}
          </Text>

          {searchable ? (
            <TextInput
              mode="outlined"
              dense
              placeholder={locationStrings.searchPlaceholder}
              value={query}
              onChangeText={setQuery}
              left={<TextInput.Icon icon="magnify" />}
              style={styles.search}
              autoFocus
            />
          ) : null}

          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.code)}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text
                variant="bodyMedium"
                style={[styles.empty, { color: theme.colors.onSurfaceVariant }]}
              >
                {locationStrings.emptySearch}
              </Text>
            }
            renderItem={({ item }) => {
              const isSelected = value?.code === item.code;
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.option,
                    pressed && { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                  onPress={() => {
                    onSelect(item);
                    setVisible(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={styles.optionText}>
                    <Text
                      variant="bodyLarge"
                      style={{ color: isSelected ? theme.colors.primary : theme.colors.onSurface }}
                    >
                      {item.name}
                    </Text>
                    {item.subtitle ? (
                      <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                      >
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </View>
                  {isSelected ? (
                    <MaterialCommunityIcons name="check" size={20} color={theme.colors.primary} />
                  ) : null}
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
  input: { backgroundColor: 'transparent' },
  inputOutline: { borderRadius: radius.lg },
  modal: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.md,
    maxHeight: '70%',
  },
  modalTitle: { marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  search: { marginBottom: spacing.sm },
  list: { flexGrow: 0 },
  empty: { padding: spacing.md, textAlign: 'center' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
    minHeight: 48,
  },
  optionText: { flex: 1, gap: 2, paddingRight: spacing.sm },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: { flex: 1 },
});
