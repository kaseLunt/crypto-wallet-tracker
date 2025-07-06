import { hostname } from "node:os";
import { type Attributes, DiagLogLevel, diag } from "@opentelemetry/api";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import {
  ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
  ATTR_HOST_NAME,
  ATTR_SERVICE_INSTANCE_ID,
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "./constants.js";

export interface TelemetryConfig {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  otlpEndpoint?: string;
  otlpHeaders?: Record<string, string>;
  enableConsoleExporter?: boolean;
  logLevel?: DiagLogLevel;
  attributes?: Attributes;
}

export const DEFAULT_CONFIG: Partial<TelemetryConfig> = {
  environment: process.env["NODE_ENV"] ?? "development",
  otlpEndpoint: process.env["OTEL_EXPORTER_OTLP_ENDPOINT"] ?? "http://localhost:4318",
  enableConsoleExporter: process.env["NODE_ENV"] === "development",
  logLevel: DiagLogLevel.INFO,
};

export function createResource(config: TelemetryConfig): Resource {
  const attributes: Attributes = {
    [ATTR_SERVICE_NAME]: config.serviceName,
    [ATTR_SERVICE_VERSION]: config.serviceVersion,
    [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: config.environment,
    [ATTR_SERVICE_INSTANCE_ID]: `${config.serviceName}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    [ATTR_HOST_NAME]: hostname(),
    ...config.attributes,
  };

  return new Resource(attributes);
}

export function createTraceExporter(config: TelemetryConfig): OTLPTraceExporter {
  const exporterConfig = {
    url: `${config.otlpEndpoint}/v1/traces`,
    timeoutMillis: 5000,
  };

  // Only add headers if they are defined
  if (config.otlpHeaders) {
    Object.assign(exporterConfig, { headers: config.otlpHeaders });
  }

  return new OTLPTraceExporter(exporterConfig);
}

export function createMetricExporter(config: TelemetryConfig): OTLPMetricExporter {
  const exporterConfig = {
    url: `${config.otlpEndpoint}/v1/metrics`,
    timeoutMillis: 5000,
  };

  // Only add headers if they are defined
  if (config.otlpHeaders) {
    Object.assign(exporterConfig, { headers: config.otlpHeaders });
  }

  return new OTLPMetricExporter(exporterConfig);
}

export function setDiagnosticsLogger(level: DiagLogLevel = DiagLogLevel.INFO): void {
  diag.setLogger(
    {
      verbose: (message, ...args) => console.debug("[OTEL VERBOSE]", message, ...args),
      debug: (message, ...args) => console.debug("[OTEL DEBUG]", message, ...args),
      info: (message, ...args) => console.info("[OTEL INFO]", message, ...args),
      warn: (message, ...args) => console.warn("[OTEL WARN]", message, ...args),
      error: (message, ...args) => console.error("[OTEL ERROR]", message, ...args),
    },
    level,
  );
}
