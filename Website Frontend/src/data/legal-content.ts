/**
 * Privacy / Terms / Refund page copy.
 * Brand name "Kissan Agrisathi" stays English in both locales.
 * Marathi is deliberately simple so older farmers can understand it.
 */

import type { Locale } from '@/i18n/types'

export const LEGAL_POLICY_VERSION = '1.0'
export const LEGAL_LAST_UPDATED_EN = '19 July 2026'
export const LEGAL_LAST_UPDATED_MR = '१९ जुलै २०२६'
export const LEGAL_COMPANY_NAME = 'Kissan Agrisathi Agritech Platform'

export type LegalBlock =
  | { type: 'p'; text: string }
  | { type: 'pStrong'; before: string; strong: string; after: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'contact' }

export type LegalSection = {
  title: string
  blocks: LegalBlock[]
}

export type LegalDoc = {
  title: string
  subtitle: string
  seoDescription: string
  sections: LegalSection[]
}

export type LegalShell = {
  versionLabel: string
  lastUpdatedLabel: string
  lastUpdatedValue: string
}

export function getLegalShell(locale: Locale): LegalShell {
  if (locale === 'mr') {
    return {
      versionLabel: `आवृत्ती ${LEGAL_POLICY_VERSION}`,
      lastUpdatedLabel: 'शेवटचे अद्यतन',
      lastUpdatedValue: LEGAL_LAST_UPDATED_MR,
    }
  }
  return {
    versionLabel: `Version ${LEGAL_POLICY_VERSION}`,
    lastUpdatedLabel: 'Last Updated',
    lastUpdatedValue: LEGAL_LAST_UPDATED_EN,
  }
}

