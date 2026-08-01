/** Simple Marathi copy for Subscription & Billing (farmer-facing). */

export const billingStrings = {
  screenTitle: 'सदस्यत्व',
  detailTitle: 'पेमेंट तपशील',
  profileEntry: 'सदस्यत्व',

  statusActive: 'सक्रिय',
  statusExpired: 'कालबाह्य',
  statusCancelled: 'बंद',
  statusPending: 'प्रलंबित',
  statusHalted: 'पेमेंट अडचण',
  statusPaused: 'थांबलेले',
  statusProcessing: 'प्रक्रिया सुरू',
  statusInactive: 'निष्क्रिय',
  statusUntilPeriodEnd: 'कालावधी संपेपर्यंत चालू',

  heroTitle: 'माझे सदस्यत्व',
  amountPerMonth: (rupees: number) => `₹${toDevanagariNumber(rupees)} / महिना`,
  nextPayment: 'पुढील पैसे',
  periodLabel: 'सध्याचा कालावधी',
  renewNow: 'पुन्हा सुरू करा',
  subscriptionExpired: 'सदस्यत्व संपले',

  paymentMethod: 'पेमेंट पद्धत',
  methodUnknown: 'अद्याप उपलब्ध नाही',

  historySection: 'पेमेंट इतिहास',
  historyEmpty: 'अजून पेमेंट नाही. पुढील चार्ज येथे दिसेल.',
  paid: 'भरले',
  failed: 'अयशस्वी',
  pending: 'प्रलंबित',
  refunded: 'परतावा',

  autoRenewOn: 'दर महिना आपोआप नूतनीकरण',
  autoRenewOff: 'आपोआप नूतनीकरण बंद',
  cancel: 'सदस्यत्व बंद करा',
  cancelTitle: 'सदस्यत्व बंद करायचे?',
  cancelBody:
    'सध्याचा कालावधी संपेपर्यंत अॅप चालू राहील. पुढील पेमेंट आकारले जाणार नाही.',
  cancelConfirm: 'होय, बंद करा',
  cancelKeep: 'नाही, ठेवा',
  cancelSuccess: 'सदस्यत्व बंद केले. कालावधी संपेपर्यंत अॅप वापरता येईल.',
  cancelling: 'बंद करत आहोत…',

  refundSection: 'परतावा नियम',
  refundItems: [
    { icon: 'clock-outline' as const, text: 'मान्य मुदतीत पूर्ण परतावा मिळू शकतो.' },
    { icon: 'calendar-check' as const, text: 'त्यानंतर कालावधी संपेपर्यंत सदस्यत्व चालू राहते.' },
    { icon: 'cancel' as const, text: 'बंद केल्यानंतर पुढील पेमेंट थांबते.' },
    { icon: 'phone' as const, text: 'पेमेंट तक्रारीसाठी मदत घ्या.' },
  ],

  supportSection: 'मदत',
  billingFaq: 'सामान्य प्रश्न',
  contactSupport: 'सपोर्टशी बोला',
  comingSoon: 'लवकरच येत आहे',

  loadError: 'माहिती आली नाही. पुन्हा प्रयत्न करा.',
  cancelError: 'सदस्यत्व बंद करता आले नाही.',
  retry: 'पुन्हा प्रयत्न',
  noSubscription: 'तुमचे सदस्यत्व सापडले नाही.',

  amount: 'रक्कम',
  status: 'स्थिती',
  paymentId: 'पेमेंट आयडी',
  subscriptionId: 'सदस्यत्व आयडी',
  invoiceId: 'इनव्हॉइस आयडी',
  paymentDate: 'तारीख',
  gateway: 'पेमेंट गेटवे',
  billingPeriod: 'कालावधी',
  copy: 'कॉपी',
  copied: 'कॉपी झाले',
  receipt: 'पावती',
  receiptPlaceholder: 'पावती लवकरच उपलब्ध होईल.',
} as const;

const DEVANAGARI_DIGITS = '०१२३४५६७८९';

export function toDevanagariNumber(value: number | string): string {
  return String(value).replace(/\d/g, (d) => DEVANAGARI_DIGITS[Number(d)] ?? d);
}
