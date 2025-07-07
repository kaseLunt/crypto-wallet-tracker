import type {
  GraphQLResolveInfo,
  GraphQLScalarType,
  GraphQLScalarTypeConfig,
} from "graphql";
import type { GraphQLContext } from "../types.js";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never;
    };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & {
  [P in K]-?: NonNullable<T[P]>;
};
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  BigInt: { input: string; output: string };
  DateTime: { input: string; output: string };
  JSON: { input: any; output: any };
};

export type AddWalletInput = {
  address: Scalars["String"]["input"];
  chain: Chain;
  label?: InputMaybe<Scalars["String"]["input"]>;
};

export type BatchSyncResult = {
  __typename?: "BatchSyncResult";
  failureCount: Scalars["Int"]["output"];
  results: Array<SyncResult>;
  successCount: Scalars["Int"]["output"];
  totalWallets: Scalars["Int"]["output"];
};

export type Chain =
  | "ARBITRUM"
  | "AVALANCHE"
  | "BASE"
  | "BSC"
  | "ETHEREUM"
  | "OPTIMISM"
  | "POLYGON";

export type ChainBreakdown = {
  __typename?: "ChainBreakdown";
  chain: Chain;
  percentage: Scalars["Float"]["output"];
  valueUSD: Scalars["Float"]["output"];
};

export type Currency = "BTC" | "ETH" | "EUR" | "GBP" | "USD";

export type DeFiPosition = {
  __typename?: "DeFiPosition";
  apy?: Maybe<Scalars["Float"]["output"]>;
  borrowedTokens: Array<DeFiTokenAmount>;
  healthFactor?: Maybe<Scalars["Float"]["output"]>;
  id: Scalars["ID"]["output"];
  netValueUSD: Scalars["Float"]["output"];
  protocol: DeFiProtocol;
  rewardTokens: Array<DeFiTokenAmount>;
  suppliedTokens: Array<DeFiTokenAmount>;
  totalBorrowedUSD: Scalars["Float"]["output"];
  totalRewardsUSD: Scalars["Float"]["output"];
  totalSuppliedUSD: Scalars["Float"]["output"];
  type: DeFiPositionType;
  wallet: Wallet;
};

export type DeFiPositionType =
  | "BORROWING"
  | "LENDING"
  | "LIQUIDITY_POOL"
  | "STAKING"
  | "YIELD_FARMING";

export type DeFiProtocol =
  | "AAVE"
  | "COMPOUND"
  | "CURVE"
  | "MORPHO"
  | "PENDLE"
  | "UNISWAP";

export type DeFiTokenAmount = {
  __typename?: "DeFiTokenAmount";
  amount: Scalars["String"]["output"];
  amountFormatted: Scalars["Float"]["output"];
  token: Token;
  valueUSD: Scalars["Float"]["output"];
};

export type Mutation = {
  __typename?: "Mutation";
  addWallet: Wallet;
  removeWallet: Scalars["Boolean"]["output"];
  syncAllWallets: BatchSyncResult;
  syncWallet: SyncResult;
  updateWallet: Wallet;
};

export type MutationAddWalletArgs = {
  input: AddWalletInput;
};

export type MutationRemoveWalletArgs = {
  address: Scalars["String"]["input"];
  chain: Chain;
};

export type MutationSyncWalletArgs = {
  address: Scalars["String"]["input"];
  chain: Chain;
};

export type MutationUpdateWalletArgs = {
  address: Scalars["String"]["input"];
  chain: Chain;
  input: UpdateWalletInput;
};

