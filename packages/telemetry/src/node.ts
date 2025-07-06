import {
  ConsoleMetricExporter,
  type MetricReader,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import { NodeSDK, type NodeSDKConfiguration } from "@opentelemetry/sdk-node";
import { BatchSpanProcessor, ConsoleSpanExporter } from "@opentelemetry/sdk-trace-base";

import { metrics, trace } from "@opentelemetry/api";
import {
  DEFAULT_CONFIG,
  type TelemetryConfig,
  createMetricExporter,
  createResource,
  createTraceExporter,
  setDiagnosticsLogger,
} from "./config.js";
import { type InstrumentationConfig, getNodeInstrumentations } from "./instrumentations.js";

export interface TelemetrySDKConfig extends TelemetryConfig {
  instrumentations?: InstrumentationConfig;
  metricExportIntervalMillis?: number;
  spanExportTimeoutMillis?: number;
}

export class TelemetrySDK {
  private sdk: NodeSDK | null = null;
  private initialized = false;
  private config: TelemetrySDKConfig;

  constructor(config: TelemetrySDKConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  public start(): void {
    if (this.initialized) {
      console.warn("[OTEL] Telemetry SDK already initialized");
      return;
    }

    try {
      // Set diagnostics logger
      if (this.config.logLevel !== undefined) {
        setDiagnosticsLogger(this.config.logLevel);
      }

      const resource = createResource(this.config);

      // Setup trace exporter
      const traceExporter = this.config.enableConsoleExporter
        ? new ConsoleSpanExporter()
        : createTraceExporter(this.config);

      // Setup span processor
      const spanProcessor = new BatchSpanProcessor(traceExporter, {
        exportTimeoutMillis: this.config.spanExportTimeoutMillis ?? 30000,
      });

      // Setup metric reader
      let metricReader: MetricReader | undefined;

      if (this.config.enableConsoleExporter) {
        metricReader = new PeriodicExportingMetricReader({
          exporter: new ConsoleMetricExporter(),
          exportIntervalMillis: this.config.metricExportIntervalMillis ?? 30000,
        });
      } else {
        metricReader = new PeriodicExportingMetricReader({
          exporter: createMetricExporter(this.config),
          exportIntervalMillis: this.config.metricExportIntervalMillis ?? 30000,
        });
      }

      // Get instrumentations
      const instrumentations = getNodeInstrumentations(this.config.instrumentations);

      // Create SDK configuration using proper types
      const sdkConfig: Partial<NodeSDKConfiguration> = {
        resource,
        spanProcessors: [spanProcessor],
        instrumentations,
      };

      // Only add metricReader if it's defined
      if (metricReader) {
        sdkConfig.metricReader = metricReader;
      }

      // Create and configure SDK
      this.sdk = new NodeSDK(sdkConfig);

      // Start the SDK
      this.sdk.start();
      this.initialized = true;

      console.log(`[OTEL] Telemetry SDK initialized for ${this.config.serviceName}`);
    } catch (error) {
      console.error("[OTEL] Failed to initialize telemetry:", error);
      throw error;
    }
  }

  public async shutdown(): Promise<void> {
    if (!(this.initialized && this.sdk)) {
      return;
    }

    try {
      await this.sdk.shutdown();
      this.initialized = false;
      console.log("[OTEL] Telemetry SDK shut down successfully");
    } catch (error) {
      console.error("[OTEL] Error shutting down telemetry:", error);
      throw error;
    }
  }

  public getTracer(name?: string) {
    return trace.getTracer(name ?? this.config.serviceName, this.config.serviceVersion);
  }

  public getMeter(name?: string) {
    return metrics.getMeter(name ?? this.config.serviceName, this.config.serviceVersion);
  }
}

// Convenience function to initialize telemetry
export function initializeTelemetry(config: TelemetrySDKConfig): TelemetrySDK {
  const sdk = new TelemetrySDK(config);
  sdk.start();

  // Set up graceful shutdown
  const shutdownHandler = async () => {
    await sdk.shutdown();
  };

  process.on("SIGTERM", shutdownHandler);
  process.on("SIGINT", shutdownHandler);

  return sdk;
}
