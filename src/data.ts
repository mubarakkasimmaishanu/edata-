import { UserProfile, Transaction, ProductItem, MarketerLeader } from './types';

export const DEFAULT_USER: UserProfile = {
  name: "Usman Annur",
  email: "usmanannur58@gmail.com",
  phone: "08142233864",
  walletBalance: 32643.00,
  category: 'Basic User',
  bvn: '',
  nin: '',
  isVerified: false,
  pinCode: '',
  hasPin: false,
  promoCode: ''
};

export const INITIAL_SUBSCRIBERS: UserProfile[] = [
  {
    name: "Usman Annur",
    email: "usmanannur58@gmail.com",
    phone: "08142233864",
    walletBalance: 32643.00,
    category: 'Basic User',
    bvn: '',
    nin: '',
    isVerified: false,
    pinCode: '1234',
    hasPin: true
  },
  {
    name: "Segun Arinze",
    email: "segun@edata.co",
    phone: "08031234567",
    walletBalance: 15450.00,
    category: 'Referred User',
    bvn: '22233344455',
    nin: '11122233344',
    isVerified: true,
    pinCode: '5678',
    hasPin: true
  },
  {
    name: "Aisha Yusuf",
    email: "aisha.y@gmail.com",
    phone: "08051112223",
    walletBalance: 87200.00,
    category: 'Premium User',
    bvn: '99988877766',
    nin: '55544433322',
    isVerified: true,
    pinCode: '9999',
    hasPin: true
  },
  {
    name: "Obinna Okafor",
    email: "obinna@okafor.com",
    phone: "08023334445",
    walletBalance: 1200.00,
    category: 'Basic User',
    bvn: '',
    nin: '',
    isVerified: false,
    pinCode: '',
    hasPin: false
  }
];

export const INITIAL_PRODUCTS: ProductItem[] = [
  // Airtime
  { id: 'art-mtn', category: 'Airtime', name: 'MTN Airtime VTU', operator: 'MTN', priceNormal: 100, priceReferred: 98, pricePremium: 96, active: true, description: 'Discounted airtime topup' },
  { id: 'art-glo', category: 'Airtime', name: 'Glo Airtime VTU', operator: 'Glo', priceNormal: 100, priceReferred: 97, pricePremium: 95, active: true, description: 'Discounted airtime topup' },
  { id: 'art-airtel', category: 'Airtime', name: 'Airtel Airtime VTU', operator: 'Airtel', priceNormal: 100, priceReferred: 98, pricePremium: 96, active: true, description: 'Discounted airtime topup' },
  { id: 'art-9mobile', category: 'Airtime', name: '9mobile Airtime VTU', operator: '9mobile', priceNormal: 100, priceReferred: 96, pricePremium: 94, active: true, description: 'Discounted airtime topup' },
  
  // Data
  { id: 'dat-mtn-1gb', category: 'Data', name: 'MTN 1GB (SME) - 30 Days', operator: 'MTN', priceNormal: 290, priceReferred: 275, pricePremium: 265, active: true, description: 'High speed SME data bundle' },
  { id: 'dat-mtn-2gb', category: 'Data', name: 'MTN 2GB (SME) - 30 Days', operator: 'MTN', priceNormal: 580, priceReferred: 550, pricePremium: 530, active: true, description: 'High speed SME data bundle' },
  { id: 'dat-glo-1gb', category: 'Data', name: 'Glo 1.35GB - 30 Days', operator: 'Glo', priceNormal: 480, priceReferred: 460, pricePremium: 440, active: true, description: 'Standard Glo mobile bundle' },
  { id: 'dat-airtel-1gb', category: 'Data', name: 'Airtel 1GB (SME) - 30 Days', operator: 'Airtel', priceNormal: 310, priceReferred: 295, pricePremium: 280, active: true, description: 'SME dynamic data package' },
  { id: 'dat-9mobile-1gb', category: 'Data', name: '9mobile 1GB - 30 Days', operator: '9mobile', priceNormal: 450, priceReferred: 430, pricePremium: 410, active: true, description: 'Premium 9mobile bandwidth' },

  // Electricity
  { id: 'elec-ikeja', category: 'Electricity', name: 'Ikeja Electricity Prepaid', operator: 'Ikeja Disco', priceNormal: 1000, priceReferred: 1000, pricePremium: 995, active: true, description: 'IKEDC token instant delivery' },
  { id: 'elec-eko', category: 'Electricity', name: 'Eko Electricity Prepaid', operator: 'Eko Disco', priceNormal: 1000, priceReferred: 1000, pricePremium: 995, active: true, description: 'EKEDC prepaid tokens' },
  { id: 'elec-abuja', category: 'Electricity', name: 'Abuja Electricity Prepaid', operator: 'AEDC', priceNormal: 1000, priceReferred: 1000, pricePremium: 995, active: true, description: 'AEDC prepaid system integration' },

  // Cable TV
  { id: 'cab-dstv', category: 'Cable TV', name: 'DSTV Access Package', operator: 'DSTV', priceNormal: 3500, priceReferred: 3450, pricePremium: 3400, active: true, description: 'Instant cable TV activation' },
  { id: 'cab-gotv', category: 'Cable TV', name: 'GOTV Max Package', operator: 'GOTV', priceNormal: 4850, priceReferred: 4800, pricePremium: 4750, active: true, description: 'GOTV entertainment bundle' },
  { id: 'cab-startimes', category: 'Cable TV', name: 'Startimes Nova', operator: 'Startimes', priceNormal: 1500, priceReferred: 1470, pricePremium: 1450, active: true, description: 'Nova basic access' },

  // Exam Tokens
  { id: 'exm-waec', category: 'Exam Token', name: 'WAEC Result Checker', operator: 'WAEC', priceNormal: 3200, priceReferred: 3150, pricePremium: 3100, active: true, description: 'WAEC e-pin card token' },
  { id: 'exm-neco', category: 'Exam Token', name: 'NECO Token Pin', operator: 'NECO', priceNormal: 1200, priceReferred: 1180, pricePremium: 1150, active: true, description: 'NECO result checking access pin' }
];

