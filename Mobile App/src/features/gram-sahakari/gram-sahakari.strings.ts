import type { RepresentativeMatchLevel } from './gram-sahakari.types';

export const gramSahakariStrings = {
  title: 'Gram Sahakari Seva',
  subtitle: 'तुमच्या गावातील प्रतिनिधीकडून मदत मिळवा',
  subtitleEn: 'Get help from your local village representative',
  badgeVillage: 'गाव प्रतिनिधी',
  badgeTaluka: 'तालुका प्रतिनिधी',
  badgeDistrict: 'जिल्हा प्रतिनिधी',
  fallbackTalukaTitle: 'तुमच्या गावात प्रतिनिधी उपलब्ध नाही',
  fallbackTalukaBody: 'जवळचा तालुका प्रतिनिधी:',
  fallbackDistrictTitle: 'तुमच्या गावात किंवा तालुक्यात प्रतिनिधी नाही',
  fallbackDistrictBody: 'जिल्हा प्रतिनिधी:',
  emptyTitle: 'Gram Sahakari अद्याप उपलब्ध नाही',
  emptyBody:
    'तुमच्या जिल्ह्यात प्रतिनिधी नोंदणी झाल्यावर येथे दिसेल.',
  profileIncompleteTitle: 'प्रोफाइल पूर्ण करा',
  profileIncompleteBody:
    'तुमचा स्थानिक Gram Sahakari शोधण्यासाठी जिल्हा, तालुका आणि गाव निवडा.',
  completeProfile: 'प्रोफाइल पूर्ण करा',
  call: 'कॉल',
  whatsapp: 'WhatsApp',
  retry: 'पुन्हा प्रयत्न',
  loadError: 'Gram Sahakari लोड करता आले नाही',
  brand: 'Kissan Agrisathi',
} as const;

export const matchLevelBadge = (level: RepresentativeMatchLevel): string => {
  if (level === 'VILLAGE') return gramSahakariStrings.badgeVillage;
  if (level === 'TALUKA') return gramSahakariStrings.badgeTaluka;
  return gramSahakariStrings.badgeDistrict;
};

export const matchLevelFallback = (
  level: RepresentativeMatchLevel,
): { title: string; body: string } | null => {
  if (level === 'TALUKA') {
    return {
      title: gramSahakariStrings.fallbackTalukaTitle,
      body: gramSahakariStrings.fallbackTalukaBody,
    };
  }
  if (level === 'DISTRICT') {
    return {
      title: gramSahakariStrings.fallbackDistrictTitle,
      body: gramSahakariStrings.fallbackDistrictBody,
    };
  }
  return null;
};
