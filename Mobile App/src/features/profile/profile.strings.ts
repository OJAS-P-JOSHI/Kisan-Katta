/**
 * Marathi copy for the Profile feature (photo picker, permissions, errors).
 * Keep user-facing text here — do not hardcode in screens or hooks.
 */
export const profileStrings = {
  photo: {
    takePhoto: '📷 फोटो काढा',
    chooseGallery: '🖼️ गॅलरीमधून निवडा',
    removePhoto: '🗑️ फोटो काढून टाका',
    cancel: 'रद्द करा',
    pickerTitle: 'प्रोफाइल फोटो',
    uploading: 'अपलोड होत आहे…',
    uploadSuccess: 'प्रोफाइल फोटो अपडेट झाला.',
    uploadFailed: 'प्रोफाइल फोटो अपलोड करण्यात अडचण आली.',
    uploadFailedHint: 'कृपया पुन्हा प्रयत्न करा.',
    deleteFailed: 'फोटो हटवता आला नाही.',
    deleteSuccess: 'प्रोफाइल फोटो काढून टाकला.',
    cameraPermission: 'कॅमेरा परवानगी आवश्यक आहे.',
    galleryPermission: 'गॅलरी परवानगी आवश्यक आहे.',
    openSettings: 'सेटिंग्ज उघडा',
    changePhotoA11y: 'प्रोफाइल फोटो बदला',
  },
  header: {
    favoriteCrops: (count: number) => `${count} आवडती पिके`,
    editProfile: 'प्रोफाइल संपादित करा',
  },
  crops: {
    title: 'आवडती पिके',
    helper: 'जास्तीत जास्त १० पिके निवडा',
    recommendedTitle: '⭐ महाराष्ट्रातील प्रमुख पिके',
    searchPlaceholder: 'सर्व पिके शोधा',
    searchResultsTitle: 'शोध परिणाम',
    emptySearch: 'कोणतेही पीक सापडले नाही.',
    emptySearchHint: 'दुसरे नाव वापरून शोधा.',
    maxReached: 'जास्तीत जास्त १० पिके निवडू शकता.',
    selectedSummary: (count: number) => `${count} पिके निवडली`,
    fieldPlaceholder: 'पिके निवडा',
    chipPrefix: '🌾',
  },
} as const;
