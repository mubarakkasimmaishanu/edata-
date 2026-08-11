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

export interface PlanTypeItem {
  id: number | string;
  name: string;
  code: string;
  description?: string;
}

// ── Dynamic Popup / Banner ──────────────────────────────────────────────
// Everything below is driven entirely by the admin panel via the /popups
// endpoint. The mobile app never hardcodes copy, images, action targets,
// or dismissibility — whatever the admin sets is what the user sees.
//
// `type` is a hint that lets the client choose an icon/accent — the admin
// can add new types on the backend without shipping a new build; unknown
// types fall back to the neutral "info" style.
export type PopupType =
  | 'update'        // Force / recommend an app update
  | 'rate'          // Ask the user to rate the app
  | 'info'          // Ask the user for information (opens `action_url`)
  | 'promo'         // Announce a promotion / discount
  | 'announcement'  // General notice
  | string;         // Future-proof: admin-defined types are allowed

export interface PopupBanner {
  id: number | string;
  title: string;
  message: string;
  image?: string | null;
  type?: PopupType;
  // Primary CTA — if `action_url` is present the button is shown. URLs can
  // be an external https link, a Play/App-Store link, or an in-app route
  // like `app://profile` (see PopupBanner.tsx for the resolver).
  action_label?: string | null;
  action_url?: string | null;
  // Secondary CTA (optional — most popups don't need it).
  secondary_label?: string | null;
  secondary_url?: string | null;
  // Force-update popups set this to false so the user can't dismiss the
  // popup without acting on the CTA.
  dismissible?: boolean;
  // When true the popup is shown once per device (default). When false the
  // popup shows every time until the admin marks it inactive.
  show_once?: boolean;
  // 'all' | 'basic' | 'referred' | 'premium' | 'guest' — filtered on
  // the client too, so the admin can broadcast to a specific tier.
  target_group?: string | null;
  display_order?: number;
  // 1 = active, 0 = inactive. Only active popups are ever rendered.
  status?: number | boolean;
  // Optional version gating — the admin can pin a popup to a range of
  // app versions (semver strings, inclusive). Leave blank for "all".
  min_app_version?: string | null;
  max_app_version?: string | null;
  created_at?: string;
  updated_at?: string;
}

