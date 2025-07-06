// This file MUST be imported first to initialize OpenTelemetry before other modules
import { initializeTelemetry } from "@crypto-tracker/telemetry/node";

// Initialize telemetry for the GraphQL Gateway
export const telemetry = initializeTelemetry({
  serviceName: "crypto-tracker-graphql-gateway",
  serviceVersion: "0.0.1",
  environment: process.env["NODE_ENV"] ?? "development",
  // Send traces directly to Jaeger's OTLP endpoint
  enableConsoleExporter: process.env["NODE_ENV"] === "development",
  otlpEndpoint: process.env["OTEL_EXPORTER_OTLP_ENDPOINT"] ?? "http://localhost:4318",
  instrumentations: {
    http: true,
    graphql: false, // Disable to avoid the warning - we have custom tracing
    express: false, // We're using GraphQL Yoga, not Express
    pino: false,
    redis: false,
    pg: false,
  },
  attributes: {
    "service.type": "graphql-gateway",
    "service.layer": "api",
  },
});

// Export tracer and meter instances
export const tracer = telemetry.getTracer();
export const meter = telemetry.getMeter();
