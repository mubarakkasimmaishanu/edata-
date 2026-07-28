import { UserProfile, Transaction, ProductItem, MarketerLeader } from './types';

export const DEFAULT_USER: UserProfile = {
  name: "User",
  email: "",
  phone: "",
  walletBalance: 0,
  category: 'Basic User',
  bvn: '',
  nin: '',
  isVerified: false,
  pinCode: '',
  hasPin: false,
  promoCode: ''
};

export const INITIAL_SUBSCRIBERS: UserProfile[] = [];

export const INITIAL_PRODUCTS: ProductItem[] = [];

export const MARKETER_LEADERS: MarketerLeader[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];
