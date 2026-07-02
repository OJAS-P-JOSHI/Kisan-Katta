import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { HelperText, Modal, Portal, Text, TextInput } from 'react-native-paper';

import { radius, spacing, useAppTheme } from '@/theme';

export type DropdownProps = {
  label: string;
  value: string | null;
  options: readonly string[];
  onSelect: (value: string) => void;
  error?: string;
  disabled?: boolean;
};

/**
 * Generic single-select dropdown built on the existing design system
 * (react-native-paper `Modal`/`Portal`). Used for District, Taluka, and
 * Language selection so no new UI library is introduced.
 */
export function Dropdown({ label, value, options, onSelect, error, disabled }: DropdownProps) {
  const theme = useAppTheme();
  const [visible, setVisible] = useState(false);

  return (
    <View>
      <Pressable onPress={() => !disabled && setVisible(true)} disabled={disabled}>
        <View pointerEvents="none">
          <TextInput
            mode="outlined"
            label={label}
            value={value ?? ''}
            editable={false}
            error={!!error}
            right={<TextInput.Icon icon="chevron-down" />}
          />
        </View>
      </Pressable>
      {!!error && <HelperText type="error">{error}</HelperText>}

      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>
            {label}
          </Text>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            style={styles.list}
            renderItem={({ item }) => {
              const isSelected = item === value;
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
                >
                  <Text
                    variant="bodyLarge"
                    style={{ color: isSelected ? theme.colors.primary : theme.colors.onSurface }}
                  >
                    {item}
                  </Text>
                  {isSelected && (
                    <MaterialCommunityIcons name="check" size={20} color={theme.colors.primary} />
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
  modal: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.md,
    maxHeight: '70%',
  },
  modalTitle: { marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  list: { flexGrow: 0 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
});
