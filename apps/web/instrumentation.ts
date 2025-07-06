import { initializeTelemetry } from "@crypto-tracker/telemetry/node";

export function register() {
  // Only initialize on server-side
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("[OTEL Server] Initializing server-side telemetry...");

    initializeTelemetry({
      serviceName: "crypto-tracker-web",
      serviceVersion: "0.0.1",
      environment: process.env.NODE_ENV ?? "development",
      otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318",
      enableConsoleExporter: process.env.NODE_ENV === "development",
      instrumentations: {
        http: true,
        express: false, // Next.js doesn't use Express
        graphql: false,
        pino: false,
        redis: false,
        pg: false,
      },
      attributes: {
        "service.type": "web-app",
        "service.layer": "frontend",
      },
    });
  }
}
