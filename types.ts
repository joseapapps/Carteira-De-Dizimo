
export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: 'income';
  isTithePaid: boolean; // Mantido para compatibilidade, mas a lógica principal agora será por mês
}

export interface TithePayment {
  id: string;
  amount: number;
  date: string;
}

export interface WalletData {
  transactions: Transaction[];
  tithePayments: TithePayment[];
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
