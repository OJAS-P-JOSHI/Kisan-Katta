import { useMemo } from 'react';

import { MediaImageCarousel } from '@/components/media/MediaImageCarousel';

import type { HelpRequestImage } from '../assistance.types';
import { getProofPhotoUrls } from '../assistance.utils';

type ProofPhotoCarouselProps = {
  images: HelpRequestImage[];
};

/** Assistance proof photos — shared media carousel + fullscreen viewer. */
export function ProofPhotoCarousel({ images }: ProofPhotoCarouselProps) {
  const urls = useMemo(() => getProofPhotoUrls(images), [images]);
  return (
    <MediaImageCarousel urls={urls} emptyIcon="image-off-outline" height={220} />
  );
}
