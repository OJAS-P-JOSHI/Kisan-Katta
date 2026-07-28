/**
 * Maps historical / app-constant district names to LGD official names
 * used by Location Master. Keys and values are normalized lowercase.
 */
const DISTRICT_NAME_ALIASES: Record<string, string> = {
  ahmednagar: 'ahilyanagar',
  ahmadnagar: 'ahilyanagar',
  aurangabad: 'chhatrapati sambhajinagar',
  sambhajinagar: 'chhatrapati sambhajinagar',
  osmanabad: 'dharashiv',
  nasik: 'nashik',
  bombay: 'mumbai suburban',
  mumbai: 'mumbai suburban',
  'mumbai city': 'mumbai suburban',
};

export const normalizeLocationName = (name: string): string =>
  name
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

/** True when two location names match, including known district aliases. */
export const locationNamesMatch = (a: string, b: string): boolean => {
  const left = normalizeLocationName(a);
  const right = normalizeLocationName(b);
  if (left === right) return true;

  const leftCanonical = DISTRICT_NAME_ALIASES[left] ?? left;
  const rightCanonical = DISTRICT_NAME_ALIASES[right] ?? right;
  return leftCanonical === rightCanonical;
};
