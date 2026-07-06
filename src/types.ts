export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  walletBalance: number;
  category: 'Basic User' | 'Referred User' | 'Super User';
  bvn: string;
  nin: string;
  isVerified: boolean;
  pinCode: string;
  hasPin: boolean;
  promoCode?: string;
}

export type TransactionType = 'Airtime' | 'Data' | 'Electricity' | 'Cable TV' | 'Exam Token' | 'Wallet Funding' | 'Admin Transfer';

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
  category: 'Airtime' | 'Data' | 'Electricity' | 'Cable' | 'Exam' | 'Cable TV' | 'Exam Token';
  name: string;
  operator?: string;
  priceNormal: number;
  priceReferred: number;
  priceSuper: number;
  active: boolean;
  description: string;
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
