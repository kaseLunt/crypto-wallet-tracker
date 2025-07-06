import { CryptoTrackerMetrics } from "./metrics.js";
import { initializeTelemetry } from "./node.js";
import { addSpanEvent, withSpan } from "./tracing.js";

async function testTelemetry() {
  console.log("🧪 Testing telemetry configuration...");

  const telemetry = await initializeTelemetry({
    serviceName: "crypto-tracker-test",
    serviceVersion: "1.0.0",
    environment: "test",
    enableConsoleExporter: true,
  });

  const tracer = telemetry.getTracer();
  const meter = telemetry.getMeter();
  const metrics = new CryptoTrackerMetrics(meter);

  // Test tracing
  await withSpan(
    tracer,
    "test-operation",
    async (span) => {
      span.setAttributes({
        "test.attribute": "value",
      });

      addSpanEvent("test-event", { "event.data": "test" });

      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log("✓ Span created successfully");
    },
    {
      attributes: {
        walletAddress: "0x123...",
        chain: "ethereum",
      },
    },
  );

  // Test metrics
  metrics.recordWalletSync("ethereum", true);
  metrics.recordTransactionProcessed("ethereum", "transfer");
  metrics.recordSyncDuration(150, "ethereum");

  console.log("✓ Metrics recorded successfully");

  // Shutdown
  await telemetry.shutdown();
  console.log("✓ Telemetry test completed");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testTelemetry().catch(console.error);
}
