/** Dialer + WhatsApp helpers for representative contact actions. */

const digitsOnly = (phone: string): string => phone.replace(/\D/g, '');

/** Normalize to Indian mobile for wa.me / tel links. */
export const toIndianMobileDigits = (phone: string): string | null => {
  const digits = digitsOnly(phone);
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  if (digits.length >= 10) return digits;
  return null;
};

export const toTelUrl = (phone: string): string | null => {
  const mobile = toIndianMobileDigits(phone);
  if (!mobile) return null;
  return `tel:+${mobile}`;
};

export const toWhatsAppUrl = (phone: string): string | null => {
  const mobile = toIndianMobileDigits(phone);
  if (!mobile) return null;
  return `https://wa.me/${mobile}`;
};

export const formatLocationLine = (
  village: string,
  taluka: string,
  district: string,
): string => {
  const parts = [village, taluka, district].map((p) => p.trim()).filter(Boolean);
  return parts.join(' • ');
};
