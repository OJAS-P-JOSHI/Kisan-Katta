/**
 * Static Maharashtra districts + district→taluka data, kept separate from any
 * screen/component. `district` values here match the backend's canonical
 * district names exactly (see `resolveDistrict` in the Backend profile module),
 * so they can be sent to `POST /api/v1/profile` / `PUT /api/v1/profile/me`
 * without transformation.
 */

export const MAHARASHTRA_DISTRICTS = [
  'Pune',
  'Satara',
  'Sangli',
  'Solapur',
  'Kolhapur',
  'Raigad',
  'Ratnagiri',
  'Sindhudurg',
  'Palghar',
  'Thane',
  'Mumbai City',
  'Mumbai Suburban',
  'Nashik',
  'Dhule',
  'Nandurbar',
  'Jalgaon',
  'Ahmednagar',
  'Chhatrapati Sambhajinagar',
  'Jalna',
  'Beed',
  'Latur',
  'Dharashiv',
  'Nanded',
  'Hingoli',
  'Parbhani',
  'Nagpur',
  'Wardha',
  'Yavatmal',
  'Amravati',
  'Akola',
  'Buldhana',
  'Washim',
  'Bhandara',
  'Gondia',
  'Chandrapur',
  'Gadchiroli',
] as const;

export type MaharashtraDistrict = (typeof MAHARASHTRA_DISTRICTS)[number];

