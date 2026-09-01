import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { MediaImageCarousel } from '@/components/media/MediaImageCarousel';

import type { ListingImage } from '../marketplace.types';
import { getListingImageUrls } from '../marketplace.utils';

type ListingImageCarouselProps = {
  images: ListingImage[];
  listingType: 'produce' | 'product' | 'labour';
};

/** Marketplace listing photos — shared media carousel + fullscreen viewer. */
export function ListingImageCarousel({ images, listingType }: ListingImageCarouselProps) {
  const { width } = useWindowDimensions();
  const urls = useMemo(() => getListingImageUrls(images), [images]);
  const emptyIcon =
    listingType === 'produce'
      ? 'sprout'
      : listingType === 'labour'
        ? 'account-hard-hat'
        : 'package-variant';
  const height = Math.round(Math.min(Math.max(width * 0.56, 188), 248));

  return (
    <MediaImageCarousel urls={urls} emptyIcon={emptyIcon} height={height} fullWidth />
  );
}
