import type { ListingImage, ListingStatus } from './marketplace.types';

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

/** Normalizes API image values (object or legacy URL string). */
export const normalizeListingImage = (value: unknown): ListingImage | null => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return { url: value.trim(), publicId: '' };
  }
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    const url = record.url;
    if (typeof url !== 'string' || url.trim().length === 0) return null;
    const publicId = record.publicId;
    return {
      url: url.trim(),
      publicId: typeof publicId === 'string' ? publicId.trim() : '',
    };
  }
  return null;
};

/** Normalizes an array of listing images from the API. */
export const normalizeListingImages = (images: unknown): ListingImage[] => {
  if (!Array.isArray(images)) return [];
  return images
    .map((item) => normalizeListingImage(item))
    .filter((item): item is ListingImage => item !== null);
};

/** Returns image URLs in listing order. */
export const getListingImageUrls = (images: ListingImage[]): string[] =>
  images.map((image) => image.url).filter((url) => url.length > 0);

/** Returns the primary image URL or undefined. */
export const getListingImageUrl = (images: ListingImage[]): string | undefined =>
  getListingImageUrls(images)[0];

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

/** Formats YYYY-MM-DD for farmer-friendly DD/MM/YYYY display. */
export const formatHarvestDateDisplay = (isoDate: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!match) return isoDate;
  return `${match[3]}/${match[2]}/${match[1]}`;
};

/** Converts a Date to YYYY-MM-DD for the backend API. */
export const formatHarvestDateApi = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Parses YYYY-MM-DD into a Date at local midnight. */
export const parseHarvestDateApi = (isoDate: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
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
