import {
  DESCRIPTION_MAX_LENGTH,
  DESCRIPTION_MIN_LENGTH,
  MAX_PROOF_PHOTOS,
  TITLE_MAX_LENGTH,
} from './assistance.constants';

/**
 * Farmer-facing Marathi copy — short, spoken Maharashtra Marathi.
 * Avoid formal / portal-style wording.
 */
export const assistanceStrings = {
  feed: {
    title: 'साथ',
    subtitle: 'शेतकरी ते शेतकरी, एकमेकांच्या साथीने अधिक सक्षम!',
    searchPlaceholder: 'गाव, जिल्हा किंवा अडचण शोधा…',
    searchA11y: 'गाव, जिल्हा किंवा अडचण शोधा',
    searchClearA11y: 'शोध साफ करा',
    createRequest: 'मदत मागा',
    myRequests: 'माझ्या विनंत्या',
    sortNewest: 'नवीन',
    sortMostSupported: 'जास्त साथ',
    loading: 'लोड होत आहे…',
    loadMore: 'आणखी दाखवत आहे…',
    errorTitle: 'काहीतरी चुकले',
    retry: 'पुन्हा पहा',
    emptyTitle: 'आत्ता कोणी मदत मागितलेली नाही',
    emptyMessage: 'नवीन विनंती आली की इथे दिसेल.\nथोड्या वेळाने पुन्हा पहा.',
    searchEmptyMessage: 'या शोधात काही सापडले नाही.',
    infoA11y: 'ही सुविधा काय आहे',
  },
  infoSheet: {
    title: 'ही सुविधा काय आहे?',
    body: 'इथे पैसे गोळा होत नाहीत.\nशेतकऱ्याला मार्गदर्शन, माहिती आणि गावाची साथ मिळावी हा उद्देश आहे.',
    points: [
      'पैसे, UPI किंवा देणगी नाही',
      'फक्त साथ आणि मदत',
      'पाठवल्यावर इतर शेतकऱ्यांना दिसेल',
    ],
    close: 'समजले',
  },
  status: {
    PENDING_REVIEW: 'तपासणीत',
    OPEN: 'सुरू',
    RESOLVED: 'मिटले',
    REJECTED: 'नाकारले',
    ARCHIVED: 'काढून ठेवले',
  },
  statusHelp: {
    PENDING_REVIEW: 'तुमची विनंती तपासणीत आहे.',
    OPEN: 'विनंती सर्वांना दिसत आहे.',
    RESOLVED: 'ही अडचण मिटली आहे.',
    REJECTED: 'ही विनंती स्वीकारता आली नाही.',
    ARCHIVED: 'ही विनंती काढून ठेवली आहे.',
  },
  card: {
    verified: 'खात्री केलेले',
    support: 'साथ द्या',
    supported: 'साथ दिली',
    share: 'शेअर',
    report: 'तक्रार',
    supportCount: (count: number) => `${count} जणांची साथ`,
    supportCountEmpty: 'पहिली साथ तुमची असेल',
    readMore: 'अजून वाचा',
    myRequestBadge: 'माझी',
  },
  detail: {
    title: 'मदत विनंती',
    loading: 'लोड होत आहे…',
    errorTitle: 'दाखवता आले नाही',
    farmerInfo: 'शेतकरी',
    name: 'नाव',
    village: 'गाव',
    taluka: 'तालुका',
    district: 'जिल्हा',
    state: 'राज्य',
    postedOn: 'कधी टाकले',
    status: 'स्थिती',
    description: 'काय झाले',
    proofPhotos: 'फोटो',
    ownerActions: 'तुमचे पर्याय',
    edit: 'बदला',
    markResolved: 'अडचण मिटली',
    delete: 'काढून टाका',
  },
  create: {
    title: 'मदत मागा',
    editTitle: 'विनंती बदला',
    intro: 'नाव, गाव आणि फोटो प्रोफाइलमधून येतील. फक्त अडचण लिहा.',
    titleLabel: 'थोडक्यात काय झाले',
    titlePlaceholder: 'उदा. पावसाने पीक खराब झाले',
    titleHelper: (length: number) => `${length}/${TITLE_MAX_LENGTH}`,
    descriptionLabel: 'थोडे सविस्तर सांगा',
    descriptionPlaceholder: 'काय झाले, सध्या काय स्थिती आहे, कशी मदत हवी ते लिहा…',
    descriptionHelper: (length: number) =>
      `${length}/${DESCRIPTION_MAX_LENGTH} (किमान ${DESCRIPTION_MIN_LENGTH})`,
    photosLabel: 'पुरावा फोटो',
    photosHelper: `१ ते ${MAX_PROOF_PHOTOS} फोटो जोडा`,
    authorPreviewTitle: 'ही माहिती आपोआप येईल',
    authorLoading: 'प्रोफाइल वाचत आहे…',
    publish: 'पाठवा',
    publishing: 'पाठवत आहे…',
    update: 'सेव्ह करा',
    updating: 'सेव्ह होत आहे…',
    moderationNotice: 'पाठवल्यावर सर्व शेतकऱ्यांना दिसेल.',
    limitReachedTitle: 'दोन विनंत्या सुरू आहेत',
    limitReachedMessage: 'आधीची एक अडचण मिटवा. मग नवीन मागता येईल.',
    viewMyRequests: 'माझ्या विनंत्या पहा',
  },
  myRequests: {
    title: 'माझ्या विनंत्या',
    loading: 'लोड होत आहे…',
    emptyTitle: 'अजून कोणती विनंती नाही',
    emptyMessage: 'अडचण असेल तर इथे मदत मागा.',
    createFirst: 'मदत मागा',
    filterAll: 'सर्व',
    activeCount: (active: number, max: number) => `${active}/${max} सुरू`,
    summaryTitle: 'माझी साथ',
    summaryPending: 'तपासणीत',
    summaryOpen: 'सुरू',
    summaryResolved: 'मिटले',
  },
  support: {
    thanksTitle: 'साथ नोंदली',
    thanksMessage: 'तुमच्या साथीने या शेतकऱ्याला बळ मिळेल.',
    alreadySupported: 'तुम्ही आधीच साथ दिली आहे.',
    ownRequest: 'स्वतःच्या विनंतीला साथ देता येत नाही.',
    notOpen: 'फक्त सुरू असलेल्यांना साथ देता येते.',
    failed: 'साथ जमत नाही. पुन्हा प्रयत्न करा.',
    notMoney: 'साथ म्हणजे पैसे देणे नाही.',
  },
  report: {
    title: 'तक्रार करा',
    subtitle: 'चुकीची किंवा अयोग्य विनंती असेल तर कारण सांगा.',
    reasonRequired: 'कारण निवडा',
    detailsLabel: 'थोडक्यात सांगा',
    detailsPlaceholder: 'काय चुकीचे आहे…',
    detailsRequired: 'इतर कारणासाठी थोडे लिहा',
    submit: 'तक्रार पाठवा',
    submitting: 'पाठवत आहे…',
    cancel: 'रद्द',
    success: 'तक्रार पोहोचली.',
    alreadyReported: 'तुम्ही आधीच तक्रार केली आहे.',
    ownRequest: 'स्वतःच्या विनंतीवर तक्रार करता येत नाही.',
    failed: 'तक्रार जमत नाही. पुन्हा प्रयत्न करा.',
  },
  reportReasons: {
    SPAM: 'फालतू / स्पॅम',
    FAKE_INFORMATION: 'खोटी माहिती',
    INAPPROPRIATE_IMAGES: 'अयोग्य फोटो',
    OTHER: 'इतर',
  },
  share: {
    dialogTitle: 'शेअर करा',
    message: (title: string, name: string, place: string, link: string) =>
      `${name} (${place}) यांना मदत हवी आहे.\n\n${title}\n\nकिसन अ‍ॅग्रीसाथी वर पहा: ${link}`,
    failed: 'शेअर जमत नाही.',
  },
  lifecycle: {
    resolveTitle: 'अडचण मिटली का?',
    resolveMessage: 'मिटली म्हणजे नवीन साथ बंद होईल. तुमची जागा मोकळी होईल.',
    resolveConfirm: 'होय, मिटली',
    resolved: 'अडचण मिटली म्हणून सेव्ह केली.',
    resolveFailed: 'सेव्ह जमत नाही.',
    deleteTitle: 'विनंती काढायची?',
    deleteMessage: 'काढली की इतरांना दिसणार नाही. परत आणता येणार नाही.',
    deleteConfirm: 'होय, काढा',
    deleted: 'विनंती काढली.',
    deleteFailed: 'काढता आली नाही.',
    cancel: 'रद्द',
  },
  time: {
    justNow: 'आत्ताच',
    minutesAgo: (minutes: number) => `${minutes} मिनिटांपूर्वी`,
    hoursAgo: (hours: number) => `${hours} तासांपूर्वी`,
    daysAgo: (days: number) => `${days} दिवसांपूर्वी`,
  },
  images: {
    addPhoto: 'फोटो जोडा',
    takePhoto: 'कॅमेरा',
    chooseGallery: 'गॅलरी',
    pickerTitle: 'फोटो कुठून घ्यायचा?',
    maxReached: `जास्तीत जास्त ${MAX_PROOF_PHOTOS} फोटो.`,
    maxSelected: `फक्त ${MAX_PROOF_PHOTOS} फोटो निवडा.`,
    minRequired: 'किमान एक फोटो हवा.',
    tooLarge: 'फोटो खूप मोठा आहे (५ MB पेक्षा). दुसरा निवडा.',
    tooSmall: 'फोटो खूप लहान आहे. स्पष्ट फोटो निवडा.',
    unsupportedType: 'फक्त JPEG, PNG किंवा WEBP चालेल.',
    uploading: 'फोटो जात आहेत…',
    uploadProgress: (current: number, total: number) => `${current}/${total} झाले`,
    uploadFailed: 'फोटो गेला नाही.',
    uploadFailedHint: 'पुन्हा प्रयत्न करा.',
    deleteFailed: 'फोटो काढता आला नाही.',
    retry: 'पुन्हा प्रयत्न',
    offline: 'नेट नाही.\nपुन्हा प्रयत्न करा.',
    cameraPermission: 'कॅमेरा परवानगी द्या.',
    galleryPermission: 'गॅलरी परवानगी द्या.',
    openSettings: 'सेटिंग्ज उघडा',
    morePhotosOverlay: (count: number) => `+${count}`,
  },
  validation: {
    titleRequired: 'शीर्षक लिहा',
    titleTooLong: `शीर्षक ${TITLE_MAX_LENGTH} अक्षरांपेक्षा मोठे नको`,
    descriptionRequired: 'थोडे सविस्तर लिहा',
    descriptionTooShort: `किमान ${DESCRIPTION_MIN_LENGTH} अक्षरे लिहा`,
    descriptionTooLong: `${DESCRIPTION_MAX_LENGTH} अक्षरांपेक्षा जास्त नको`,
    photosRequired: 'एक फोटो तरी जोडा',
    profileRequired: 'आधी प्रोफाइल पूर्ण करा.',
  },
  errors: {
    timeout: 'वेळ संपला. पुन्हा प्रयत्न करा.',
    network: 'नेट तपासा आणि पुन्हा प्रयत्न करा.',
    backendUnavailable: 'आत्ता सेवा बंद आहे. थोड्या वेळाने पहा.',
    validation: 'माहिती तपासा आणि पुन्हा पाठवा.',
    notVerified: 'फक्त खात्री केलेले शेतकरी मदत मागू शकतात.',
    rateLimited: 'खूप वेळा प्रयत्न झाले. थोडे थांबा.',
    activeLimit: 'दोन विनंत्या सुरू आहेत. एक मिटवा मग नवीन मागा.',
    cannotEdit: 'ही विनंती आता बदलता येत नाही.',
    generic: 'जमत नाही. पुन्हा प्रयत्न करा.',
  },
} as const;

/** Marathi label for a help request status chip. */
export const getHelpRequestStatusLabel = (status: string): string => {
  const labels = assistanceStrings.status as Record<string, string>;
  return labels[status] ?? status;
};

/** Marathi explanation shown to the author for their request status. */
export const getHelpRequestStatusHelp = (status: string): string => {
  const labels = assistanceStrings.statusHelp as Record<string, string>;
  return labels[status] ?? '';
};

/** Marathi label for a report reason. */
export const getReportReasonLabel = (reason: string): string => {
  const labels = assistanceStrings.reportReasons as Record<string, string>;
  return labels[reason] ?? reason;
};
