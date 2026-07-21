import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Button, HelperText, Modal, Portal, Text, TextInput } from 'react-native-paper';

import {
  iconSize,
  palette,
  radius,
  spacing,
  useAppTheme,
} from '@/theme';

import { MAX_REASON_LENGTH, MIN_REASON_LENGTH } from '../farmer-price.constants';
import { farmerPriceStrings, getReasonTypeLabel } from '../farmer-price.strings';
import { REASON_TYPES, type ReasonType } from '../farmer-price.types';
import { parsePriceInput, sanitizePriceInput } from '../farmer-price.utils';

type VoteCardProps = {
  governmentPriceAvailable: boolean;
  governmentPriceSnapshot: number | null;
  submitting: boolean;
  onSubmit: (payload: {
    expectedPrice: number;
    reasonType?: ReasonType;
    reasonText?: string;
  }) => void | Promise<void>;
};

/**
 * Reason is required when:
 * - No government price (no reference to match), or
 * - Government price exists and the entered price differs from it.
 * Reason is optional only when gov price is available and price matches it.
 */
function computeNeedsReason(
  governmentPriceAvailable: boolean,
  governmentPriceSnapshot: number | null,
  parsedPrice: number | null,
): boolean {
  if (parsedPrice == null) return false;
  if (!governmentPriceAvailable) return true;
  if (governmentPriceSnapshot == null) return true;
  return parsedPrice !== governmentPriceSnapshot;
}

