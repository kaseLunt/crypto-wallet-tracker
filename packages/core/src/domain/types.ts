import type { Chain, Token, Transaction, Wallet } from "@prisma/client";

// Re-export Prisma types
export type { Chain, Token, Transaction, Wallet };

// Custom domain types
export interface WalletWithBalance extends Wallet {
  totalValueUSD: number;
  tokens: TokenBalance[];
}

export interface TokenBalance {
  token: Token;
  balance: string;
  balanceFormatted: number;
  valueUSD: number;
}

export interface TransactionWithDetails extends Transaction {
  token: Token | null;
  gasFeeUSD: number;
}

export interface PortfolioSnapshot {
  timestamp: Date;
  totalValueUSD: number;
  wallets: WalletSnapshot[];
}

export interface WalletSnapshot {
  walletId: string;
  valueUSD: number;
  tokenBalances: Record<string, TokenBalance>;
}
