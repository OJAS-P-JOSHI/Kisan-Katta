import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type PanResponderGestureState,
} from 'react-native';
import { Text } from 'react-native-paper';

import { palette, radius, useAppTheme } from '@/theme';

import { PRICE_SLIDER_STEP } from '../farmer-price.constants';
import { farmerPriceStrings } from '../farmer-price.strings';
import type { AllowedPriceRangeDTO } from '../farmer-price.types';
import { clampPrice, formatRupee, priceFromRatio, ratioFromPrice } from '../farmer-price.utils';

type PriceSliderProps = {
  value: number;
  range: AllowedPriceRangeDTO;
  governmentPrice: number | null;
  disabled?: boolean;
  onChange: (price: number) => void;
};

const THUMB_SIZE = 28;
const TRACK_HEIGHT = 8;

/**
 * Dependency-free price slider (PanResponder + layout math, no Animated loop).
 * Bounds come from the poll's server-sent allowed range, so the thumb can never
 * leave the band the backend validator accepts.
 */
export const PriceSlider = memo(function PriceSlider({
  value,
  range,
  governmentPrice,
  disabled = false,
  onChange,
}: PriceSliderProps) {
  const theme = useAppTheme();
  const [trackWidth, setTrackWidth] = useState(0);

  // Refs keep the gesture responder stable for the whole drag while it still
  // reads the latest bounds. Synced after commit, never during render.
  const widthRef = useRef(0);
  const rangeRef = useRef(range);
  const govRef = useRef(governmentPrice);
  const disabledRef = useRef(disabled);
  const onChangeRef = useRef(onChange);
  const startXRef = useRef(0);
  const lastValueRef = useRef(value);

  useEffect(() => {
    widthRef.current = trackWidth;
    rangeRef.current = range;
    govRef.current = governmentPrice;
    disabledRef.current = disabled;
    onChangeRef.current = onChange;
    lastValueRef.current = value;
  }, [disabled, governmentPrice, onChange, range, trackWidth, value]);

  const emitFromX = useCallback((x: number) => {
    const width = widthRef.current;
    if (width <= 0) return;
    const next = priceFromRatio(x / width, rangeRef.current, govRef.current);
    if (next !== lastValueRef.current) {
      lastValueRef.current = next;
      onChangeRef.current(next);
    }
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabledRef.current,
        onMoveShouldSetPanResponder: (_event, gesture: PanResponderGestureState) =>
          !disabledRef.current && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        // Keep the drag once it starts — the surrounding ScrollView must not
        // steal the gesture halfway through choosing a price.
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          if (disabledRef.current) return;
          startXRef.current = event.nativeEvent.locationX;
          emitFromX(startXRef.current);
        },
        onPanResponderMove: (_event, gesture: PanResponderGestureState) => {
          if (disabledRef.current) return;
          emitFromX(startXRef.current + gesture.dx);
        },
      }),
    [emitFromX],
  );

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  }, []);

  const ratio = ratioFromPrice(value, range);
  const govRatio =
    governmentPrice !== null && governmentPrice >= range.min && governmentPrice <= range.max
      ? ratioFromPrice(governmentPrice, range)
      : null;

  const nudge = useCallback(
    (delta: number) => {
      const next = clampPrice(value + delta, range);
      if (next !== value) onChange(next);
    },
    [onChange, range, value],
  );

  return (
    <View style={styles.root}>
      <View
        style={styles.touchArea}
        onLayout={handleLayout}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={farmerPriceStrings.vote.a11yPriceSlider}
        accessibilityValue={{ min: range.min, max: range.max, now: value }}
        accessibilityState={{ disabled }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => {
          if (disabled) return;
          if (event.nativeEvent.actionName === 'increment') nudge(PRICE_SLIDER_STEP);
          if (event.nativeEvent.actionName === 'decrement') nudge(-PRICE_SLIDER_STEP);
        }}
        {...panResponder.panHandlers}
      >
        <View style={[styles.track, { backgroundColor: theme.colors.surfaceVariant }]}>
          <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
        </View>

        {govRatio !== null ? (
          <View
            pointerEvents="none"
            style={[styles.govTick, { left: `${govRatio * 100}%` }]}
          />
        ) : null}

        <View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              left: Math.min(
                Math.max(0, trackWidth - THUMB_SIZE),
                Math.max(0, ratio * trackWidth - THUMB_SIZE / 2),
              ),
              borderColor: disabled ? palette.mist : palette.green700,
            },
          ]}
        />
      </View>

      <View style={styles.scale}>
        <Text style={[styles.scaleText, { color: theme.colors.onSurfaceVariant }]}>
          {formatRupee(range.min)}
        </Text>
        {governmentPrice !== null ? (
          <Text style={[styles.scaleTextStrong, { color: theme.colors.onSurfaceVariant }]}>
            {formatRupee(governmentPrice)}
          </Text>
        ) : null}
        <Text style={[styles.scaleText, { color: theme.colors.onSurfaceVariant }]}>
          {formatRupee(range.max)}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: { gap: 6 },
  touchArea: {
    height: 48,
    justifyContent: 'center',
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: TRACK_HEIGHT,
    backgroundColor: palette.green500,
    borderRadius: radius.pill,
  },
  govTick: {
    position: 'absolute',
    width: 2,
    height: 18,
    marginLeft: -1,
    borderRadius: 1,
    backgroundColor: palette.steel,
    opacity: 0.5,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: palette.white,
    borderWidth: 3,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  scale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scaleText: {
    fontSize: 11,
    lineHeight: 15,
  },
  scaleTextStrong: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },
});
