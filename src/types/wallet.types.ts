export enum TransactionType {
  DEBIT = 'Debit',
  CREDIT = 'Credit',
}

export interface Wallet {
  _id: string;
  userId: string;
  currency: string;
  available_balance: number;
  ledger_balance: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  _id: string;
  walletId: string;
  userId: string;
  bankId?: string;
  amount: number;
  narration?: string;
  reference?: string;
  type: TransactionType;
  created_at: string;
  updated_at: string;
}
