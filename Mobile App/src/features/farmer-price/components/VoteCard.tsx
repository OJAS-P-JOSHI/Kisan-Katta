import { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';

import { palette, radius, spacing, useAppTheme } from '@/theme';

import { MAX_REASON_LENGTH, MIN_REASON_LENGTH } from '../farmer-price.constants';
import { farmerPriceStrings } from '../farmer-price.strings';
import type { PollDetailResponseDTO, ReasonType } from '../farmer-price.types';
import {
  clampPrice,
  defaultVotePrice,
  formatRupee,
  matchesGovernmentPrice,
  parsePriceInput,
  resolveAllowedRange,
  sanitizePriceInput,
} from '../farmer-price.utils';
import { PriceSlider } from './PriceSlider';
import { ReasonChips } from './ReasonChips';

type VotePayload = {
  expectedPrice: number;
  reasonType?: ReasonType;
  reasonText?: string;
};

type VoteCardProps = {
  poll: PollDetailResponseDTO;
  submitting: boolean;
  onSubmit: (payload: VotePayload) => void | Promise<void>;
};

/**
 * "Share Your Opinion" composer.
 *
 * Reason rules mirror the backend exactly: an explanation is optional only when
 * the government price exists and the chosen price matches it. Every other
 * submission carries a reason type plus a 10–200 character note.
 */
export function VoteCard({ poll, submitting, onSubmit }: VoteCardProps) {
  const theme = useAppTheme();

  const range = useMemo(() => resolveAllowedRange(poll), [poll]);
  const initialPrice = useMemo(() => defaultVotePrice(poll), [poll]);

  const [price, setPrice] = useState(initialPrice);
  const [priceText, setPriceText] = useState(String(initialPrice));
  const [reasonType, setReasonType] = useState<ReasonType | null>(null);
  const [reasonText, setReasonText] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const needsReason = !matchesGovernmentPrice(price, poll);

  // Reason state is kept but ignored while the price matches the government
  // rate, so nothing has to be cleared (and re-typed) when the price moves.
  const activeReasonType = needsReason ? reasonType : null;
  const trimmedReason = needsReason ? reasonText.trim() : '';
  const reasonTextValid =
    trimmedReason.length >= MIN_REASON_LENGTH && trimmedReason.length <= MAX_REASON_LENGTH;
  const reasonComplete = activeReasonType != null && reasonTextValid;
  const canSubmit = !submitting && (!needsReason || reasonComplete);

  const [reveal] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(reveal, {
      toValue: needsReason ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [needsReason, reveal]);

  const applyPrice = useCallback(
    (next: number) => {
      setLocalError(null);
      setPrice(next);
      setPriceText(String(next));
    },
    [],
  );

  const handleSliderChange = useCallback(
    (next: number) => {
      applyPrice(next);
    },
    [applyPrice],
  );

  const handleTextChange = useCallback((raw: string) => {
    setLocalError(null);
    const sanitized = sanitizePriceInput(raw);
    setPriceText(sanitized);
    const parsed = parsePriceInput(sanitized);
    if (parsed !== null) {
      setPrice(parsed);
    }
  }, []);

  /** Snap a partially typed / out-of-band amount back into the allowed range. */
  const handleTextBlur = useCallback(() => {
    const parsed = parsePriceInput(priceText);
    if (parsed === null) {
      applyPrice(price);
      return;
    }
    applyPrice(clampPrice(parsed, range));
  }, [applyPrice, price, priceText, range]);

  const handleMatchGovernment = useCallback(() => {
    if (poll.governmentPriceSnapshot === null) return;
    applyPrice(clampPrice(poll.governmentPriceSnapshot, range));
  }, [applyPrice, poll.governmentPriceSnapshot, range]);

  const handleSubmit = useCallback(() => {
    const parsed = parsePriceInput(priceText);
    if (parsed === null) {
      setLocalError(
        priceText.trim()
          ? farmerPriceStrings.vote.priceInvalid
          : farmerPriceStrings.vote.priceRequired,
      );
      return;
    }
    if (parsed < range.min || parsed > range.max) {
      setLocalError(
        farmerPriceStrings.vote.priceOutOfRange(formatRupee(range.min), formatRupee(range.max)),
      );
      return;
    }

    if (needsReason) {
      if (!activeReasonType) {
        setLocalError(farmerPriceStrings.vote.reasonTypeRequired);
        return;
      }
      if (!reasonTextValid) {
        setLocalError(farmerPriceStrings.vote.reasonTextRequired);
        return;
      }
    }

    const payload: VotePayload = { expectedPrice: parsed };
    if (needsReason && activeReasonType) {
      payload.reasonType = activeReasonType;
      payload.reasonText = trimmedReason;
    }

    void onSubmit(payload);
  }, [
    activeReasonType,
    needsReason,
    onSubmit,
    priceText,
    range.max,
    range.min,
    reasonTextValid,
    trimmedReason,
  ]);

  const canMatchGovernment =
    poll.governmentPriceAvailable &&
    poll.governmentPriceSnapshot !== null &&
    price !== poll.governmentPriceSnapshot;

  return (
    <View style={styles.root}>
      <Text style={[styles.heading, { color: theme.colors.onSurface }]}>
        {farmerPriceStrings.vote.heading}
      </Text>
      <Text style={[styles.question, { color: theme.colors.onSurface }]}>
        {farmerPriceStrings.vote.question}
      </Text>
      <Text style={[styles.helper, { color: theme.colors.onSurfaceVariant }]}>
        {farmerPriceStrings.vote.helper}
      </Text>

      <View style={styles.amountRow}>
        <Text style={[styles.amount, { color: palette.green900 }]}>{formatRupee(price)}</Text>
        <Text style={[styles.amountSuffix, { color: theme.colors.onSurfaceVariant }]}>
          {farmerPriceStrings.vote.suffix}
        </Text>
      </View>

      <PriceSlider
        value={price}
        range={range}
        governmentPrice={poll.governmentPriceAvailable ? poll.governmentPriceSnapshot : null}
        disabled={submitting}
        onChange={handleSliderChange}
      />

      <View style={styles.inputRow}>
        <TextInput
          mode="outlined"
          value={priceText}
          onChangeText={handleTextChange}
          onBlur={handleTextBlur}
          keyboardType="number-pad"
          editable={!submitting}
          left={<TextInput.Affix text={farmerPriceStrings.vote.prefix} />}
          accessibilityLabel={farmerPriceStrings.vote.a11yPriceField}
          style={styles.input}
          outlineStyle={styles.inputOutline}
          dense
        />
        {canMatchGovernment ? (
          <Button
            mode="text"
            compact
            onPress={handleMatchGovernment}
            disabled={submitting}
            style={styles.matchButton}
            labelStyle={styles.matchLabel}
            accessibilityLabel={farmerPriceStrings.vote.matchGovernment}
          >
            {farmerPriceStrings.vote.matchGovernment}
          </Button>
        ) : null}
      </View>

      <Animated.View
        style={{
          opacity: reveal,
          maxHeight: reveal.interpolate({ inputRange: [0, 1], outputRange: [0, 620] }),
          overflow: 'hidden',
        }}
        pointerEvents={needsReason ? 'auto' : 'none'}
      >
        <View style={styles.reasonBlock}>
          <Text style={[styles.reasonHeading, { color: theme.colors.onSurface }]}>
            {farmerPriceStrings.vote.reasonHeading}
          </Text>

          <ReasonChips
            selected={activeReasonType}
            disabled={submitting}
            onSelect={(next) => {
              setLocalError(null);
              setReasonType(next);
            }}
          />

          {activeReasonType ? (
            <View style={styles.noteBlock}>
              <TextInput
                mode="outlined"
                label={farmerPriceStrings.vote.reasonNoteLabel}
                value={reasonText}
                onChangeText={(text) => {
                  setLocalError(null);
                  setReasonText(text.slice(0, MAX_REASON_LENGTH));
                }}
                placeholder={farmerPriceStrings.vote.reasonNotePlaceholder}
                multiline
                numberOfLines={3}
                editable={!submitting}
                dense
                style={styles.noteInput}
                outlineStyle={styles.inputOutline}
              />
              <Text style={[styles.counter, { color: theme.colors.onSurfaceVariant }]}>
                {farmerPriceStrings.vote.reasonCounter(reasonText.length, MAX_REASON_LENGTH)}
              </Text>
            </View>
          ) : null}
        </View>
      </Animated.View>

      {localError ? <HelperText type="error">{localError}</HelperText> : null}

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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  heading: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  question: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  helper: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: -6,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  amount: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  amountSuffix: {
    fontSize: 13,
    lineHeight: 20,
    paddingBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: palette.white,
    height: 48,
  },
  inputOutline: {
    borderRadius: radius.lg,
  },
  matchButton: {
    borderRadius: radius.lg,
  },
  matchLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  reasonBlock: {
    gap: 12,
    paddingTop: 4,
  },
  reasonHeading: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
  },
  noteBlock: { gap: 2 },
  noteInput: {
    minHeight: 76,
    maxHeight: 110,
    backgroundColor: palette.white,
  },
  counter: {
    alignSelf: 'flex-end',
    fontSize: 11,
    lineHeight: 14,
  },
  submit: {
    borderRadius: radius.lg,
    marginTop: 2,
  },
  submitContent: {
    height: 52,
  },
  submitLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
});
