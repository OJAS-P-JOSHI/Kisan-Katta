import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';

import { spacing } from '@/theme';

import { assistanceStrings } from '../assistance.strings';
import { saath, saathPadX, saathSearchInput, saathSearchPill } from '../assistance.ui';

type AssistanceSearchFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
};

/**
 * Visual restyle of the existing feed search. Trailing control is clear-query
 * only — no filter affordance, because no extra filter API exists on this screen.
 */
export function AssistanceSearchField({ value, onChangeText }: AssistanceSearchFieldProps) {
  const { width, fontScale } = useWindowDimensions();
  const [focused, setFocused] = useState(false);
  const padX = saathPadX(width);
  const fontSize = width < 360 || fontScale > 1.2 ? 13 : 14;

  return (
    <View style={[styles.wrap, { paddingHorizontal: padX }]}>
      <View style={[saathSearchPill, focused && styles.focused]}>
        <View style={styles.side} accessibilityElementsHidden>
          <MaterialCommunityIcons name="magnify" size={22} color={saath.primary} />
        </View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={assistanceStrings.feed.searchPlaceholder}
          placeholderTextColor={saath.muted}
          returnKeyType="search"
          accessibilityLabel={assistanceStrings.feed.searchA11y}
          maxFontSizeMultiplier={1.5}
          style={[saathSearchInput, { fontSize, lineHeight: Math.round(fontSize * 1.4) }]}
          underlineColorAndroid="transparent"
        />
        {value.length > 0 ? (
          <Pressable
            onPress={() => onChangeText('')}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={assistanceStrings.feed.searchClearA11y}
            style={({ pressed }) => [styles.side, pressed && styles.sidePressed]}
          >
            <MaterialCommunityIcons name="close-circle" size={20} color={saath.muted} />
          </Pressable>
        ) : (
          <View style={styles.side} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: spacing.sm,
  },
  focused: {
    borderColor: saath.searchBorderFocus,
    backgroundColor: saath.searchWashFocus,
  },
  side: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidePressed: {
    opacity: 0.7,
  },
});
