/** Formats a price in Indian Rupees. */
export const formatPrice = (value: number): string => `\u20B9${value.toLocaleString('en-IN')}`;

/** Formats an ISO date string for display. */
export const formatListingDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/** Returns the primary image URL or undefined. */
export const getListingImageUrl = (images: string[]): string | undefined =>
  images.length > 0 ? images[0] : undefined;

/** Builds a display title for produce listings. */
export const getListingDisplayTitle = (listing: {
  listingType: string;
  title: string;
  crop?: string;
  brand?: string;
}): string => {
  if (listing.listingType === 'produce' && listing.crop) {
    return listing.crop;
  }
  return listing.title;
};
