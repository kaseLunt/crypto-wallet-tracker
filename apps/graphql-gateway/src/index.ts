import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { makeExecutableSchema } from "@graphql-tools/schema";
import type { IResolvers } from "@graphql-tools/utils";
import { createYoga } from "graphql-yoga";
import { BigIntScalar, DateTimeScalar, JSONScalar } from "./scalars.js";
import type { GraphQLContext } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Define a union type for all possible parent types
type ResolverParent = Record<string, unknown> | null | undefined;

// Load schema files
const typeDefs = [
  readFileSync(join(__dirname, "schema/types/common.graphql"), "utf-8"),
  readFileSync(join(__dirname, "schema/schema.graphql"), "utf-8"),
  readFileSync(join(__dirname, "schema/types/wallet.graphql"), "utf-8"),
  readFileSync(join(__dirname, "schema/types/token.graphql"), "utf-8"),
  readFileSync(join(__dirname, "schema/types/transaction.graphql"), "utf-8"),
  readFileSync(join(__dirname, "schema/types/portfolio.graphql"), "utf-8"),
  readFileSync(join(__dirname, "schema/types/defi.graphql"), "utf-8"),
].join("\n\n");

// Use IResolvers with proper parent type
const resolvers: IResolvers<ResolverParent, GraphQLContext> = {
  Query: {
    wallet: () => ({ id: "1", address: "0x...", chain: "ETHEREUM" }),
    wallets: () => ({
      edges: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
      totalCount: 0,
    }),
    portfolio: () => ({
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
    }),
    portfolioHistory: () => [],
    token: () => null,
    tokens: () => [],
    tokenPrice: () => null,
    tokenPriceHistory: () => [],
    transactions: () => ({
      edges: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
      totalCount: 0,
    }),
    defiPositions: () => [],
  },
  Mutation: {
    addWallet: () => ({
      id: "1",
      address: "0x...",
      chain: "ETHEREUM",
      label: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastSyncedAt: null,
      isActive: true,
    }),
    updateWallet: () => ({
      id: "1",
      address: "0x...",
      chain: "ETHEREUM",
      label: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastSyncedAt: null,
      isActive: true,
    }),
    removeWallet: () => true,
    syncWallet: () => ({
      success: true,
      message: "Sync started",
      transactionsSynced: 0,
      lastSyncedBlock: "0",
    }),
    syncAllWallets: () => ({
      totalWallets: 0,
      successCount: 0,
      failureCount: 0,
      results: [],
    }),
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

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const yoga = createYoga({
  schema,
  cors: {
    origin: process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000",
    credentials: true,
  },
  graphiql: {
    title: "Crypto Tracker GraphQL",
    defaultQuery: `# Welcome to Crypto Tracker GraphQL
# Try running this query:

query GetWallet {
  wallet(address: "0x123", chain: ETHEREUM) {
    id
    address
    chain
  }
}
`,
  },
  maskedErrors: process.env["NODE_ENV"] === "production",
});

const server = createServer(yoga);

const port = process.env["PORT"] ?? 4000;

server.listen(Number(port), () => {
  console.log(`🚀 GraphQL server running at http://localhost:${port}/graphql`);
});