/** Talukas per district. Taluka has no backend validation, so this is UI-only. */
export const TALUKAS_BY_DISTRICT: Record<MaharashtraDistrict, string[]> = {
  Pune: [
    'Ambegaon', 'Baramati', 'Bhor', 'Daund', 'Haveli', 'Indapur', 'Junnar',
    'Khed', 'Maval', 'Mulshi', 'Pune City', 'Purandar', 'Shirur', 'Velhe',
  ],
  Satara: [
    'Jaoli', 'Karad', 'Khandala', 'Khatav', 'Koregaon', 'Mahabaleshwar',
    'Man', 'Patan', 'Phaltan', 'Satara', 'Wai',
  ],
  Sangli: [
    'Atpadi', 'Jat', 'Kadegaon', 'Kavathe Mahankal', 'Khanapur', 'Miraj',
    'Palus', 'Shirala', 'Tasgaon', 'Walwa',
  ],
  Solapur: [
    'Akkalkot', 'Barshi', 'Karmala', 'Madha', 'Malshiras', 'Mangalvedhe',
    'Mohol', 'North Solapur', 'Pandharpur', 'Sangola', 'South Solapur',
  ],
  Kolhapur: [
    'Ajra', 'Bhudargad', 'Chandgad', 'Gaganbawada', 'Gadhinglaj',
    'Hatkanangle', 'Kagal', 'Karvir', 'Panhala', 'Radhanagari', 'Shahuwadi',
    'Shirol',
  ],
  Raigad: [
    'Alibag', 'Karjat', 'Khalapur', 'Mahad', 'Mangaon', 'Mhasla', 'Murud',
    'Panvel', 'Pen', 'Poladpur', 'Roha', 'Shrivardhan', 'Sudhagad', 'Tala',
    'Uran',
  ],
  Ratnagiri: [
    'Chiplun', 'Dapoli', 'Guhagar', 'Khed', 'Lanja', 'Mandangad', 'Rajapur',
    'Ratnagiri', 'Sangameshwar',
  ],
  Sindhudurg: [
    'Devgad', 'Dodamarg', 'Kankavli', 'Kudal', 'Malvan', 'Sawantwadi',
    'Vaibhavwadi', 'Vengurla',
  ],
  Palghar: [
    'Dahanu', 'Jawhar', 'Mokhada', 'Palghar', 'Talasari', 'Vada', 'Vasai',
    'Vikramgad',
  ],
  Thane: ['Ambernath', 'Bhiwandi', 'Kalyan', 'Murbad', 'Shahapur', 'Thane', 'Ulhasnagar'],
  'Mumbai City': ['Mumbai City'],
  'Mumbai Suburban': ['Andheri', 'Borivali', 'Kurla'],
  Nashik: [
    'Baglan', 'Chandwad', 'Deola', 'Dindori', 'Igatpuri', 'Kalwan',
    'Malegaon', 'Nandgaon', 'Nashik', 'Niphad', 'Peth', 'Sinnar', 'Surgana',
    'Trimbakeshwar', 'Yeola',
  ],
  Dhule: ['Dhule', 'Sakri', 'Shirpur', 'Sindkheda'],
  Nandurbar: ['Akkalkuwa', 'Akrani', 'Nandurbar', 'Navapur', 'Shahada', 'Taloda'],
  Jalgaon: [
    'Amalner', 'Bhadgaon', 'Bhusawal', 'Bodwad', 'Chalisgaon', 'Chopda',
    'Dharangaon', 'Erandol', 'Jalgaon', 'Jamner', 'Muktainagar', 'Pachora',
    'Parola', 'Raver', 'Yawal',
  ],
  Ahmednagar: [
    'Akole', 'Jamkhed', 'Karjat', 'Kopargaon', 'Nagar', 'Nevasa', 'Parner',
    'Pathardi', 'Rahata', 'Rahuri', 'Sangamner', 'Shevgaon', 'Shrigonda',
    'Shrirampur',
  ],
  'Chhatrapati Sambhajinagar': [
    'Chhatrapati Sambhajinagar', 'Gangapur', 'Kannad', 'Khuldabad', 'Paithan',
    'Phulambri', 'Sillod', 'Soegaon', 'Vaijapur',
  ],
  Jalna: ['Ambad', 'Badnapur', 'Bhokardan', 'Ghansawangi', 'Jafrabad', 'Jalna', 'Mantha', 'Partur'],
  Beed: [
    'Ambajogai', 'Ashti', 'Beed', 'Dharur', 'Georai', 'Kaij', 'Majalgaon',
    'Parli', 'Patoda', 'Shirur (Kasar)', 'Wadwani',
  ],
  Latur: [
    'Ahmedpur', 'Ausa', 'Chakur', 'Deoni', 'Jalkot', 'Latur', 'Nilanga',
    'Renapur', 'Shirur Anantpal', 'Udgir',
  ],
  Dharashiv: ['Bhum', 'Dharashiv', 'Kalamb', 'Lohara', 'Omerga', 'Paranda', 'Tuljapur', 'Washi'],
  Nanded: [
    'Ardhapur', 'Bhokar', 'Biloli', 'Deglur', 'Dharmabad', 'Hadgaon',
    'Himayatnagar', 'Kandhar', 'Kinwat', 'Loha', 'Mahur', 'Mudkhed',
    'Mukhed', 'Naigaon', 'Nanded', 'Umri',
  ],
  Hingoli: ['Aundha Nagnath', 'Basmath', 'Hingoli', 'Kalamnuri', 'Sengaon'],
  Parbhani: ['Gangakhed', 'Jintur', 'Manwat', 'Palam', 'Parbhani', 'Pathri', 'Purna', 'Sailu', 'Sonpeth'],
  Nagpur: [
    'Bhiwapur', 'Hingna', 'Kalameshwar', 'Kamptee', 'Katol', 'Kuhi', 'Mouda',
    'Nagpur (Rural)', 'Nagpur (Urban)', 'Narkhed', 'Parseoni', 'Ramtek',
    'Savner', 'Umred',
  ],
  Wardha: ['Arvi', 'Ashti', 'Deoli', 'Hinganghat', 'Karanja', 'Samudrapur', 'Seloo', 'Wardha'],
  Yavatmal: [
    'Arni', 'Babhulgaon', 'Darwha', 'Digras', 'Ghatanji', 'Kalamb',
    'Kelapur (Pandharkawada)', 'Mahagaon', 'Maregaon', 'Ner', 'Pusad',
    'Ralegaon', 'Umarkhed', 'Wani', 'Yavatmal', 'Zari Jamni',
  ],
  Amravati: [
    'Achalpur', 'Amravati', 'Anjangaon Surji', 'Bhatkuli', 'Chandur Bazar',
    'Chandur Railway', 'Chikhaldara', 'Daryapur', 'Dharni', 'Morshi',
    'Nandgaon Khandeshwar', 'Teosa', 'Warud',
  ],
  Akola: ['Akola', 'Akot', 'Balapur', 'Barshitakli', 'Murtizapur', 'Patur', 'Telhara'],
  Buldhana: [
    'Buldhana', 'Chikhli', 'Deulgaon Raja', 'Jalgaon Jamod', 'Khamgaon',
    'Lonar', 'Malkapur', 'Mehkar', 'Motala', 'Nandura', 'Sangrampur',
    'Shegaon', 'Sindkhed Raja',
  ],
  Washim: ['Karanja', 'Malegaon', 'Mangrulpir', 'Manora', 'Risod', 'Washim'],
  Bhandara: ['Bhandara', 'Lakhandur', 'Lakhani', 'Mohadi', 'Pauni', 'Sakoli', 'Tumsar'],
  Gondia: ['Amgaon', 'Arjuni Morgaon', 'Deori', 'Gondia', 'Goregaon', 'Sadak Arjuni', 'Salekasa', 'Tirora'],
  Chandrapur: [
    'Ballarpur', 'Bhadravati', 'Brahmapuri', 'Chandrapur', 'Chimur',
    'Gondpipri', 'Jiwati', 'Korpana', 'Mul', 'Nagbhid', 'Pombhurna',
    'Rajura', 'Saoli', 'Sindewahi', 'Warora',
  ],
  Gadchiroli: [
    'Aheri', 'Armori', 'Bhamragad', 'Chamorshi', 'Desaiganj', 'Dhanora',
    'Etapalli', 'Gadchiroli', 'Korchi', 'Kurkheda', 'Mulchera', 'Sironcha',
  ],
};

/** Language codes accepted by the backend (`profile.language`). */
export const SUPPORTED_LANGUAGES = ['mr', 'en', 'hi'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  mr: 'मराठी (Marathi)',
  en: 'English',
  hi: 'हिन्दी (Hindi)',
};

export const DEFAULT_LANGUAGE: SupportedLanguage = 'mr';

export const MAX_FAVOURITE_CROPS = 10;

/** Common Maharashtra crops offered in the favourite-crops multi-select. */
export const COMMON_CROPS = [
  'Kanda (Onion)',
  'Soyabean',
  'Kapus (Cotton)',
  'Tur (Pigeon Pea)',
  'Bajri',
  'Jowar',
  'Wheat',
  'Rice (Bhaat)',
  'Sugarcane',
  'Gram (Harbhara)',
  'Groundnut',
  'Grapes',
  'Turmeric',
  'Soybean Oilseed',
  'Maize',
] as const;