const privacyEn: LegalDoc = {
  title: 'Privacy Policy',
  subtitle:
    'How Kissan Agrisathi collects, uses, stores, and protects your information.',
  seoDescription:
    'Read the Kissan Agrisathi Privacy Policy: what data we collect, how we use it, how it is stored and secured, and your rights.',
  sections: [
    {
      title: '1. Introduction',
      blocks: [
        {
          type: 'p',
          text: `${LEGAL_COMPANY_NAME} ("Kissan Agrisathi", "we", "us", or "our") is a digital agritech platform serving farmers across Maharashtra. This Privacy Policy explains what personal information we collect through our website, mobile application, and related services (collectively, the "Platform"), how we use it, and the choices you have. By using the Platform, you agree to the practices described in this policy.`,
        },
      ],
    },
    {
      title: '2. Information We Collect',
      blocks: [
        {
          type: 'p',
          text: 'Depending on how you use the Platform, we may collect the following information:',
        },
        {
          type: 'ul',
          items: [
            'Name',
            'Phone number',
            'Email address',
            'Postal / residential address',
            'Aadhaar details (for identity verification)',
            'PAN details (for identity and financial verification)',
            'Bank account details (for payouts and verification)',
            'Documents you upload (identity proofs, land or address proofs, and similar files)',
            'Device information (device model, operating system, app version, and identifiers)',
            'Payment information (processed securely through our payment partner)',
            'Usage analytics (how you interact with the Platform)',
          ],
        },
      ],
    },
    {
      title: '3. How We Use Your Information',
      blocks: [
        {
          type: 'p',
          text: 'We use the information we collect for the following purposes:',
        },
        {
          type: 'ul',
          items: [
            'Registration and account creation',
            'Identity verification',
            'Village Representative onboarding and application review',
            'Providing customer support',
            'Fraud detection and prevention',
            'Meeting legal and regulatory compliance obligations',
          ],
        },
      ],
    },
    {
      title: '4. Data Storage and Processing',
      blocks: [
        {
          type: 'p',
          text: 'Your data is stored in secured databases hosted on MongoDB. Documents and images that you upload are stored and delivered through Cloudinary, our media storage and processing provider. We apply access controls and encryption in transit (HTTPS/TLS) to protect data as it moves between your device and our servers, and we restrict access to personal information to authorized personnel and processes only.',
        },
      ],
    },
    {
      title: '5. Third-Party Services',
      blocks: [
        {
          type: 'p',
          text: 'We rely on trusted third-party service providers to operate the Platform. These include:',
        },
        {
          type: 'ul',
          items: [
            'Cloudinary — secure storage and delivery of uploaded documents and images',
            'MongoDB — storage of application and account data',
            'Razorpay — processing of payments and, where enabled, subscriptions',
            'OTP / SMS providers — one-time-password (OTP) based authentication',
          ],
        },
        {
          type: 'p',
          text: 'These providers process your information only as needed to perform their services and are expected to maintain appropriate safeguards. Government market price information, weather data, and similar external information may be sourced from third-party or government providers, whose availability and accuracy may vary.',
        },
      ],
    },
    {
      title: '6. Payment Information',
      blocks: [
        {
          type: 'p',
          text: 'Payments on the Platform are handled by Razorpay. Sensitive payment details such as card or banking credentials are processed directly by the payment provider under their security standards. We do not store full card details on our own servers.',
        },
      ],
    },
    {
      title: '7. Authentication',
      blocks: [
        {
          type: 'p',
          text: 'We use OTP-based (one-time-password) authentication to verify your phone number and secure access to your account. You are responsible for keeping your device and OTPs confidential.',
        },
      ],
    },
    {
      title: '8. Cookies and Similar Technologies',
      blocks: [
        {
          type: 'p',
          text: 'The Platform may use cookies and similar technologies (such as local storage) to remember your preferences (for example, your selected language), keep you signed in, and understand how the Platform is used so we can improve it. You can control or disable cookies through your browser settings, although some features may not function correctly without them.',
        },
      ],
    },
    {
      title: '9. Data Retention',
      blocks: [
        {
          type: 'p',
          text: 'We retain personal information for as long as your account is active or as needed to provide our services, comply with our legal obligations, resolve disputes, prevent fraud, and enforce our agreements. When information is no longer required, we take reasonable steps to delete or anonymize it.',
        },
      ],
    },
    {
      title: '10. Security Measures',
      blocks: [
        {
          type: 'p',
          text: 'We implement reasonable technical and organizational measures to protect your information, including encryption in transit, restricted access controls, secure third-party processors, and monitoring for unauthorized activity. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.',
        },
      ],
    },
    {
      title: '11. Your Rights',
      blocks: [
        {
          type: 'p',
          text: 'You may request correction of inaccurate or incomplete personal information that we hold about you. You may also contact our support team with questions about how your data is handled or to make a privacy-related request. We will respond to reasonable requests in accordance with applicable law.',
        },
      ],
    },
    {
      title: '12. Contact Us',
      blocks: [
        {
          type: 'p',
          text: 'If you have any questions about this Privacy Policy, you can reach us at:',
        },
        { type: 'contact' },
      ],
    },
  ],
}

