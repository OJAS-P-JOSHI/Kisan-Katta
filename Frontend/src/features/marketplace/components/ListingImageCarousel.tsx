import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { IconButton, Text } from 'react-native-paper';

import { radius, spacing, useAppTheme } from '@/theme';

import { marketplaceStrings } from '../marketplace.strings';
import type { ListingImage } from '../marketplace.types';
import { getListingImageUrls } from '../marketplace.utils';

type ListingImageCarouselProps = {
  images: ListingImage[];
  listingType: 'produce' | 'product';
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const CAROUSEL_WIDTH = SCREEN_WIDTH - spacing.md * 2;

export function ListingImageCarousel({ images, listingType }: ListingImageCarouselProps) {
  const theme = useAppTheme();
  const urls = useMemo(() => getListingImageUrls(images), [images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  const placeholderIcon = listingType === 'produce' ? 'sprout' : 'package-variant';

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / CAROUSEL_WIDTH);
    setActiveIndex(index);
  }, []);

  if (urls.length === 0) {
    return (
      <View style={[styles.placeholder, { backgroundColor: theme.colors.surfaceVariant }]}>
        <MaterialCommunityIcons name={placeholderIcon} size={64} color={theme.colors.onSurfaceVariant} />
      </View>
    );
  }

  return (
    <>
      <View>
        <FlatList
          data={urls}
          keyExtractor={(item, index) => `${item}-${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          renderItem={({ item, index }) => (
            <Pressable onPress={() => setFullscreenIndex(index)}>
              <Image source={{ uri: item }} style={styles.carouselImage} resizeMode="cover" />
            </Pressable>
          )}
        />
        {urls.length > 1 ? (
          <Text variant="labelSmall" style={[styles.counter, { color: theme.colors.onSurfaceVariant }]}>
            {activeIndex + 1} / {urls.length}
          </Text>
        ) : null}
      </View>

      <Modal visible={fullscreenIndex !== null} transparent animationType="fade" onRequestClose={() => setFullscreenIndex(null)}>
        <View style={[styles.fullscreen, { backgroundColor: theme.colors.background }]}>
          <IconButton
            icon="close"
            size={24}
            onPress={() => setFullscreenIndex(null)}
            style={styles.closeButton}
            iconColor={theme.colors.onSurface}
          />
          {fullscreenIndex !== null ? (
            <Image
              source={{ uri: urls[fullscreenIndex] }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    width: '100%',
    height: 220,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselImage: {
    width: CAROUSEL_WIDTH,
    height: 220,
    borderRadius: radius.lg,
  },
  counter: {
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  fullscreen: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.md,
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
});
