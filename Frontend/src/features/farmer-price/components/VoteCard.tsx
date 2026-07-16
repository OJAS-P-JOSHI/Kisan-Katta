import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Button, Card, HelperText, Modal, Portal, Text, TextInput } from 'react-native-paper';

import {
  buttonSurface,
  cardSurface,
  iconSize,
  radius,
  spacing,
  typography,
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

  if (!governmentPriceAvailable) {
    return true;
  }

  if (governmentPriceSnapshot == null) {
    return true;
  }

  return parsedPrice !== governmentPriceSnapshot;
}

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

  const canSubmit =
    parsedPrice != null && (!needsReason || reasonComplete) && !submitting;

  const reasonHeight = useRef(new Animated.Value(0)).current;
  const reasonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(reasonHeight, {
        toValue: needsReason ? 1 : 0,
        duration: 220,
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

  const maxReasonLines = 4;

  return (
    <Card
      mode="elevated"
      style={[styles.card, cardSurface, { backgroundColor: theme.colors.surface }]}
    >
      <Card.Content style={styles.content}>
        <Text style={[typography.sectionTitle, { color: theme.colors.onSurface }]}>
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
        />
        {localError && !needsReason ? <HelperText type="error">{localError}</HelperText> : null}

        <Animated.View
          style={{
            opacity: reasonOpacity,
            maxHeight: reasonHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 280],
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
                  error={localError === farmerPriceStrings.vote.reasonTypeRequired}
                  right={<TextInput.Icon icon="chevron-down" />}
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
                  numberOfLines={maxReasonLines}
                  editable={!submitting}
                  error={localError === farmerPriceStrings.vote.reasonTextRequired}
                  style={styles.reasonInput}
                />
                <Text
                  style={[
                    typography.caption,
                    styles.counter,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
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
          style={[buttonSurface, styles.submit]}
          contentStyle={styles.submitContent}
          labelStyle={styles.submitLabel}
          accessibilityLabel={farmerPriceStrings.vote.a11ySubmit}
          accessibilityState={{ disabled: !canSubmit }}
        >
          {submitting ? farmerPriceStrings.vote.submitting : farmerPriceStrings.vote.submit}
        </Button>
      </Card.Content>

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
                    <MaterialCommunityIcons name="check" size={iconSize.md} color={theme.colors.primary} />
                  ) : null}
                </Pressable>
              );
            }}
          />
        </Modal>
      </Portal>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {},
  content: {
    padding: spacing.md + 4,
    gap: spacing.md,
  },
  input: {
    backgroundColor: 'transparent',
  },
  reasonBlock: {
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  dropdownPressable: {
    minHeight: 48,
  },
  reasonInput: {
    minHeight: 96,
    maxHeight: 120,
  },
  counter: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  submit: {
    marginTop: spacing.xs,
  },
  submitContent: {
    minHeight: 48,
  },
  submitLabel: {
    fontWeight: '700',
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