const privacyMr: LegalDoc = {
  title: 'गोपनीयता धोरण',
  subtitle:
    'Kissan Agrisathi तुमची माहिती कशी गोळा करते, कशी वापरते आणि कशी सुरक्षित ठेवते.',
  seoDescription:
    'Kissan Agrisathi गोपनीयता धोरण: आम्ही कोणती माहिती घेतो, कशासाठी वापरतो आणि तुमचे हक्क काय आहेत.',
  sections: [
    {
      title: '१. सुरुवात',
      blocks: [
        {
          type: 'p',
          text: `${LEGAL_COMPANY_NAME} ("Kissan Agrisathi", "आम्ही" किंवा "आमचे") हे महाराष्ट्रातील शेतकऱ्यांसाठी डिजिटल अॅग्रीटेक व्यासपीठ आहे. या धोरणात आम्ही सांगतो — आमची वेबसाइट, मोबाइल अॅप आणि इतर सेवा (एकत्र "प्लॅटफॉर्म") वापरताना आम्ही तुमची कोणती माहिती घेतो, ती कशासाठी वापरतो आणि तुमचे हक्क काय आहेत. प्लॅटफॉर्म वापरल्यास तुम्ही या धोरणाशी सहमत आहात.`,
        },
      ],
    },
    {
      title: '२. आम्ही कोणती माहिती गोळा करतो',
      blocks: [
        {
          type: 'p',
          text: 'तुम्ही प्लॅटफॉर्म कसा वापरता यावरून आम्ही खालील माहिती घेऊ शकतो:',
        },
        {
          type: 'ul',
          items: [
            'नाव',
            'मोबाइल नंबर',
            'ईमेल पत्ता',
            'घरचा / पोस्टाचा पत्ता',
            'आधार तपशील (ओळख तपासण्यासाठी)',
            'पॅन तपशील (ओळख आणि बँक तपासणीसाठी)',
            'बँक खात्याची माहिती (पैसे देणे / तपासणीसाठी)',
            'तुम्ही अपलोड केलेले कागदपत्र (ओळखपत्र, जमीन / पत्ता पुरावे इ.)',
            'फोन / डिव्हाइसची माहिती (मॉडेल, सिस्टम, अॅप आवृत्ती)',
            'पेमेंट माहिती (आमच्या पेमेंट पार्टनरकडे सुरक्षितरित्या)',
            'वापर कसा चालतो याची साधी आकडेवारी (अॅप सुधारण्यासाठी)',
          ],
        },
      ],
    },
    {
      title: '३. माहिती कशासाठी वापरतो',
      blocks: [
        {
          type: 'p',
          text: 'आम्ही ही माहिती खालील कामांसाठी वापरतो:',
        },
        {
          type: 'ul',
          items: [
            'नोंदणी आणि खाते तयार करणे',
            'ओळख तपासणे',
            'गाव प्रतिनिधी अर्ज तपासणे आणि मंजुरी प्रक्रिया',
            'ग्राहक मदत / सपोर्ट',
            'फसवणूक रोखणे',
            'कायद्याचे नियम पाळणे',
          ],
        },
      ],
    },
    {
      title: '४. माहिती कुठे ठेवतो',
      blocks: [
        {
          type: 'p',
          text: 'तुमची माहिती सुरक्षित डेटाबेसमध्ये (MongoDB) ठेवली जाते. फोटो आणि कागदपत्र Cloudinary वर सुरक्षित ठेवली जातात. फोन ते आमचे सर्व्हर या दरम्यान माहिती HTTPS/TLS ने सुरक्षित पाठवली जाते. फक्त अधिकृत लोकांनाच ही माहिती दिसू शकते.',
        },
      ],
    },
    {
      title: '५. इतर कंपन्यांची मदत',
      blocks: [
        {
          type: 'p',
          text: 'प्लॅटफॉर्म चालवण्यासाठी आम्ही विश्वासू कंपन्या वापरतो. त्यात:',
        },
        {
          type: 'ul',
          items: [
            'Cloudinary — कागदपत्र आणि फोटो सुरक्षित ठेवणे',
            'MongoDB — खाते आणि अर्जाची माहिती ठेवणे',
            'Razorpay — पेमेंट (आणि भविष्यात सबस्क्रिप्शन)',
            'OTP / SMS सेवा — मोबाइलवर पासवर्ड (OTP) पाठवणे',
          ],
        },
        {
          type: 'p',
          text: 'या कंपन्या फक्त आवश्यक कामासाठीच माहिती वापरतात आणि सुरक्षित ठेवतात. बाजारभाव, हवामान आणि इतर माहिती सरकारी किंवा इतर स्रोतांकडून येऊ शकते. ती नेहमी १००% अचूक असेलच असे आम्ही सांगू शकत नाही.',
        },
      ],
    },
    {
      title: '६. पेमेंट माहिती',
      blocks: [
        {
          type: 'p',
          text: 'पेमेंट Razorpay कडे जाते. कार्ड किंवा बँकेची संवेदनशील माहिती त्यांच्याकडे सुरक्षितरित्या हाताळली जाते. आम्ही आमच्या सर्व्हरवर पूर्ण कार्ड नंबर ठेवत नाही.',
        },
      ],
    },
    {
      title: '७. लॉगिन / ओळख तपासणी',
      blocks: [
        {
          type: 'p',
          text: 'आम्ही मोबाइलवर OTP पाठवून तुमचा नंबर तपासतो आणि खाते सुरक्षित ठेवतो. तुमचा फोन आणि OTP इतरांना दाखवू नका.',
        },
      ],
    },
    {
      title: '८. कुकीज आणि भाषा सेटिंग',
      blocks: [
        {
          type: 'p',
          text: 'प्लॅटफॉर्म कुकीज किंवा लोकल स्टोरेज वापरून तुमची भाषा, लॉगिन आणि वापर समजू शकतो. ब्राउझर सेटिंगमधून कुकीज बंद करता येतात; पण काही सुविधा नीट चालणार नाहीत.',
        },
      ],
    },
    {
      title: '९. माहिती किती दिवस ठेवतो',
      blocks: [
        {
          type: 'p',
          text: 'तुमचे खाते चालू असेल किंवा सेवा देण्यासाठी / कायद्यासाठी गरज असेल तोपर्यंत माहिती ठेवतो. गरज संपल्यावर आम्ही ती काढून टाकतो किंवा ओळख पटणार नाही अशी करतो.',
        },
      ],
    },
    {
      title: '१०. सुरक्षा',
      blocks: [
        {
          type: 'p',
          text: 'आम्ही शक्य तितकी काळजी घेतो — सुरक्षित कनेक्शन, मर्यादित प्रवेश, विश्वासू पार्टनर. तरीही इंटरनेटवर १००% सुरक्षितता कोणीही हमी देऊ शकत नाही.',
        },
      ],
    },
    {
      title: '११. तुमचे हक्क',
      blocks: [
        {
          type: 'p',
          text: 'तुमची माहिती चुकीची असेल तर दुरुस्त करायला सांगू शकता. गोपनीयतेबद्दल प्रश्न असल्यास आमच्या सपोर्टशी संपर्क साधा. कायद्यानुसार आम्ही योग्य उत्तर देऊ.',
        },
      ],
    },
    {
      title: '१२. संपर्क',
      blocks: [
        {
          type: 'p',
          text: 'या गोपनीयता धोरणाबद्दल प्रश्न असल्यास आमच्याशी संपर्क साधा:',
        },
        { type: 'contact' },
      ],
    },
  ],
}

