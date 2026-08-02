import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { palette, radius, spacing, useAppTheme } from '@/theme';

import { getReasonEmoji, getReasonTypeLabel } from '../farmer-price.strings';
import { REASON_TYPES, type ReasonType } from '../farmer-price.types';

type ReasonChipsProps = {
  selected: ReasonType | null;
  disabled?: boolean;
  onSelect: (reasonType: ReasonType) => void;
};

/**
 * Single-select reason chips. Values map 1:1 onto the backend `REASON_TYPES`
 * enum, so no submission can be rejected for an unknown reason.
 */
export const ReasonChips = memo(function ReasonChips({
  selected,
  disabled = false,
  onSelect,
}: ReasonChipsProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.wrap}>
      {REASON_TYPES.map((reasonType) => {
        const isSelected = reasonType === selected;
        return (
          <Pressable
            key={reasonType}
            onPress={() => onSelect(reasonType)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected, disabled }}
            accessibilityLabel={getReasonTypeLabel(reasonType)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: isSelected ? palette.green700 : theme.colors.surfaceVariant,
                borderColor: isSelected ? palette.green700 : theme.colors.outlineVariant,
                opacity: pressed && !disabled ? 0.85 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: isSelected ? palette.white : theme.colors.onSurfaceVariant },
              ]}
            >
              {`${getReasonEmoji(reasonType)}  ${getReasonTypeLabel(reasonType)}`}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
});
