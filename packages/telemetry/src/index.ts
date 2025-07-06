// Main exports
export * from "./config.js";
export * from "./constants.js";
export * from "./instrumentations.js";
export * from "./node.js";
export * from "./metrics.js";
export * from "./tracing.js";

// Re-export commonly used OpenTelemetry APIs
export {
  trace,
  context,
  propagation,
  metrics,
  SpanKind,
  SpanStatusCode,
  TraceFlags,
  type Span,
  type Tracer,
  type Meter,
  type Counter,
  type Histogram,
  type ObservableGauge,
} from "@opentelemetry/api";