const termsEn: LegalDoc = {
  title: 'Terms & Conditions',
  subtitle: 'The terms that govern your use of the Kissan Agrisathi platform.',
  seoDescription:
    'Read the Kissan Agrisathi Terms & Conditions covering platform use, Village Representative applications, payments, user responsibilities, liability, and governing law.',
  sections: [
    {
      title: '1. About the Platform',
      blocks: [
        {
          type: 'p',
          text: `${LEGAL_COMPANY_NAME} ("Kissan Agrisathi") is a digital agritech platform that provides farmers in Maharashtra with tools such as weather information, government market (mandi) prices, community insights, a local marketplace, and the Village Representative program. By accessing or using the Platform, you agree to be bound by these Terms & Conditions.`,
        },
      ],
    },
    {
      title: '2. Village Representative Applications',
      blocks: [
        {
          type: 'pStrong',
          before:
            'Applications to become a Village Representative are subject to review. Submitting an application does ',
          strong: 'not',
          after:
            ' guarantee approval. Approval is granted solely at the discretion of Kissan Agrisathi, based on our verification and eligibility criteria.',
        },
      ],
    },
    {
      title: '3. Accuracy of Information',
      blocks: [
        {
          type: 'p',
          text: 'Users must provide accurate, current, and complete information when registering or applying. Uploading forged, tampered, or misleading documents may result in rejection of your application and suspension or termination of your account.',
        },
        {
          type: 'p',
          text: 'You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.',
        },
      ],
    },
    {
      title: '4. Payments',
      blocks: [
        {
          type: 'h3',
          text: 'Village Representative Registration Fee — ₹500',
        },
        {
          type: 'p',
          text: 'A registration fee of ₹500 is charged for processing and verification of a Village Representative application. This fee covers document verification and administrative processing.',
        },
        {
          type: 'pStrong',
          before: 'Payment of this fee does ',
          strong: 'not',
          after:
            ' guarantee approval. The fee is generally non-refundable once the verification process has started, except where required by applicable law or where Kissan Agrisathi cancels the application before processing has begun.',
        },
        {
          type: 'h3',
          text: 'Subscriptions & Premium Features',
        },
        {
          type: 'p',
          text: 'Future premium features may be offered through subscription plans. Subscriptions are not active today. Pricing and renewal information will always be shown before purchase.',
        },
        {
          type: 'p',
          text: 'When and if subscription plans are introduced, the following terms will apply:',
        },
        {
          type: 'ul',
          items: [
            'Any recurring billing will be clearly disclosed before you subscribe.',
            'Users may cancel future renewals at any time through supported methods once subscription management is available.',
            'Cancellation stops future billing but does not automatically refund the current billing period.',
            'Pricing and renewal information will always be presented before purchase.',
          ],
        },
      ],
    },
    {
      title: '5. User Responsibilities',
      blocks: [
        { type: 'p', text: 'By using the Platform, you agree not to:' },
        {
          type: 'ul',
          items: [
            'Submit false, forged, or misleading documents',
            'Attempt fraud of any kind',
            'Abuse, misuse, or exploit the Platform',
            'Interfere with or disrupt the Platform or its services',
            'Reverse engineer, decompile, or attempt to extract the source code of the application',
          ],
        },
      ],
    },
    {
      title: '6. Limitation of Liability',
      blocks: [
        {
          type: 'p',
          text: 'The Platform and its content are provided on an "as is" and "as available" basis, without warranties of any kind, whether express or implied. To the maximum extent permitted by applicable law, Kissan Agrisathi shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of profits, data, or goodwill, arising out of or in connection with your use of, or inability to use, the Platform.',
        },
        {
          type: 'p',
          text: 'Information such as weather data and government market prices is sourced from third-party or government providers where applicable, and its availability and accuracy may vary. We do not guarantee that such information is error-free, and you rely on it at your own discretion. To the extent liability cannot be excluded, our total liability is limited to the amount you paid to us, if any, for the relevant service.',
        },
      ],
    },
    {
      title: '7. Governing Law and Jurisdiction',
      blocks: [
        {
          type: 'p',
          text: 'These Terms & Conditions are governed by and construed in accordance with the laws of India. Any disputes arising out of or relating to these terms or the Platform shall be subject to the exclusive jurisdiction of the courts located in Chhatrapati Sambhajinagar, Maharashtra.',
        },
      ],
    },
    {
      title: '8. Changes to These Terms',
      blocks: [
        {
          type: 'p',
          text: 'We may update these Terms & Conditions from time to time. Continued use of the Platform after changes take effect constitutes acceptance of the revised terms.',
        },
      ],
    },
    {
      title: '9. Contact Us',
      blocks: [
        {
          type: 'p',
          text: 'For questions about these terms, contact us at:',
        },
        { type: 'contact' },
      ],
    },
  ],
}

