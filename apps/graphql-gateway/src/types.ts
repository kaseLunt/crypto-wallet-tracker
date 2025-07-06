import type { Meter, Tracer } from "@crypto-tracker/telemetry";
import type { GraphQLFieldResolver, GraphQLScalarType } from "graphql";
import type { GraphQLGatewayMetrics } from "./metrics.js";

export interface GraphQLContext {
  requestId: string;
  tracer: Tracer;
  meter: Meter;
  metrics: GraphQLGatewayMetrics;
  startTime: number;
}

export type Resolver<TResult = unknown, TParent = unknown> = GraphQLFieldResolver<
  TParent,
  GraphQLContext,
  Record<string, unknown>,
  TResult
>;

export interface QueryResolvers {
  wallet: Resolver;
  wallets: Resolver;
  portfolio: Resolver;
  portfolioHistory: Resolver;
  token: Resolver;
  tokens: Resolver;
  tokenPrice: Resolver;
  tokenPriceHistory: Resolver;
  transactions: Resolver;
  defiPositions: Resolver;
}

export interface MutationResolvers {
  addWallet: Resolver;
  updateWallet: Resolver;
  removeWallet: Resolver;
  syncWallet: Resolver;
  syncAllWallets: Resolver;
}

export interface SubscriptionResolvers {
  priceUpdates: { subscribe: Resolver };
  walletActivity: { subscribe: Resolver };
  portfolioValueChanged: { subscribe: Resolver };
}

export interface Resolvers {
  Query: QueryResolvers;
  Mutation: MutationResolvers;
  Subscription: SubscriptionResolvers;
  DateTime: GraphQLScalarType;
  BigInt: GraphQLScalarType;
  JSON: GraphQLScalarType;
}
