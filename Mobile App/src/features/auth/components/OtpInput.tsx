import { useRef, useState } from 'react';
import type { NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { TextInput as RNTextInput, StyleSheet, View, useWindowDimensions } from 'react-native';

import { spacing } from '@/theme';

export type OtpInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
  /** Presentation-only: parent horizontal inset so boxes fit without clipping. */
  contentInset?: number;
};

const SCREEN_HORIZONTAL_PADDING = spacing.lg * 2;
const BOX_GAP = spacing.sm;
const MAX_BOX_SIZE = 52;
const MIN_BOX_SIZE = 40;

const C = {
  primary: '#006A2C',
  idle: '#D4CFC4',
  filled: '#2F6A3A',
  error: '#C62828',
  text: '#4A3728',
  surface: '#FFFFFF',
  disabled: '#F3F0E8',
} as const;

/**
 * Six-box OTP entry with auto-focus, backspace-to-previous-box, and paste
 * support (pasting the full code into any box distributes it across boxes).
 *
 * Box size is derived from the available screen width so the full row
 * always fits on-screen (no horizontal scrolling) while still filling up
 * to a comfortable, premium touch-target size on larger devices.
 */
export function OtpInput({
  length = 6,
  value,
  onChange,
  error,
  disabled,
  contentInset,
}: OtpInputProps) {
  const { width } = useWindowDimensions();
  const inputRefs = useRef<(RNTextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const horizontalPadding = contentInset ?? SCREEN_HORIZONTAL_PADDING;
  const availableWidth = width - horizontalPadding - BOX_GAP * (length - 1);
  const boxSize = Math.min(MAX_BOX_SIZE, Math.max(MIN_BOX_SIZE, Math.floor(availableWidth / length)));

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
    <View style={styles.wrapper}>
      <View style={[styles.row, { gap: BOX_GAP }]}>
        {digits.map((digit, index) => {
          const focused = focusedIndex === index;
          const borderColor = error ? C.error : focused ? C.primary : digit ? C.filled : C.idle;
          return (
            <RNTextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.box,
                {
                  width: boxSize,
                  height: boxSize,
                  borderColor,
                  borderWidth: focused || (digit && !error) ? 2 : 1.5,
                  color: C.text,
                  backgroundColor: disabled ? C.disabled : C.surface,
                },
              ]}
              value={digit}
              onChangeText={(text) => setDigitAt(index, text)}
              onKeyPress={(e) => handleKeyPress(index, e)}
              onFocus={() => setFocusedIndex(index)}
              keyboardType="number-pad"
              maxLength={length}
              autoFocus={index === 0}
              editable={!disabled}
              selectTextOnFocus
              selectionColor={C.primary}
              textAlignVertical="center"
              underlineColorAndroid="transparent"
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  box: {
    borderRadius: 12,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    padding: 0,
    margin: 0,
  },
});
