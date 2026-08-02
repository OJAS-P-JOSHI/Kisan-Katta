import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { IconButton, Text } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { iconSize, spacing, useAppTheme } from '@/theme';
import { buildCloudinaryDisplayUrl } from '@/utils/cloudinaryDisplayUrl';

type FullscreenImageViewerProps = {
  urls: string[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
};

type ZoomableSlideProps = {
  uri: string;
  width: number;
  height: number;
};

function ZoomableSlide({ uri, width, height }: ZoomableSlideProps) {
  const theme = useAppTheme();
  const displayUri = buildCloudinaryDisplayUrl(uri, 1600);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  useEffect(() => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    setLoading(true);
    setFailed(false);
  }, [
    displayUri,
    reloadKey,
    scale,
    savedScale,
    translateX,
    translateY,
    savedTranslateX,
    savedTranslateY,
  ]);

  const resetZoom = useCallback(() => {
    scale.value = withTiming(1);
    savedScale.value = 1;
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [scale, savedScale, translateX, translateY, savedTranslateX, savedTranslateY]);

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      'worklet';
      scale.value = Math.min(Math.max(savedScale.value * event.scale, 1), 4);
    })
    .onEnd(() => {
      'worklet';
      savedScale.value = scale.value;
      if (scale.value <= 1.05) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  // Only steal pans while zoomed so horizontal swipe can change pages.
  const pan = Gesture.Pan()
    .manualActivation(true)
    .onTouchesMove((_event, state) => {
      'worklet';
      if (savedScale.value > 1.05) {
        state.activate();
      } else {
        state.fail();
      }
    })
    .onUpdate((event) => {
      'worklet';
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      'worklet';
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      'worklet';
      if (savedScale.value > 1.1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withTiming(2.2);
        savedScale.value = 2.2;
      }
    });

  const composed = Gesture.Exclusive(doubleTap, Gesture.Simultaneous(pinch, pan));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
      {!failed ? (
        <GestureDetector gesture={composed}>
          <Animated.View style={animatedStyle}>
            <Animated.Image
              key={`${displayUri}-${reloadKey}`}
              source={{ uri: displayUri }}
              style={{ width, height }}
              resizeMode="contain"
              onLoadStart={() => setLoading(true)}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setFailed(true);
              }}
            />
          </Animated.View>
        </GestureDetector>
      ) : (
        <Pressable
          onPress={() => {
            setFailed(false);
            setReloadKey((key) => key + 1);
            resetZoom();
          }}
          style={styles.retry}
        >
          <MaterialCommunityIcons
            name="image-off-outline"
            size={iconSize.xl}
            color="#FFFFFF"
          />
          <Text style={{ color: '#FFFFFF' }}>पुन्हा प्रयत्न करा</Text>
        </Pressable>
      )}

      {loading && !failed ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

/** Production fullscreen gallery: swipe, pinch, double-tap zoom, close. */
export function FullscreenImageViewer({
  urls,
  initialIndex,
  visible,
  onClose,
}: FullscreenImageViewerProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (visible) setIndex(initialIndex);
  }, [visible, initialIndex]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(event.nativeEvent.contentOffset.x / width);
      setIndex(next);
    },
    [width],
  );

  const slideHeight = height - insets.top - insets.bottom - 72;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.root}>
        <View style={[styles.root, { backgroundColor: '#0B0F0C' }]}>
          <View
            style={[
              styles.topBar,
              { paddingTop: insets.top + spacing.xs, paddingHorizontal: spacing.sm },
            ]}
          >
            <Text style={styles.counter}>
              {urls.length > 0 ? `${index + 1} / ${urls.length}` : ''}
            </Text>
            <IconButton
              icon="close"
              size={24}
              onPress={onClose}
              iconColor="#FFFFFF"
              style={styles.close}
              accessibilityLabel="Close"
            />
          </View>

          <FlatList
            data={urls}
            keyExtractor={(item, i) => `${item}-${i}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={Math.min(initialIndex, Math.max(urls.length - 1, 0))}
            getItemLayout={(_, i) => ({
              length: width,
              offset: width * i,
              index: i,
            })}
            onMomentumScrollEnd={handleScroll}
            renderItem={({ item }) => (
              <ZoomableSlide uri={item} width={width} height={slideHeight} />
            )}
          />

          <Pressable
            onPress={onClose}
            style={[styles.closeHint, { paddingBottom: insets.bottom + spacing.md }]}
            accessibilityRole="button"
          >
            <Text style={{ color: theme.colors.onPrimary, opacity: 0.8 }}>
              बंद करण्यासाठी टॅप करा
            </Text>
          </Pressable>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  counter: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    paddingLeft: spacing.sm,
  },
  close: { margin: 0 },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retry: { alignItems: 'center', gap: spacing.sm },
  closeHint: { alignItems: 'center', paddingTop: spacing.sm },
});