const termsMr: LegalDoc = {
  title: 'अटी व नियम',
  subtitle: 'Kissan Agrisathi प्लॅटफॉर्म वापरताना लागू होणारे नियम.',
  seoDescription:
    'Kissan Agrisathi अटी व नियम: प्लॅटफॉर्म वापर, गाव प्रतिनिधी अर्ज, पेमेंट, जबाबदारी आणि कायदा.',
  sections: [
    {
      title: '१. प्लॅटफॉर्मबद्दल',
      blocks: [
        {
          type: 'p',
          text: `${LEGAL_COMPANY_NAME} ("Kissan Agrisathi") हे महाराष्ट्रातील शेतकऱ्यांसाठी डिजिटल अॅग्रीटेक व्यासपीठ आहे. येथे हवामान, सरकारी बाजारभाव, गावातील माहिती, स्थानिक बाजारपेठ आणि गाव प्रतिनिधी कार्यक्रम उपलब्ध आहेत. प्लॅटफॉर्म वापरल्यास तुम्ही या अटी व नियमांशी सहमत आहात.`,
        },
      ],
    },
    {
      title: '२. गाव प्रतिनिधी अर्ज',
      blocks: [
        {
          type: 'pStrong',
          before:
            'गाव प्रतिनिधी होण्यासाठी अर्ज केल्यानंतर आम्ही तपासणी करतो. अर्ज केला म्हणून मंजुरी ',
          strong: 'मिळेलच असे नाही',
          after:
            '. मंजुरी फक्त Kissan Agrisathi कडे आहे. आम्ही ओळख आणि पात्रता तपासून निर्णय घेतो.',
        },
      ],
    },
    {
      title: '३. अचूक माहिती द्या',
      blocks: [
        {
          type: 'p',
          text: 'नोंदणी किंवा अर्ज करताना सत्य, अद्ययावत आणि पूर्ण माहिती द्या. खोटी / बनावट कागदपत्रे दिल्यास अर्ज नाकारला जाऊ शकतो आणि खाते बंद होऊ शकते.',
        },
        {
          type: 'p',
          text: 'तुमचे खाते आणि OTP सुरक्षित ठेवण्याची जबाबदारी तुमची आहे. तुमच्या खात्यातून झालेल्या कामाची जबाबदारीही तुमची आहे.',
        },
      ],
    },
    {
      title: '४. पेमेंट',
      blocks: [
        {
          type: 'h3',
          text: 'गाव प्रतिनिधी नोंदणी शुल्क — ₹५००',
        },
        {
          type: 'p',
          text: 'गाव प्रतिनिधी अर्ज तपासणी आणि कागदपत्र पडताळणीसाठी ₹५०० शुल्क आकारले जाते.',
        },
        {
          type: 'pStrong',
          before: 'हे शुल्क भरले म्हणून मंजुरी ',
          strong: 'मिळेलच असे नाही',
          after:
            '. तपासणी सुरू झाल्यानंतर सामान्यतः शुल्क परत मिळत नाही. कायद्याने गरज असेल किंवा आम्ही तपासणी सुरू होण्याआधी अर्ज रद्द केल्यास अपवाद असू शकतो.',
        },
        {
          type: 'h3',
          text: 'सबस्क्रिप्शन आणि अतिरिक्त सुविधा',
        },
        {
          type: 'p',
          text: 'पुढे काही सशुल्क सुविधा येऊ शकतात. आज सबस्क्रिप्शन सुरू नाही. खरेदीपूर्वी किंमत आणि नूतनीकरण स्पष्ट दिसेल.',
        },
        {
          type: 'p',
          text: 'सबस्क्रिप्शन सुरू झाल्यास हे नियम लागू होतील:',
        },
        {
          type: 'ul',
          items: [
            'दर महिना / वर्षाचे बिल आधीच स्पष्ट सांगितले जाईल.',
            'पुढील शुल्क थांबवण्यासाठी रद्द करता येईल (जेव्हा ही सुविधा उपलब्ध होईल).',
            'रद्द केल्याने पुढील बिल थांबते; चालू कालावधीचे पैसे आपोआप परत मिळत नाहीत.',
            'खरेदीपूर्वी किंमत आणि तारीख तुम्हाला दाखवली जाईल.',
          ],
        },
      ],
    },
    {
      title: '५. वापरकर्त्याची जबाबदारी',
      blocks: [
        {
          type: 'p',
          text: 'प्लॅटफॉर्म वापरताना खालील गोष्टी करू नका:',
        },
        {
          type: 'ul',
          items: [
            'खोटी / बनावट कागदपत्रे देणे',
            'फसवणूक करण्याचा प्रयत्न',
            'प्लॅटफॉर्मचा गैरवापर',
            'सेवा अडविणे किंवा बिघडवणे',
            'अॅप तोडून कोड काढण्याचा प्रयत्न',
          ],
        },
      ],
    },
    {
      title: '६. जबाबदारीची मर्यादा',
      blocks: [
        {
          type: 'p',
          text: 'प्लॅटफॉर्म "जसे आहे तसे" उपलब्ध आहे. कायद्याने परवानगी असेल तिथपर्यंत, प्लॅटफॉर्म वापरताना किंवा न वापरताना झालेल्या अप्रत्यक्ष नुकसानीसाठी (उदा. नफा / डेटा / सद्भावना) Kissan Agrisathi जबाबदार नाही.',
        },
        {
          type: 'p',
          text: 'हवामान आणि सरकारी बाजारभाव इतर स्रोत / सरकारकडून येतात. ती नेहमी बरोबर असतीलच असे नाही. त्यावर अवलंबून राहणे तुमच्या विवेकाचे आहे. कायद्याने पूर्ण जबाबदारी काढता येत नसेल, तर आमची एकूण जबाबदारी तुम्ही त्या सेवेसाठी दिलेल्या रकमेपर्यंत मर्यादित राहील.',
        },
      ],
    },
    {
      title: '७. कायदा आणि न्यायालये',
      blocks: [
        {
          type: 'p',
          text: 'हे अटी व नियम भारतीय कायद्यांनुसार आहेत. वादासाठी फक्त छत्रपती संभाजीनगर, महाराष्ट्र येथील न्यायालयात दावा करता येईल.',
        },
      ],
    },
    {
      title: '८. नियमात बदल',
      blocks: [
        {
          type: 'p',
          text: 'आम्ही हे अटी व नियम वेळोवेळी बदलू शकतो. बदलानंतरही प्लॅटफॉर्म वापरल्यास नवीन नियम मान्य आहेत असे समजले जाईल.',
        },
      ],
    },
    {
      title: '९. संपर्क',
      blocks: [
        {
          type: 'p',
          text: 'या नियमांबद्दल प्रश्न असल्यास आमच्याशी संपर्क साधा:',
        },
        { type: 'contact' },
      ],
    },
  ],
}