export const MARKETER_LEADERS: MarketerLeader[] = [
  // LGA Leaders
  { id: 'ldr-1', name: 'Audu Maikori', tier: 'LGA Leader', location: 'Kano Municipal', referrersCount: 14, totalSales: 342000, earnings: 3420 },
  { id: 'ldr-2', name: 'Emeka Nwosu', tier: 'LGA Leader', location: 'Ikeja LGA', referrersCount: 22, totalSales: 685000, earnings: 6850 },
  { id: 'ldr-3', name: 'Funmi Alao', tier: 'LGA Leader', location: 'Ibadan North', referrersCount: 18, totalSales: 412000, earnings: 4120 },
  
  // State Leaders
  { id: 'ldr-4', name: 'Mallam Ibrahim', tier: 'State Leader', location: 'Kano State', referrersCount: 112, totalSales: 2450000, earnings: 24500 },
  { id: 'ldr-5', name: 'Chief Adebayo', tier: 'State Leader', location: 'Lagos State', referrersCount: 240, totalSales: 5120000, earnings: 51200 },
  
  // Regional Leaders
  { id: 'ldr-6', name: 'Alhaji Danladi', tier: 'Regional Leader', location: 'North-West Region', referrersCount: 450, totalSales: 9800000, earnings: 98000 },
  { id: 'ldr-7', name: 'Nkemdiche Obi', tier: 'Regional Leader', location: 'South-East Region', referrersCount: 390, totalSales: 8200000, earnings: 82000 },

  // National Leader
  { id: 'ldr-8', name: 'Cizar Network Admin', tier: 'National Leader', location: 'All Nigeria', referrersCount: 1840, totalSales: 34500000, earnings: 345000 }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-001',
    type: 'Wallet Funding',
    productName: 'Paystack Gateway funding',
    amount: 10000.00,
    phoneOrMeter: 'Paystack Ref: PST-7832',
    reference: 'EDAT-FUND-9281',
    status: 'Completed',
    date: '2026-07-05T14:22:11',
    disputeRaised: false
  },
  {
    id: 'tx-002',
    type: 'Data',
    productName: 'MTN 2GB (SME) - 30 Days',
    amount: 580.00,
    phoneOrMeter: '08142233864',
    operator: 'MTN',
    reference: 'EDAT-PURCH-1123',
    status: 'Completed',
    date: '2026-07-05T15:02:44',
    disputeRaised: false
  },
  {
    id: 'tx-003',
    type: 'Electricity',
    productName: 'Ikeja Electricity Prepaid',
    amount: 5000.00,
    phoneOrMeter: '45028113942',
    operator: 'Ikeja Disco',
    reference: 'EDAT-PURCH-8419',
    status: 'Completed',
    date: '2026-07-04T09:12:00',
    disputeRaised: false
  },
  {
    id: 'tx-004',
    type: 'Airtime',
    productName: 'Airtel Airtime VTU',
    amount: 1500.00,
    phoneOrMeter: '08023334445',
    operator: 'Airtel',
    reference: 'EDAT-PURCH-3810',
    status: 'Failed',
    date: '2026-07-03T18:40:11',
    disputeRaised: true,
    disputeStatus: 'Resolved',
    disputeNotes: 'Airtel network timeout. Wallet value has been refunded successfully by Admin.'
  }
];
