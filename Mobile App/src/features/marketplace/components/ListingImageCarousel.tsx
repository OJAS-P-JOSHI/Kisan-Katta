import { useMemo } from 'react';

import { MediaImageCarousel } from '@/components/media/MediaImageCarousel';

import type { ListingImage } from '../marketplace.types';
import { getListingImageUrls } from '../marketplace.utils';

type ListingImageCarouselProps = {
  images: ListingImage[];
  listingType: 'produce' | 'product' | 'labour';
};

/** Marketplace listing photos — shared media carousel + fullscreen viewer. */
export function ListingImageCarousel({ images, listingType }: ListingImageCarouselProps) {
  const urls = useMemo(() => getListingImageUrls(images), [images]);
  const emptyIcon =
    listingType === 'produce'
      ? 'sprout'
      : listingType === 'labour'
        ? 'account-hard-hat'
        : 'package-variant';

  return <MediaImageCarousel urls={urls} emptyIcon={emptyIcon} height={220} />;
}