const refundEn: LegalDoc = {
  title: 'Refund & Cancellation Policy',
  subtitle: 'How refunds and cancellations work on the Kissan Agrisathi platform.',
  seoDescription:
    'Kissan Agrisathi Refund & Cancellation Policy for the Village Representative registration fee and future Farmer subscription.',
  sections: [
    {
      title: '1. Overview',
      blocks: [
        {
          type: 'p',
          text: 'This Refund & Cancellation Policy explains the terms that apply to fees paid on the Kissan Agrisathi platform. Please read it carefully before making any payment.',
        },
      ],
    },
    {
      title: '2. Village Representative Registration Fee — ₹500',
      blocks: [
        {
          type: 'p',
          text: 'The ₹500 registration fee is charged for document verification and administrative processing.',
        },
        {
          type: 'pStrong',
          before: 'Once verification has commenced, the fee is generally ',
          strong: 'non-refundable',
          after:
            ' except where required by applicable law or where Kissan Agrisathi cancels the application before processing.',
        },
        {
          type: 'p',
          text: `Payment of the registration fee does not guarantee approval of your application. Approval remains solely at the discretion of ${LEGAL_COMPANY_NAME}.`,
        },
      ],
    },
    {
      title: '3. Subscriptions & Premium Features',
      blocks: [
        {
          type: 'p',
          text: 'Future premium features may be offered through subscription plans. Subscriptions are not active today. Pricing and renewal information will always be shown before purchase.',
        },
        {
          type: 'p',
          text: 'When and if subscription plans are launched, the following terms will apply:',
        },
        {
          type: 'ul',
          items: [
            'Users may cancel future renewals at any time through supported methods once subscription management is available.',
            'Cancellation stops future billing but does not automatically refund the current billing period.',
            'No partial refund will be provided for the current billing period unless required by applicable law.',
          ],
        },
      ],
    },
    {
      title: '4. How to Request a Refund or Raise a Concern',
      blocks: [
        {
          type: 'p',
          text: 'If you believe you are eligible for a refund or have a concern about a payment, please contact our support team with your registered details and payment reference:',
        },
        { type: 'contact' },
      ],
    },
  ],
}

