export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("[OTEL Server] Initializing server-side telemetry...");

    // Use explicit IP instead of localhost for Docker networking
    const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://127.0.0.1:4320";
    console.log("[OTEL Server] OTLP Endpoint:", otlpEndpoint);

    try {
      const { initializeTelemetry } = await import("@crypto-tracker/telemetry/node");

      const sdk = initializeTelemetry({
        serviceName: "crypto-tracker-web",
        serviceVersion: "0.0.1",
        environment: process.env.NODE_ENV ?? "development",
        otlpEndpoint: otlpEndpoint,
        enableConsoleExporter: false, // Turn off console to reduce noise
        instrumentations: {
          http: true,
          express: false,
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

      console.log("[OTEL Server] Telemetry initialized successfully");
      console.log("[OTEL Server] SDK:", sdk ? "Created" : "Failed");
    } catch (error) {
      console.error("[OTEL Server] Failed to initialize telemetry:", error);
    }
  }
}
