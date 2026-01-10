
export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: 'income';
}

export interface WalletData {
  transactions: Transaction[];
  darkMode: boolean;
  currency: string;
  prosperityGoal?: number;
}

export interface ExchangeRate {
  code: string;
  codein: string;
  name: string;
  high: string;
  low: string;
  bid: string;
  ask: string;
  timestamp: string;
  create_date: string;
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  HISTORY = 'HISTORY',
  ANALYTICS = 'ANALYTICS',
  SETTINGS = 'SETTINGS'
}