const refundMr: LegalDoc = {
  title: 'परतावा व रद्दीकरण धोरण',
  subtitle:
    'Kissan Agrisathi वर पैसे परत मिळणे आणि रद्द करणे कसे चालते.',
  seoDescription:
    'Kissan Agrisathi परतावा व रद्दीकरण धोरण: गाव प्रतिनिधी नोंदणी शुल्क आणि भविष्यातील सबस्क्रिप्शन.',
  sections: [
    {
      title: '१. या धोरणाबद्दल',
      blocks: [
        {
          type: 'p',
          text: 'या धोरणात Kissan Agrisathi प्लॅटफॉर्मवर दिलेल्या शुल्काबाबत नियम सांगितले आहेत. पेमेंट करण्यापूर्वी हे काळजीपूर्वक वाचा.',
        },
      ],
    },
    {
      title: '२. गाव प्रतिनिधी नोंदणी शुल्क — ₹५००',
      blocks: [
        {
          type: 'p',
          text: 'कागदपत्र तपासणी आणि अर्ज प्रक्रिया चालवण्यासाठी ₹५०० शुल्क घेतले जाते.',
        },
        {
          type: 'pStrong',
          before: 'एकदा तपासणी सुरू झाली की सामान्यतः हे शुल्क ',
          strong: 'परत मिळत नाही',
          after:
            '. कायद्याने गरज असेल किंवा आम्ही तपासणी सुरू होण्याआधी अर्ज रद्द केल्यास अपवाद असू शकतो.',
        },
        {
          type: 'p',
          text: `नोंदणी शुल्क भरले म्हणून अर्ज मंजूर होईलच असे नाही. मंजुरीचा निर्णय ${LEGAL_COMPANY_NAME} कडे आहे.`,
        },
      ],
    },
    {
      title: '३. सबस्क्रिप्शन आणि अतिरिक्त सुविधा',
      blocks: [
        {
          type: 'p',
          text: 'पुढे काही सशुल्क सुविधा येऊ शकतात. आज सबस्क्रिप्शन सुरू नाही. खरेदीपूर्वी किंमत आणि नूतनीकरण स्पष्ट दिसेल.',
        },
        {
          type: 'p',
          text: 'सबस्क्रिप्शन सुरू झाल्यास हे नियम लागू होतील:',
        },
        {
          type: 'ul',
          items: [
            'पुढील शुल्क थांबवण्यासाठी रद्द करता येईल (जेव्हा ही सुविधा उपलब्ध होईल).',
            'रद्द केल्याने पुढील बिल थांबते; चालू कालावधीचे पैसे आपोआप परत मिळत नाहीत.',
            'चालू कालावधीसाठी अर्धा परतावा सामान्यतः मिळणार नाही, जोपर्यंत कायदा सांगत नाही.',
          ],
        },
      ],
    },
    {
      title: '४. परतावा मागणे किंवा तक्रार करणे',
      blocks: [
        {
          type: 'p',
          text: 'तुम्हाला परतावा मिळायला हवा असे वाटत असेल किंवा पेमेंटबद्दल शंका असेल, तर नोंदणी केलेली माहिती आणि पेमेंट क्रमांक घेऊन आमच्याशी संपर्क साधा:',
        },
        { type: 'contact' },
      ],
    },
  ],
}

export function getPrivacyDoc(locale: Locale): LegalDoc {
  return locale === 'mr' ? privacyMr : privacyEn
}

export function getTermsDoc(locale: Locale): LegalDoc {
  return locale === 'mr' ? termsMr : termsEn
}

export function getRefundDoc(locale: Locale): LegalDoc {
  return locale === 'mr' ? refundMr : refundEn
}
