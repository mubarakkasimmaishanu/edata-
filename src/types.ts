export interface UserProfile {
  id?: number | string;
  name: string;
  firstname?: string;
  lastname?: string;
  email: string;
  phone: string;
  walletBalance: number;
  category: 'Basic User' | 'Referred User' | 'Premium User';
  bvn: string;
  nin: string;
  isVerified: boolean;
  pinCode: string;
  hasPin: boolean;
  promoCode?: string;
  biometricsEnabled?: boolean;
  hasPendingUpgrade?: boolean;
  upgradeFee?: number;
  photo?: string | null;
  avatar?: string | null;
  picture?: string | null;
  virtualAccount?: VirtualAccount | null;
  virtualAccounts?: VirtualAccount[];
}

export type TransactionType = 'Airtime' | 'Data' | 'Electricity' | 'Cable TV' | 'Exam Token' | 'Wallet Funding' | 'Admin Transfer' | 'A2C';

export interface Transaction {
  id: string;
  type: TransactionType;
  productName: string;
  amount: number;
  phoneOrMeter: string;
  operator?: string;
  reference: string;
  status: 'Pending' | 'Completed' | 'Failed';
  date: string;
  disputeRaised: boolean;
  disputeStatus?: 'Open' | 'Resolved' | 'Rejected';
  disputeNotes?: string;
  riskScore?: number; // 0 - 100
  riskAnalysis?: string;
}

export interface ProductItem {
  id: string;
  category: 'Airtime' | 'Data' | 'Electricity' | 'Cable' | 'Exam' | 'Cable TV' | 'Exam Token' | 'A2C';
  name: string;
  operator?: string;
  priceNormal: number;
  priceReferred: number;
  pricePremium: number;
  active: boolean;
  description: string;
  planType?: string;
}

export interface MarketerLeader {
  id: string;
  name: string;
  tier: 'LGA Leader' | 'State Leader' | 'Regional Leader' | 'National Leader';
  location: string;
  referrersCount: number;
  totalSales: number;
  earnings: number;
}

export interface AppNotification {
  id: number | string;
  title: string;
  message: string;
  type?: string;
  image?: string | null;
  target_group?: string;
  created_at: string;
  timestamp?: number;
  is_read: boolean;
  read_at?: string | null;
}

export interface VirtualAccount {
  id?: number | string;
  bank_name: string;
  account_number: string;
  account_name: string;
}

export interface ManualBank {
  bank_name: string;
  account_name: string;
  account_number: string;
}

export interface QuickAction {
  id: number | string;
  title: string;
  service_type: 'data' | 'airtime' | 'cable' | 'electricity' | 'exams' | 'a2c';
  network: string;
  plan_id?: number | null;
  icon: string;
  display_order: number;
  status: number;
}

