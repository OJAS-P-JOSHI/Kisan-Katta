import { useRef } from 'react';
import type { NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { StyleSheet, TextInput as RNTextInput, View } from 'react-native';

import { radius, spacing, useAppTheme } from '@/theme';

export type OtpInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
};

/**
 * Six-box OTP entry with auto-focus, backspace-to-previous-box, and paste
 * support (pasting the full code into any box distributes it across boxes).
 */
export function OtpInput({ length = 6, value, onChange, error, disabled }: OtpInputProps) {
  const theme = useAppTheme();
  const inputRefs = useRef<(RNTextInput | null)[]>([]);

  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const setDigitAt = (index: number, rawText: string): void => {
    const cleaned = rawText.replace(/[^0-9]/g, '');

    if (cleaned.length > 1) {
      // Pasted content — distribute starting at this box.
      const next = (value.slice(0, index) + cleaned).slice(0, length);
      onChange(next);
      inputRefs.current[Math.min(next.length, length - 1)]?.focus();
      return;
    }

    const chars = value.split('');
    chars[index] = cleaned;
    const next = chars.join('').slice(0, length);
    onChange(next);

    if (cleaned && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, e: NativeSyntheticEvent<TextInputKeyPressEventData>): void => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      const chars = value.split('');
      chars[index - 1] = '';
      onChange(chars.join(''));
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {digits.map((digit, index) => (
        <RNTextInput
          key={index}
          ref={(ref) => {
            inputRefs.current[index] = ref;
          }}
          style={[
            styles.box,
            {
              borderColor: error ? theme.colors.error : theme.colors.outline,
              color: theme.colors.onSurface,
              backgroundColor: disabled ? theme.colors.surfaceVariant : theme.colors.surface,
            },
          ]}
          value={digit}
          onChangeText={(text) => setDigitAt(index, text)}
          onKeyPress={(e) => handleKeyPress(index, e)}
          keyboardType="number-pad"
          maxLength={length}
          autoFocus={index === 0}
          editable={!disabled}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  box: {
    flex: 1,
    height: 56,
    borderWidth: 1.5,
    borderRadius: radius.md,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
});