export type Nft = {
  __typename?: "NFT";
  collection: NftCollection;
  id: Scalars["ID"]["output"];
  imageUrl?: Maybe<Scalars["String"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  tokenId: Scalars["String"]["output"];
  traits?: Maybe<Scalars["JSON"]["output"]>;
};

export type NftCollection = {
  __typename?: "NFTCollection";
  address: Scalars["String"]["output"];
  chain: Chain;
  name: Scalars["String"]["output"];
  symbol?: Maybe<Scalars["String"]["output"]>;
};

export type NftTransfer = {
  __typename?: "NFTTransfer";
  collection: NftCollection;
  from: Scalars["String"]["output"];
  to: Scalars["String"]["output"];
  tokenId: Scalars["String"]["output"];
};

export type PageInfo = {
  __typename?: "PageInfo";
  endCursor?: Maybe<Scalars["String"]["output"]>;
  hasNextPage: Scalars["Boolean"]["output"];
  hasPreviousPage: Scalars["Boolean"]["output"];
  startCursor?: Maybe<Scalars["String"]["output"]>;
};

export type PerformanceMetrics = {
  __typename?: "PerformanceMetrics";
  bestPerformer?: Maybe<TokenBreakdown>;
  totalReturn: Scalars["Float"]["output"];
  totalReturnPercent: Scalars["Float"]["output"];
  worstPerformer?: Maybe<TokenBreakdown>;
};

export type Portfolio = {
  __typename?: "Portfolio";
  chainBreakdown: Array<ChainBreakdown>;
  performanceMetrics: PerformanceMetrics;
  tokenBreakdown: Array<TokenBreakdown>;
  totalValueChange24h: Scalars["Float"]["output"];
  totalValueChange24hPercent: Scalars["Float"]["output"];
  totalValueUSD: Scalars["Float"]["output"];
  wallets: Array<Wallet>;
};

export type PortfolioSnapshot = {
  __typename?: "PortfolioSnapshot";
  timestamp: Scalars["DateTime"]["output"];
  totalValueUSD: Scalars["Float"]["output"];
  walletSnapshots: Array<WalletSnapshot>;
};

export type PriceSource = "AGGREGATE" | "CHAINLINK" | "COINGECKO" | "UNISWAP";

export type Query = {
  __typename?: "Query";
  defiPositions: Array<DeFiPosition>;
  portfolio: Portfolio;
  portfolioHistory: Array<PortfolioSnapshot>;
  token?: Maybe<Token>;
  tokenPrice?: Maybe<TokenPrice>;
  tokenPriceHistory: Array<TokenPrice>;
  tokens: Array<Token>;
  transactions: TransactionConnection;
  wallet?: Maybe<Wallet>;
  wallets: WalletConnection;
};

export type QueryDefiPositionsArgs = {
  walletAddress: Scalars["String"]["input"];
};

export type QueryPortfolioArgs = {
  walletAddresses: Array<Scalars["String"]["input"]>;
};

export type QueryPortfolioHistoryArgs = {
  from: Scalars["DateTime"]["input"];
  interval: TimeInterval;
  to: Scalars["DateTime"]["input"];
  walletAddresses: Array<Scalars["String"]["input"]>;
};

export type QueryTokenArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryTokenPriceArgs = {
  currency?: InputMaybe<Currency>;
  tokenId: Scalars["ID"]["input"];
};

export type QueryTokenPriceHistoryArgs = {
  from: Scalars["DateTime"]["input"];
  interval: TimeInterval;
  to: Scalars["DateTime"]["input"];
  tokenId: Scalars["ID"]["input"];
};

export type QueryTokensArgs = {
  chain?: InputMaybe<Chain>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryTransactionsArgs = {
  chain: Chain;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  walletAddress: Scalars["String"]["input"];
};

export type QueryWalletArgs = {
  address: Scalars["String"]["input"];
  chain: Chain;
};

export type QueryWalletsArgs = {
  chains?: InputMaybe<Array<Chain>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

export type Subscription = {
  __typename?: "Subscription";
  portfolioValueChanged: Portfolio;
  priceUpdates: TokenPrice;
  walletActivity: WalletEvent;
};

export type SubscriptionPortfolioValueChangedArgs = {
  walletAddresses: Array<Scalars["String"]["input"]>;
};

export type SubscriptionPriceUpdatesArgs = {
  tokenIds: Array<Scalars["ID"]["input"]>;
};

export type SubscriptionWalletActivityArgs = {
  address: Scalars["String"]["input"];
  chain: Chain;
};

export type SyncResult = {
  __typename?: "SyncResult";
  lastSyncedBlock?: Maybe<Scalars["BigInt"]["output"]>;
  message?: Maybe<Scalars["String"]["output"]>;
  success: Scalars["Boolean"]["output"];
  transactionsSynced?: Maybe<Scalars["Int"]["output"]>;
};

export type TimeInterval =
  | "DAY_1"
  | "HOUR_1"
  | "HOUR_4"
  | "MINUTE_5"
  | "MINUTE_15"
  | "MONTH_1"
  | "WEEK_1";

export type Token = {
  __typename?: "Token";
  chain: Chain;
  coingeckoId?: Maybe<Scalars["String"]["output"]>;
  contractAddress?: Maybe<Scalars["String"]["output"]>;
  currentPrice?: Maybe<TokenPrice>;
  decimals: Scalars["Int"]["output"];
  id: Scalars["ID"]["output"];
  logoUrl?: Maybe<Scalars["String"]["output"]>;
  marketCap?: Maybe<Scalars["Float"]["output"]>;
  name: Scalars["String"]["output"];
  priceChange24h?: Maybe<Scalars["Float"]["output"]>;
  priceHistory: Array<TokenPrice>;
  symbol: Scalars["String"]["output"];
  volume24h?: Maybe<Scalars["Float"]["output"]>;
};

export type TokenPriceHistoryArgs = {
  from: Scalars["DateTime"]["input"];
  interval: TimeInterval;
  to: Scalars["DateTime"]["input"];
};

export type TokenBalance = {
  __typename?: "TokenBalance";
  balance: Scalars["String"]["output"];
  balanceFormatted: Scalars["Float"]["output"];
  token: Token;
  valueChange24h: Scalars["Float"]["output"];
  valueUSD: Scalars["Float"]["output"];
};

export type TokenBreakdown = {
  __typename?: "TokenBreakdown";
  percentage: Scalars["Float"]["output"];
  token: Token;
  totalBalance: Scalars["String"]["output"];
  totalValueUSD: Scalars["Float"]["output"];
  valueChange24h: Scalars["Float"]["output"];
};

export type TokenPrice = {
  __typename?: "TokenPrice";
  priceBTC?: Maybe<Scalars["Float"]["output"]>;
  priceETH?: Maybe<Scalars["Float"]["output"]>;
  priceUSD: Scalars["Float"]["output"];
  source: PriceSource;
  timestamp: Scalars["DateTime"]["output"];
  tokenId: Scalars["ID"]["output"];
};

export type TokenTransfer = {
  __typename?: "TokenTransfer";
  amount: Scalars["String"]["output"];
  amountFormatted: Scalars["Float"]["output"];
  from: Scalars["String"]["output"];
  to: Scalars["String"]["output"];
  token: Token;
  valueUSD: Scalars["Float"]["output"];
};

export type Transaction = {
  __typename?: "Transaction";
  blockNumber: Scalars["BigInt"]["output"];
  chain: Chain;
  from: Scalars["String"]["output"];
  gasFeeUSD: Scalars["Float"]["output"];
  gasPrice: Scalars["String"]["output"];
  gasUsed: Scalars["String"]["output"];
  hash: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  nftTransfers: Array<NftTransfer>;
  status: TransactionStatus;
  timestamp: Scalars["DateTime"]["output"];
  to: Scalars["String"]["output"];
  token?: Maybe<Token>;
  tokenTransfers: Array<TokenTransfer>;
  type: TransactionType;
  value: Scalars["String"]["output"];
};

export type TransactionConnection = {
  __typename?: "TransactionConnection";
  edges: Array<TransactionEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars["Int"]["output"];
};

export type TransactionEdge = {
  __typename?: "TransactionEdge";
  cursor: Scalars["String"]["output"];
  node: Transaction;
};

export type TransactionStatus = "CONFIRMED" | "FAILED" | "PENDING";

export type TransactionType =
  | "APPROVAL"
  | "BURN"
  | "CONTRACT_CALL"
  | "MINT"
  | "SWAP"
  | "TRANSFER";

export type UpdateWalletInput = {
  isActive?: InputMaybe<Scalars["Boolean"]["input"]>;
  label?: InputMaybe<Scalars["String"]["input"]>;
};

export type Wallet = {
  __typename?: "Wallet";
  address: Scalars["String"]["output"];
  balance: WalletBalance;
  chain: Chain;
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["ID"]["output"];
  isActive: Scalars["Boolean"]["output"];
  label?: Maybe<Scalars["String"]["output"]>;
  lastSyncedAt?: Maybe<Scalars["DateTime"]["output"]>;
  nfts: Array<Nft>;
  tokens: Array<TokenBalance>;
  totalValueUSD: Scalars["Float"]["output"];
  transactions: TransactionConnection;
  updatedAt: Scalars["DateTime"]["output"];
};

export type WalletTransactionsArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

export type WalletBalance = {
  __typename?: "WalletBalance";
  native: TokenBalance;
  tokens: Array<TokenBalance>;
  totalValueUSD: Scalars["Float"]["output"];
};

export type WalletConnection = {
  __typename?: "WalletConnection";
  edges: Array<WalletEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars["Int"]["output"];
};

export type WalletEdge = {
  __typename?: "WalletEdge";
  cursor: Scalars["String"]["output"];
  node: Wallet;
};

export type WalletEvent = NftTransfer | TokenTransfer | Transaction;

export type WalletSnapshot = {
  __typename?: "WalletSnapshot";
  tokenBalances: Scalars["JSON"]["output"];
  valueUSD: Scalars["Float"]["output"];
  walletId: Scalars["ID"]["output"];
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs,
> {
  subscribe: SubscriptionSubscribeFn<
    { [key in TKey]: TResult },
    TParent,
    TContext,
    TArgs
  >;
  resolve?: SubscriptionResolveFn<
    TResult,
    { [key in TKey]: TResult },
    TContext,
    TArgs
  >;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs,
> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<
  TResult,
  TKey extends string,
  TParent = {},
  TContext = {},
  TArgs = {},
> =
  | ((
      ...args: any[]
    ) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo,
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (
  obj: T,
  context: TContext,
  info: GraphQLResolveInfo,
) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<
  TResult = {},
  TParent = {},
  TContext = {},
  TArgs = {},
> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

/** Mapping of union types */
export type ResolversUnionTypes<_RefType extends Record<string, unknown>> =
  ResolversObject<{
    WalletEvent: NftTransfer | TokenTransfer | Transaction;
  }>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  AddWalletInput: AddWalletInput;
  BatchSyncResult: ResolverTypeWrapper<BatchSyncResult>;
  BigInt: ResolverTypeWrapper<Scalars["BigInt"]["output"]>;
  Boolean: ResolverTypeWrapper<Scalars["Boolean"]["output"]>;
  Chain: Chain;
  ChainBreakdown: ResolverTypeWrapper<ChainBreakdown>;
  Currency: Currency;
  DateTime: ResolverTypeWrapper<Scalars["DateTime"]["output"]>;
  DeFiPosition: ResolverTypeWrapper<DeFiPosition>;
  DeFiPositionType: DeFiPositionType;
  DeFiProtocol: DeFiProtocol;
  DeFiTokenAmount: ResolverTypeWrapper<DeFiTokenAmount>;
  Float: ResolverTypeWrapper<Scalars["Float"]["output"]>;
  ID: ResolverTypeWrapper<Scalars["ID"]["output"]>;
  Int: ResolverTypeWrapper<Scalars["Int"]["output"]>;
  JSON: ResolverTypeWrapper<Scalars["JSON"]["output"]>;
  Mutation: ResolverTypeWrapper<{}>;
  NFT: ResolverTypeWrapper<Nft>;
  NFTCollection: ResolverTypeWrapper<NftCollection>;
  NFTTransfer: ResolverTypeWrapper<NftTransfer>;
  PageInfo: ResolverTypeWrapper<PageInfo>;
  PerformanceMetrics: ResolverTypeWrapper<PerformanceMetrics>;
  Portfolio: ResolverTypeWrapper<Portfolio>;
  PortfolioSnapshot: ResolverTypeWrapper<PortfolioSnapshot>;
  PriceSource: PriceSource;
  Query: ResolverTypeWrapper<{}>;
  String: ResolverTypeWrapper<Scalars["String"]["output"]>;
  Subscription: ResolverTypeWrapper<{}>;
  SyncResult: ResolverTypeWrapper<SyncResult>;
  TimeInterval: TimeInterval;
  Token: ResolverTypeWrapper<Token>;
  TokenBalance: ResolverTypeWrapper<TokenBalance>;
  TokenBreakdown: ResolverTypeWrapper<TokenBreakdown>;
  TokenPrice: ResolverTypeWrapper<TokenPrice>;
  TokenTransfer: ResolverTypeWrapper<TokenTransfer>;
  Transaction: ResolverTypeWrapper<Transaction>;
  TransactionConnection: ResolverTypeWrapper<TransactionConnection>;
  TransactionEdge: ResolverTypeWrapper<TransactionEdge>;
  TransactionStatus: TransactionStatus;
  TransactionType: TransactionType;
  UpdateWalletInput: UpdateWalletInput;
  Wallet: ResolverTypeWrapper<Wallet>;
  WalletBalance: ResolverTypeWrapper<WalletBalance>;
  WalletConnection: ResolverTypeWrapper<WalletConnection>;
  WalletEdge: ResolverTypeWrapper<WalletEdge>;
  WalletEvent: ResolverTypeWrapper<
    ResolversUnionTypes<ResolversTypes>["WalletEvent"]
  >;
  WalletSnapshot: ResolverTypeWrapper<WalletSnapshot>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  AddWalletInput: AddWalletInput;
  BatchSyncResult: BatchSyncResult;
  BigInt: Scalars["BigInt"]["output"];
  Boolean: Scalars["Boolean"]["output"];
  ChainBreakdown: ChainBreakdown;
  DateTime: Scalars["DateTime"]["output"];
  DeFiPosition: DeFiPosition;
  DeFiTokenAmount: DeFiTokenAmount;
  Float: Scalars["Float"]["output"];
  ID: Scalars["ID"]["output"];
  Int: Scalars["Int"]["output"];
  JSON: Scalars["JSON"]["output"];
  Mutation: {};
  NFT: Nft;
  NFTCollection: NftCollection;
  NFTTransfer: NftTransfer;
  PageInfo: PageInfo;
  PerformanceMetrics: PerformanceMetrics;
  Portfolio: Portfolio;
  PortfolioSnapshot: PortfolioSnapshot;
  Query: {};
  String: Scalars["String"]["output"];
  Subscription: {};
  SyncResult: SyncResult;
  Token: Token;
  TokenBalance: TokenBalance;
  TokenBreakdown: TokenBreakdown;
  TokenPrice: TokenPrice;
  TokenTransfer: TokenTransfer;
  Transaction: Transaction;
  TransactionConnection: TransactionConnection;
  TransactionEdge: TransactionEdge;
  UpdateWalletInput: UpdateWalletInput;
  Wallet: Wallet;
  WalletBalance: WalletBalance;
  WalletConnection: WalletConnection;
  WalletEdge: WalletEdge;
  WalletEvent: ResolversUnionTypes<ResolversParentTypes>["WalletEvent"];
  WalletSnapshot: WalletSnapshot;
}>;

export type BatchSyncResultResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["BatchSyncResult"] = ResolversParentTypes["BatchSyncResult"],
> = ResolversObject<{
  failureCount?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  results?: Resolver<
    Array<ResolversTypes["SyncResult"]>,
    ParentType,
    ContextType
  >;
  successCount?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  totalWallets?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface BigIntScalarConfig
  extends GraphQLScalarTypeConfig<ResolversTypes["BigInt"], any> {
  name: "BigInt";
}

export type ChainBreakdownResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["ChainBreakdown"] = ResolversParentTypes["ChainBreakdown"],
> = ResolversObject<{
  chain?: Resolver<ResolversTypes["Chain"], ParentType, ContextType>;
  percentage?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  valueUSD?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface DateTimeScalarConfig
  extends GraphQLScalarTypeConfig<ResolversTypes["DateTime"], any> {
  name: "DateTime";
}

export type DeFiPositionResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["DeFiPosition"] = ResolversParentTypes["DeFiPosition"],
> = ResolversObject<{
  apy?: Resolver<Maybe<ResolversTypes["Float"]>, ParentType, ContextType>;
  borrowedTokens?: Resolver<
    Array<ResolversTypes["DeFiTokenAmount"]>,
    ParentType,
    ContextType
  >;
  healthFactor?: Resolver<
    Maybe<ResolversTypes["Float"]>,
    ParentType,
    ContextType
  >;
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  netValueUSD?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  protocol?: Resolver<ResolversTypes["DeFiProtocol"], ParentType, ContextType>;
  rewardTokens?: Resolver<
    Array<ResolversTypes["DeFiTokenAmount"]>,
    ParentType,
    ContextType
  >;
  suppliedTokens?: Resolver<
    Array<ResolversTypes["DeFiTokenAmount"]>,
    ParentType,
    ContextType
  >;
  totalBorrowedUSD?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  totalRewardsUSD?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  totalSuppliedUSD?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  type?: Resolver<ResolversTypes["DeFiPositionType"], ParentType, ContextType>;
  wallet?: Resolver<ResolversTypes["Wallet"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DeFiTokenAmountResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["DeFiTokenAmount"] = ResolversParentTypes["DeFiTokenAmount"],
> = ResolversObject<{
  amount?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  amountFormatted?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  token?: Resolver<ResolversTypes["Token"], ParentType, ContextType>;
  valueUSD?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface JsonScalarConfig
  extends GraphQLScalarTypeConfig<ResolversTypes["JSON"], any> {
  name: "JSON";
}

export type MutationResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["Mutation"] = ResolversParentTypes["Mutation"],
> = ResolversObject<{
  addWallet?: Resolver<
    ResolversTypes["Wallet"],
    ParentType,
    ContextType,
    RequireFields<MutationAddWalletArgs, "input">
  >;
  removeWallet?: Resolver<
    ResolversTypes["Boolean"],
    ParentType,
    ContextType,
    RequireFields<MutationRemoveWalletArgs, "address" | "chain">
  >;
  syncAllWallets?: Resolver<
    ResolversTypes["BatchSyncResult"],
    ParentType,
    ContextType
  >;
  syncWallet?: Resolver<
    ResolversTypes["SyncResult"],
    ParentType,
    ContextType,
    RequireFields<MutationSyncWalletArgs, "address" | "chain">
  >;
  updateWallet?: Resolver<
    ResolversTypes["Wallet"],
    ParentType,
    ContextType,
    RequireFields<MutationUpdateWalletArgs, "address" | "chain" | "input">
  >;
}>;

export type NftResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["NFT"] = ResolversParentTypes["NFT"],
> = ResolversObject<{
  collection?: Resolver<
    ResolversTypes["NFTCollection"],
    ParentType,
    ContextType
  >;
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  imageUrl?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  tokenId?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  traits?: Resolver<Maybe<ResolversTypes["JSON"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type NftCollectionResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["NFTCollection"] = ResolversParentTypes["NFTCollection"],
> = ResolversObject<{
  address?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  chain?: Resolver<ResolversTypes["Chain"], ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  symbol?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type NftTransferResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["NFTTransfer"] = ResolversParentTypes["NFTTransfer"],
> = ResolversObject<{
  collection?: Resolver<
    ResolversTypes["NFTCollection"],
    ParentType,
    ContextType
  >;
  from?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  to?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  tokenId?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PageInfoResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["PageInfo"] = ResolversParentTypes["PageInfo"],
> = ResolversObject<{
  endCursor?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  hasNextPage?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  hasPreviousPage?: Resolver<
    ResolversTypes["Boolean"],
    ParentType,
    ContextType
  >;
  startCursor?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PerformanceMetricsResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["PerformanceMetrics"] = ResolversParentTypes["PerformanceMetrics"],
> = ResolversObject<{
  bestPerformer?: Resolver<
    Maybe<ResolversTypes["TokenBreakdown"]>,
    ParentType,
    ContextType
  >;
  totalReturn?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  totalReturnPercent?: Resolver<
    ResolversTypes["Float"],
    ParentType,
    ContextType
  >;
  worstPerformer?: Resolver<
    Maybe<ResolversTypes["TokenBreakdown"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PortfolioResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["Portfolio"] = ResolversParentTypes["Portfolio"],
> = ResolversObject<{
  chainBreakdown?: Resolver<
    Array<ResolversTypes["ChainBreakdown"]>,
    ParentType,
    ContextType
  >;
  performanceMetrics?: Resolver<
    ResolversTypes["PerformanceMetrics"],
    ParentType,
    ContextType
  >;
  tokenBreakdown?: Resolver<
    Array<ResolversTypes["TokenBreakdown"]>,
    ParentType,
    ContextType
  >;
  totalValueChange24h?: Resolver<
    ResolversTypes["Float"],
    ParentType,
    ContextType
  >;
  totalValueChange24hPercent?: Resolver<
    ResolversTypes["Float"],
    ParentType,
    ContextType
  >;
  totalValueUSD?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  wallets?: Resolver<Array<ResolversTypes["Wallet"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PortfolioSnapshotResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["PortfolioSnapshot"] = ResolversParentTypes["PortfolioSnapshot"],
> = ResolversObject<{
  timestamp?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  totalValueUSD?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  walletSnapshots?: Resolver<
    Array<ResolversTypes["WalletSnapshot"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["Query"] = ResolversParentTypes["Query"],
> = ResolversObject<{
  defiPositions?: Resolver<
    Array<ResolversTypes["DeFiPosition"]>,
    ParentType,
    ContextType,
    RequireFields<QueryDefiPositionsArgs, "walletAddress">
  >;
  portfolio?: Resolver<
    ResolversTypes["Portfolio"],
    ParentType,
    ContextType,
    RequireFields<QueryPortfolioArgs, "walletAddresses">
  >;
  portfolioHistory?: Resolver<
    Array<ResolversTypes["PortfolioSnapshot"]>,
    ParentType,
    ContextType,
    RequireFields<
      QueryPortfolioHistoryArgs,
      "from" | "interval" | "to" | "walletAddresses"
    >
  >;
  token?: Resolver<
    Maybe<ResolversTypes["Token"]>,
    ParentType,
    ContextType,
    RequireFields<QueryTokenArgs, "id">
  >;
  tokenPrice?: Resolver<
    Maybe<ResolversTypes["TokenPrice"]>,
    ParentType,
    ContextType,
    RequireFields<QueryTokenPriceArgs, "currency" | "tokenId">
  >;
  tokenPriceHistory?: Resolver<
    Array<ResolversTypes["TokenPrice"]>,
    ParentType,
    ContextType,
    RequireFields<
      QueryTokenPriceHistoryArgs,
      "from" | "interval" | "to" | "tokenId"
    >
  >;
  tokens?: Resolver<
    Array<ResolversTypes["Token"]>,
    ParentType,
    ContextType,
    RequireFields<QueryTokensArgs, "limit">
  >;
  transactions?: Resolver<
    ResolversTypes["TransactionConnection"],
    ParentType,
    ContextType,
    RequireFields<
      QueryTransactionsArgs,
      "chain" | "limit" | "offset" | "walletAddress"
    >
  >;
  wallet?: Resolver<
    Maybe<ResolversTypes["Wallet"]>,
    ParentType,
    ContextType,
    RequireFields<QueryWalletArgs, "address" | "chain">
  >;
  wallets?: Resolver<
    ResolversTypes["WalletConnection"],
    ParentType,
    ContextType,
    RequireFields<QueryWalletsArgs, "limit" | "offset">
  >;
}>;

export type SubscriptionResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["Subscription"] = ResolversParentTypes["Subscription"],
> = ResolversObject<{
  portfolioValueChanged?: SubscriptionResolver<
    ResolversTypes["Portfolio"],
    "portfolioValueChanged",
    ParentType,
    ContextType,
    RequireFields<SubscriptionPortfolioValueChangedArgs, "walletAddresses">
  >;
  priceUpdates?: SubscriptionResolver<
    ResolversTypes["TokenPrice"],
    "priceUpdates",
    ParentType,
    ContextType,
    RequireFields<SubscriptionPriceUpdatesArgs, "tokenIds">
  >;
  walletActivity?: SubscriptionResolver<
    ResolversTypes["WalletEvent"],
    "walletActivity",
    ParentType,
    ContextType,
    RequireFields<SubscriptionWalletActivityArgs, "address" | "chain">
  >;
}>;

export type SyncResultResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["SyncResult"] = ResolversParentTypes["SyncResult"],
> = ResolversObject<{
  lastSyncedBlock?: Resolver<
    Maybe<ResolversTypes["BigInt"]>,
    ParentType,
    ContextType
  >;
  message?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  transactionsSynced?: Resolver<
    Maybe<ResolversTypes["Int"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TokenResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["Token"] = ResolversParentTypes["Token"],
> = ResolversObject<{
  chain?: Resolver<ResolversTypes["Chain"], ParentType, ContextType>;
  coingeckoId?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  contractAddress?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  currentPrice?: Resolver<
    Maybe<ResolversTypes["TokenPrice"]>,
    ParentType,
    ContextType
  >;
  decimals?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  logoUrl?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  marketCap?: Resolver<Maybe<ResolversTypes["Float"]>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  priceChange24h?: Resolver<
    Maybe<ResolversTypes["Float"]>,
    ParentType,
    ContextType
  >;
  priceHistory?: Resolver<
    Array<ResolversTypes["TokenPrice"]>,
    ParentType,
    ContextType,
    RequireFields<TokenPriceHistoryArgs, "from" | "interval" | "to">
  >;
  symbol?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  volume24h?: Resolver<Maybe<ResolversTypes["Float"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TokenBalanceResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["TokenBalance"] = ResolversParentTypes["TokenBalance"],
> = ResolversObject<{
  balance?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  balanceFormatted?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  token?: Resolver<ResolversTypes["Token"], ParentType, ContextType>;
  valueChange24h?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  valueUSD?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TokenBreakdownResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["TokenBreakdown"] = ResolversParentTypes["TokenBreakdown"],
> = ResolversObject<{
  percentage?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  token?: Resolver<ResolversTypes["Token"], ParentType, ContextType>;
  totalBalance?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  totalValueUSD?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  valueChange24h?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TokenPriceResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["TokenPrice"] = ResolversParentTypes["TokenPrice"],
> = ResolversObject<{
  priceBTC?: Resolver<Maybe<ResolversTypes["Float"]>, ParentType, ContextType>;
  priceETH?: Resolver<Maybe<ResolversTypes["Float"]>, ParentType, ContextType>;
  priceUSD?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  source?: Resolver<ResolversTypes["PriceSource"], ParentType, ContextType>;
  timestamp?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  tokenId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TokenTransferResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["TokenTransfer"] = ResolversParentTypes["TokenTransfer"],
> = ResolversObject<{
  amount?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  amountFormatted?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  from?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  to?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  token?: Resolver<ResolversTypes["Token"], ParentType, ContextType>;
  valueUSD?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TransactionResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["Transaction"] = ResolversParentTypes["Transaction"],
> = ResolversObject<{
  blockNumber?: Resolver<ResolversTypes["BigInt"], ParentType, ContextType>;
  chain?: Resolver<ResolversTypes["Chain"], ParentType, ContextType>;
  from?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  gasFeeUSD?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  gasPrice?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  gasUsed?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  hash?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  nftTransfers?: Resolver<
    Array<ResolversTypes["NFTTransfer"]>,
    ParentType,
    ContextType
  >;
  status?: Resolver<
    ResolversTypes["TransactionStatus"],
    ParentType,
    ContextType
  >;
  timestamp?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  to?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  token?: Resolver<Maybe<ResolversTypes["Token"]>, ParentType, ContextType>;
  tokenTransfers?: Resolver<
    Array<ResolversTypes["TokenTransfer"]>,
    ParentType,
    ContextType
  >;
  type?: Resolver<ResolversTypes["TransactionType"], ParentType, ContextType>;
  value?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TransactionConnectionResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["TransactionConnection"] = ResolversParentTypes["TransactionConnection"],
> = ResolversObject<{
  edges?: Resolver<
    Array<ResolversTypes["TransactionEdge"]>,
    ParentType,
    ContextType
  >;
  pageInfo?: Resolver<ResolversTypes["PageInfo"], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TransactionEdgeResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["TransactionEdge"] = ResolversParentTypes["TransactionEdge"],
> = ResolversObject<{
  cursor?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  node?: Resolver<ResolversTypes["Transaction"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type WalletResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["Wallet"] = ResolversParentTypes["Wallet"],
> = ResolversObject<{
  address?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  balance?: Resolver<ResolversTypes["WalletBalance"], ParentType, ContextType>;
  chain?: Resolver<ResolversTypes["Chain"], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  label?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  lastSyncedAt?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  nfts?: Resolver<Array<ResolversTypes["NFT"]>, ParentType, ContextType>;
  tokens?: Resolver<
    Array<ResolversTypes["TokenBalance"]>,
    ParentType,
    ContextType
  >;
  totalValueUSD?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  transactions?: Resolver<
    ResolversTypes["TransactionConnection"],
    ParentType,
    ContextType,
    RequireFields<WalletTransactionsArgs, "limit" | "offset">
  >;
  updatedAt?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type WalletBalanceResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["WalletBalance"] = ResolversParentTypes["WalletBalance"],
> = ResolversObject<{
  native?: Resolver<ResolversTypes["TokenBalance"], ParentType, ContextType>;
  tokens?: Resolver<
    Array<ResolversTypes["TokenBalance"]>,
    ParentType,
    ContextType
  >;
  totalValueUSD?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type WalletConnectionResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["WalletConnection"] = ResolversParentTypes["WalletConnection"],
> = ResolversObject<{
  edges?: Resolver<
    Array<ResolversTypes["WalletEdge"]>,
    ParentType,
    ContextType
  >;
  pageInfo?: Resolver<ResolversTypes["PageInfo"], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type WalletEdgeResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["WalletEdge"] = ResolversParentTypes["WalletEdge"],
> = ResolversObject<{
  cursor?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  node?: Resolver<ResolversTypes["Wallet"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type WalletEventResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["WalletEvent"] = ResolversParentTypes["WalletEvent"],
> = ResolversObject<{
  __resolveType: TypeResolveFn<
    "NFTTransfer" | "TokenTransfer" | "Transaction",
    ParentType,
    ContextType
  >;
}>;

export type WalletSnapshotResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["WalletSnapshot"] = ResolversParentTypes["WalletSnapshot"],
> = ResolversObject<{
  tokenBalances?: Resolver<ResolversTypes["JSON"], ParentType, ContextType>;
  valueUSD?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  walletId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = GraphQLContext> = ResolversObject<{
  BatchSyncResult?: BatchSyncResultResolvers<ContextType>;
  BigInt?: GraphQLScalarType;
  ChainBreakdown?: ChainBreakdownResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  DeFiPosition?: DeFiPositionResolvers<ContextType>;
  DeFiTokenAmount?: DeFiTokenAmountResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  Mutation?: MutationResolvers<ContextType>;
  NFT?: NftResolvers<ContextType>;
  NFTCollection?: NftCollectionResolvers<ContextType>;
  NFTTransfer?: NftTransferResolvers<ContextType>;
  PageInfo?: PageInfoResolvers<ContextType>;
  PerformanceMetrics?: PerformanceMetricsResolvers<ContextType>;
  Portfolio?: PortfolioResolvers<ContextType>;
  PortfolioSnapshot?: PortfolioSnapshotResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  SyncResult?: SyncResultResolvers<ContextType>;
  Token?: TokenResolvers<ContextType>;
  TokenBalance?: TokenBalanceResolvers<ContextType>;
  TokenBreakdown?: TokenBreakdownResolvers<ContextType>;
  TokenPrice?: TokenPriceResolvers<ContextType>;
  TokenTransfer?: TokenTransferResolvers<ContextType>;
  Transaction?: TransactionResolvers<ContextType>;
  TransactionConnection?: TransactionConnectionResolvers<ContextType>;
  TransactionEdge?: TransactionEdgeResolvers<ContextType>;
  Wallet?: WalletResolvers<ContextType>;
  WalletBalance?: WalletBalanceResolvers<ContextType>;
  WalletConnection?: WalletConnectionResolvers<ContextType>;
  WalletEdge?: WalletEdgeResolvers<ContextType>;
  WalletEvent?: WalletEventResolvers<ContextType>;
  WalletSnapshot?: WalletSnapshotResolvers<ContextType>;
}>;