/** Compact vote form — rendered inside PollCard (no separate card shell). */
export function VoteCard({
  governmentPriceAvailable,
  governmentPriceSnapshot,
  submitting,
  onSubmit,
}: VoteCardProps) {
  const theme = useAppTheme();
  const [priceText, setPriceText] = useState('');
  const [reasonType, setReasonType] = useState<ReasonType | null>(null);
  const [reasonText, setReasonText] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [reasonMenuOpen, setReasonMenuOpen] = useState(false);

  const parsedPrice = parsePriceInput(priceText);
  const needsReason = computeNeedsReason(
    governmentPriceAvailable,
    governmentPriceSnapshot,
    parsedPrice,
  );

  const trimmedReason = reasonText.trim();
  const reasonTextValid =
    trimmedReason.length >= MIN_REASON_LENGTH && trimmedReason.length <= MAX_REASON_LENGTH;
  const reasonComplete = reasonType != null && reasonTextValid;
  const canSubmit = parsedPrice != null && (!needsReason || reasonComplete) && !submitting;

  const reasonHeight = useRef(new Animated.Value(0)).current;
  const reasonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(reasonHeight, {
        toValue: needsReason ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(reasonOpacity, {
        toValue: needsReason ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
    if (!needsReason) {
      setReasonType(null);
      setReasonText('');
    }
  }, [needsReason, reasonHeight, reasonOpacity]);

  const handlePriceChange = (raw: string) => {
    setLocalError(null);
    setPriceText(sanitizePriceInput(raw));
  };

  const handleSubmit = () => {
    const price = parsePriceInput(priceText);
    if (price == null) {
      setLocalError(
        priceText.trim()
          ? farmerPriceStrings.vote.priceInvalid
          : farmerPriceStrings.vote.priceRequired,
      );
      return;
    }

    if (needsReason) {
      if (!reasonType) {
        setLocalError(farmerPriceStrings.vote.reasonTypeRequired);
        return;
      }
      if (!reasonTextValid) {
        setLocalError(farmerPriceStrings.vote.reasonTextRequired);
        return;
      }
    }

    const payload: {
      expectedPrice: number;
      reasonType?: ReasonType;
      reasonText?: string;
    } = { expectedPrice: price };

    if (needsReason && reasonType) {
      payload.reasonType = reasonType;
      payload.reasonText = trimmedReason;
    }

    void onSubmit(payload);
  };

  return (
    <View style={styles.root}>
      <Text style={[styles.heading, { color: theme.colors.onSurface }]}>
        {farmerPriceStrings.vote.heading}
      </Text>

      <TextInput
        mode="outlined"
        value={priceText}
        onChangeText={handlePriceChange}
        placeholder={farmerPriceStrings.vote.placeholder}
        keyboardType="number-pad"
        editable={!submitting}
        error={!!localError && !needsReason}
        left={<TextInput.Affix text={farmerPriceStrings.vote.prefix} />}
        right={<TextInput.Affix text={farmerPriceStrings.vote.suffix} />}
        accessibilityLabel={farmerPriceStrings.vote.a11yPriceField}
        style={styles.input}
        outlineStyle={styles.inputOutline}
        dense
      />
      {localError && !needsReason ? <HelperText type="error">{localError}</HelperText> : null}

      <Animated.View
        style={{
          opacity: reasonOpacity,
          maxHeight: reasonHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 220],
          }),
          overflow: 'hidden',
        }}
        pointerEvents={needsReason ? 'auto' : 'none'}
      >
        <View style={styles.reasonBlock}>
          <Pressable
            onPress={() => !submitting && setReasonMenuOpen(true)}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel={farmerPriceStrings.vote.reasonTypeLabel}
            style={styles.dropdownPressable}
          >
            <View pointerEvents="none">
              <TextInput
                mode="outlined"
                label={farmerPriceStrings.vote.reasonTypeLabel}
                value={reasonType ? getReasonTypeLabel(reasonType) : ''}
                placeholder={farmerPriceStrings.vote.reasonTypePlaceholder}
                editable={false}
                dense
                error={localError === farmerPriceStrings.vote.reasonTypeRequired}
                right={<TextInput.Icon icon="chevron-down" />}
                outlineStyle={styles.inputOutline}
              />
            </View>
          </Pressable>

          {reasonType ? (
            <View>
              <TextInput
                mode="outlined"
                value={reasonText}
                onChangeText={(text) => {
                  setLocalError(null);
                  setReasonText(text.slice(0, MAX_REASON_LENGTH));
                }}
                placeholder={farmerPriceStrings.vote.reasonTextPlaceholder}
                multiline
                numberOfLines={3}
                editable={!submitting}
                dense
                error={localError === farmerPriceStrings.vote.reasonTextRequired}
                style={styles.reasonInput}
                outlineStyle={styles.inputOutline}
              />
              <Text style={[styles.counter, { color: theme.colors.onSurfaceVariant }]}>
                {farmerPriceStrings.vote.reasonCounter(reasonText.length, MAX_REASON_LENGTH)}
              </Text>
            </View>
          ) : null}

          {localError && needsReason ? <HelperText type="error">{localError}</HelperText> : null}
        </View>
      </Animated.View>

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={submitting}
        disabled={!canSubmit}
        style={styles.submit}
        contentStyle={styles.submitContent}
        labelStyle={styles.submitLabel}
        buttonColor={palette.green700}
        accessibilityLabel={farmerPriceStrings.vote.a11ySubmit}
        accessibilityState={{ disabled: !canSubmit }}
      >
        {submitting ? farmerPriceStrings.vote.submitting : farmerPriceStrings.vote.submit}
      </Button>

      <Portal>
        <Modal
          visible={reasonMenuOpen}
          onDismiss={() => setReasonMenuOpen(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>
            {farmerPriceStrings.vote.reasonTypeLabel}
          </Text>
          <FlatList
            data={[...REASON_TYPES]}
            keyExtractor={(item) => item}
            style={styles.list}
            renderItem={({ item }) => {
              const selected = item === reasonType;
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.option,
                    pressed && { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                  onPress={() => {
                    setReasonType(item);
                    setLocalError(null);
                    setReasonMenuOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text
                    variant="bodyLarge"
                    style={{ color: selected ? theme.colors.primary : theme.colors.onSurface }}
                  >
                    {getReasonTypeLabel(item)}
                  </Text>
                  {selected ? (
                    <MaterialCommunityIcons
                      name="check"
                      size={iconSize.md}
                      color={theme.colors.primary}
                    />
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
  root: {
    gap: 12,
  },
  heading: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  input: {
    backgroundColor: palette.white,
    height: 48,
  },
  inputOutline: {
    borderRadius: radius.lg,
  },
  reasonBlock: {
    gap: 12,
    paddingTop: 2,
  },
  dropdownPressable: {
    minHeight: 48,
  },
  reasonInput: {
    minHeight: 72,
    maxHeight: 96,
    backgroundColor: palette.white,
  },
  counter: {
    alignSelf: 'flex-end',
    marginTop: 4,
    fontSize: 11,
    lineHeight: 14,
  },
  submit: {
    borderRadius: radius.lg,
    marginTop: 2,
  },
  submitContent: {
    height: 48,
  },
  submitLabel: {
    fontWeight: '700',
    fontSize: 15,
  },
  modal: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.md,
    maxHeight: '70%',
  },
  modalTitle: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  list: { flexGrow: 0 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
    minHeight: 48,
  },
});
