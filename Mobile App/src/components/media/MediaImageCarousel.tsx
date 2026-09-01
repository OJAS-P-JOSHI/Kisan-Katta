import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useMemo, useState, type ComponentProps } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Text } from 'react-native-paper';

import { FullscreenImageViewer } from '@/components/media/FullscreenImageViewer';
import { RemoteImage } from '@/components/media/RemoteImage';
import { radius, spacing, useAppTheme } from '@/theme';

type MediaImageCarouselProps = {
  urls: string[];
  emptyIcon?: ComponentProps<typeof MaterialCommunityIcons>['name'];
  height?: number;
  /** Use full window width with square corners (listing detail hero). */
  fullWidth?: boolean;
};

/**
 * Shared paged image carousel used by Marketplace and Assistance.
 * Tap opens a fullscreen viewer with pinch / double-tap zoom and swipe.
 */
export function MediaImageCarousel({
  urls,
  emptyIcon = 'image-off-outline',
  height = 220,
  fullWidth = false,
}: MediaImageCarouselProps) {
  const theme = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const carouselWidth = fullWidth ? windowWidth : windowWidth - spacing.md * 2;
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / carouselWidth);
      setActiveIndex(index);
    },
    [carouselWidth],
  );

  const listStyle = useMemo(
    () => ({ width: carouselWidth, height }),
    [carouselWidth, height],
  );

  if (urls.length === 0) {
    return (
      <View
        style={[
          styles.placeholder,
          { height, backgroundColor: theme.colors.surfaceVariant },
          fullWidth ? styles.placeholderFlush : null,
        ]}
      >
        <MaterialCommunityIcons
          name={emptyIcon}
          size={64}
          color={theme.colors.onSurfaceVariant}
        />
      </View>
    );
  }

  return (
    <>
      <View style={listStyle}>
        <FlatList
          data={urls}
          keyExtractor={(item, index) => `${item}-${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          style={listStyle}
          getItemLayout={(_, index) => ({
            length: carouselWidth,
            offset: carouselWidth * index,
            index,
          })}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => setFullscreenIndex(index)}
              style={{ width: carouselWidth, height }}
              accessibilityRole="imagebutton"
              accessibilityLabel={`Photo ${index + 1}`}
            >
              <RemoteImage
                uri={item}
                displayWidth={Math.round(carouselWidth * 2)}
                style={styles.image}
                containerStyle={[
                  styles.imageWrap,
                  { width: carouselWidth, height },
                  fullWidth ? styles.imageWrapFlush : null,
                ]}
                resizeMode="cover"
              />
            </Pressable>
          )}
        />
      </View>

      {urls.length > 1 ? (
        <Text
          variant="labelSmall"
          style={[styles.counter, { color: theme.colors.onSurfaceVariant }]}
        >
          {activeIndex + 1} / {urls.length}
        </Text>
      ) : null}

      <FullscreenImageViewer
        urls={urls}
        initialIndex={fullscreenIndex ?? 0}
        visible={fullscreenIndex !== null}
        onClose={() => setFullscreenIndex(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    width: '100%',
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderFlush: {
    borderRadius: 0,
  },
  imageWrap: {
    borderRadius: radius.lg,
  },
  imageWrapFlush: {
    borderRadius: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  counter: {
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
