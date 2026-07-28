/**
 * Arrival-date freshness helpers for Market intelligence badges.
 * Parses AGMARKNET `DD/MM/YYYY` / `DD-MM-YYYY` strings.
 */

export type ArrivalFreshness = 'today' | 'yesterday' | 'older';

const startOfDay = (date: Date): Date => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

export const parseArrivalDate = (value: string | undefined): Date | null => {
  if (!value) return null;
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return startOfDay(parsed);
};

export const getArrivalFreshness = (arrivalDate: string): ArrivalFreshness => {
  const parsed = parseArrivalDate(arrivalDate);
  if (!parsed) return 'older';

  const today = startOfDay(new Date());
  const diffDays = Math.round((today.getTime() - parsed.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  return 'older';
};
