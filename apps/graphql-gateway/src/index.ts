// This MUST be imported first to initialize OpenTelemetry before other modules
import "./telemetry.js";

import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { makeExecutableSchema } from "@graphql-tools/schema";
import type { Span } from "@opentelemetry/api";
import type { ExecutionResult } from "graphql";
import { type Plugin, createYoga } from "graphql-yoga";
import { GraphQLGatewayMetrics } from "./metrics.js";
import { resolvers } from "./resolvers.js";
import { meter, tracer } from "./telemetry.js";
import type { GraphQLContext } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize metrics
const metrics = new GraphQLGatewayMetrics(meter);

// Extend Request interface to include our span
interface RequestWithSpan extends Request {
  __otelSpan?: Span;
}

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

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Create telemetry plugin with proper typing
const telemetryPlugin: Plugin<GraphQLContext> = {
  onRequest({ request }) {
    // Store span in request for later use
    const span = tracer.startSpan("graphql.request", {
      attributes: {
        "http.method": request.method,
        "http.url": request.url,
        "http.user_agent": request.headers.get("user-agent") ?? undefined,
      },
    });

    (request as RequestWithSpan).__otelSpan = span;
  },

  onParse() {
    const span = tracer.startSpan("graphql.parse");

    return () => {
      span.end();
    };
  },

  onValidate() {
    const span = tracer.startSpan("graphql.validate");

    return () => {
      span.end();
    };
  },

  onExecute({ args }) {
    const operationType =
      args.document.definitions[0]?.kind === "OperationDefinition"
        ? args.document.definitions[0].operation
        : "unknown";

    const operationName =
      args.document.definitions[0]?.kind === "OperationDefinition" &&
      args.document.definitions[0].name
        ? args.document.definitions[0].name.value
        : null;

    const span = tracer.startSpan("graphql.execute", {
      attributes: {
        "request.id": args.contextValue.requestId,
        "graphql.operation.type": operationType,
        "graphql.operation.name": operationName ?? "anonymous",
      },
    });

    return {
      onExecuteDone({ result }) {
        const duration = Date.now() - args.contextValue.startTime;
        const execResult = result as ExecutionResult;
        const hasErrors = execResult.errors && execResult.errors.length > 0;

        // Record metrics
        metrics.recordGraphQLRequest(operationType, operationName, !hasErrors);
        metrics.recordGraphQLDuration(duration, operationType, operationName);

        if (hasErrors && execResult.errors) {
          for (const error of execResult.errors) {
            metrics.recordGraphQLError(
              (error.extensions?.["code"] as string) ?? "UNKNOWN_ERROR",
              operationType,
              operationName,
            );
          }
        }

        span.setAttributes({
          "graphql.errors.count": execResult.errors?.length ?? 0,
          "graphql.request.duration": duration,
        });

        span.end();
      },
    };
  },

  onResponse({ request, response }) {
    const requestWithSpan = request as RequestWithSpan;
    const span = requestWithSpan.__otelSpan;
    if (span) {
      span.setAttributes({
        "http.status_code": response.status,
        "response.size": Number.parseInt(response.headers.get("content-length") ?? "0", 10),
      });
      span.end();
    }
  },
};

const yoga = createYoga<GraphQLContext>({
  schema,
  context: (): GraphQLContext => {
    const requestId = randomUUID();
    const startTime = Date.now();

    return {
      requestId,
      tracer,
      meter,
      metrics,
      startTime,
    };
  },
  plugins: [telemetryPlugin],
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
  console.log("📊 Telemetry enabled - service: crypto-tracker-graphql-gateway");
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
  });
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
  });
});
