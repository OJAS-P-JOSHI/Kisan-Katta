import type { ListingStatus } from './marketplace.types';

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

/** Returns true when the authenticated user owns the listing. */
export const isListingOwner = (
  sellerId: string,
  userId: string | null | undefined,
): boolean => !!userId && sellerId === userId;

/** Normalizes a phone number for `tel:` links. */
export const formatPhoneForDial = (phone: string): string => phone.replace(/\s+/g, '');

/** Normalizes a phone number for `https://wa.me/` links (India country code). */
export const formatPhoneForWhatsApp = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return digits;
  return digits;
};

export type StatusBadgeColors = {
  background: string;
  text: string;
};

/** Semantic colors for listing status badges. */
export const getStatusBadgeColors = (
  status: ListingStatus,
  theme: {
    colors: {
      primaryContainer: string;
      onPrimaryContainer: string;
      secondaryContainer: string;
      onSecondaryContainer: string;
      surfaceVariant: string;
      onSurfaceVariant: string;
    };
  },
): StatusBadgeColors => {
  switch (status) {
    case 'ACTIVE':
      return {
        background: theme.colors.primaryContainer,
        text: theme.colors.onPrimaryContainer,
      };
    case 'SOLD':
      return {
        background: theme.colors.secondaryContainer,
        text: theme.colors.onSecondaryContainer,
      };
    case 'ARCHIVED':
    default:
      return {
        background: theme.colors.surfaceVariant,
        text: theme.colors.onSurfaceVariant,
      };
  }
};
