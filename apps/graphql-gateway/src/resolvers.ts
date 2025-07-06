import { addSpanEvent, withSpan } from "@crypto-tracker/telemetry";
import type { IResolvers } from "@graphql-tools/utils";
import type { GraphQLResolveInfo } from "graphql";
import { BigIntScalar, DateTimeScalar, JSONScalar } from "./scalars.js";
import type { GraphQLContext } from "./types.js";

// Define a union type for all possible parent types
type ResolverParent = Record<string, unknown> | null | undefined;

// Define proper resolver argument types
type ResolverArgs = Record<string, unknown>;

// Helper function to wrap resolvers with tracing
function traceResolver<T>(
  resolverName: string,
  resolver: (
    parent: ResolverParent,
    args: ResolverArgs,
    context: GraphQLContext,
    info: GraphQLResolveInfo,
  ) => Promise<T> | T,
) {
  return (
    parent: ResolverParent,
    args: ResolverArgs,
    context: GraphQLContext,
    info: GraphQLResolveInfo,
  ) => {
    const startTime = Date.now();

    return withSpan(
      context.tracer,
      `graphql.resolver.${resolverName}`,
      async (span) => {
        span.setAttributes({
          "graphql.field.name": info.fieldName,
          "graphql.type.name": info.parentType.name,
          "graphql.operation.type": info.operation.operation,
          "graphql.operation.name": info.operation.name?.value ?? "anonymous",
        });

        try {
          const result = await resolver(parent, args, context, info);

          addSpanEvent("resolver.completed", {
            "resolver.name": resolverName,
            "resolver.success": true,
          });

          // Record metrics
          const duration = Date.now() - startTime;
          context.metrics.recordResolverDuration(duration, info.fieldName, info.parentType.name);

          return result;
        } catch (error) {
          addSpanEvent("resolver.error", {
            "resolver.name": resolverName,
            "error.message": error instanceof Error ? error.message : "Unknown error",
          });

          // Record error metrics
          context.metrics.recordGraphQLError(
            error instanceof Error ? error.constructor.name : "UnknownError",
            info.operation.operation,
            info.operation.name?.value ?? null,
          );

          throw error;
        }
      },
      {
        attributes: {
          resolverName,
        },
      },
    );
  };
}

// Use IResolvers with proper parent type
export const resolvers: IResolvers<ResolverParent, GraphQLContext> = {
  Query: {
    wallet: traceResolver("Query.wallet", () => ({
      id: "1",
      address: "0x...",
      chain: "ETHEREUM",
    })),

    wallets: traceResolver("Query.wallets", () => ({
      edges: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
      totalCount: 0,
    })),

    portfolio: traceResolver("Query.portfolio", () => ({
      wallets: [],
      totalValueUSD: 0,
      totalValueChange24h: 0,
      totalValueChange24hPercent: 0,
      chainBreakdown: [],
      tokenBreakdown: [],
      performanceMetrics: {
        totalReturn: 0,
        totalReturnPercent: 0,
        bestPerformer: null,
        worstPerformer: null,
      },
    })),

    portfolioHistory: traceResolver("Query.portfolioHistory", () => []),
    token: traceResolver("Query.token", () => null),
    tokens: traceResolver("Query.tokens", () => []),
    tokenPrice: traceResolver("Query.tokenPrice", () => null),
    tokenPriceHistory: traceResolver("Query.tokenPriceHistory", () => []),

    transactions: traceResolver("Query.transactions", () => ({
      edges: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
      totalCount: 0,
    })),

    defiPositions: traceResolver("Query.defiPositions", () => []),
  },

  Mutation: {
    addWallet: traceResolver("Mutation.addWallet", () => ({
      id: "1",
      address: "0x...",
      chain: "ETHEREUM",
      label: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastSyncedAt: null,
      isActive: true,
    })),

    updateWallet: traceResolver("Mutation.updateWallet", () => ({
      id: "1",
      address: "0x...",
      chain: "ETHEREUM",
      label: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastSyncedAt: null,
      isActive: true,
    })),

    removeWallet: traceResolver("Mutation.removeWallet", () => true),

    syncWallet: traceResolver("Mutation.syncWallet", () => ({
      success: true,
      message: "Sync started",
      transactionsSynced: 0,
      lastSyncedBlock: "0",
    })),

    syncAllWallets: traceResolver("Mutation.syncAllWallets", () => ({
      totalWallets: 0,
      successCount: 0,
      failureCount: 0,
      results: [],
    })),
  },

  Subscription: {
    priceUpdates: {
      subscribe: () => {
        throw new Error("Subscriptions not implemented yet");
      },
    },
    walletActivity: {
      subscribe: () => {
        throw new Error("Subscriptions not implemented yet");
      },
    },
    portfolioValueChanged: {
      subscribe: () => {
        throw new Error("Subscriptions not implemented yet");
      },
    },
  },

  // Custom scalar resolvers
  DateTime: DateTimeScalar,
  BigInt: BigIntScalar,
  JSON: JSONScalar,
};
