// FILE: packages/telemetry/src/browser.ts
import { type Span, type Tracer, context, trace } from "@opentelemetry/api";
import { ZoneContextManager } from "@opentelemetry/context-zone";
import {
  CompositePropagator,
  W3CBaggagePropagator,
  W3CTraceContextPropagator,
} from "@opentelemetry/core";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { DocumentLoadInstrumentation } from "@opentelemetry/instrumentation-document-load";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
import { UserInteractionInstrumentation } from "@opentelemetry/instrumentation-user-interaction";
import { XMLHttpRequestInstrumentation } from "@opentelemetry/instrumentation-xml-http-request";
import { Resource } from "@opentelemetry/resources";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import {
  ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "./constants.js";

export interface BrowserTelemetryConfig {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  otlpEndpoint: string;
  enableConsoleExporter?: boolean;
  attributes?: Record<string, string>;
}

let provider: WebTracerProvider | undefined;
let isInitialized = false;

// Fixed type guard for browser environment
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function initializeBrowserTelemetry(config: BrowserTelemetryConfig): void {
  // Only initialize in browser environment
  if (!isBrowser() || isInitialized) {
    return;
  }

  try {
    // Create resource
    const resource = new Resource({
      [ATTR_SERVICE_NAME]: config.serviceName,
      [ATTR_SERVICE_VERSION]: config.serviceVersion,
      [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: config.environment,
      ...config.attributes,
    });

    // Create tracer provider
    provider = new WebTracerProvider({
      resource,
    });

    // Create exporter
    const exporter = new OTLPTraceExporter({
      url: `${config.otlpEndpoint}/v1/traces`,
      headers: {},
    });

    // Create and add span processor (fixed - use addSpanProcessor)
    const spanProcessor = new BatchSpanProcessor(exporter);
    provider.addSpanProcessor(spanProcessor);

    // Register provider with propagator only (fixed - removed spanProcessor)
    provider.register({
      propagator: new CompositePropagator({
        propagators: [new W3CTraceContextPropagator(), new W3CBaggagePropagator()],
      }),
    });

    // Set up context manager
    const contextManager = new ZoneContextManager();
    context.setGlobalContextManager(contextManager);

    // Register instrumentations (fixed - removed requestHook)
    registerInstrumentations({
      instrumentations: [
        new DocumentLoadInstrumentation(),
        new UserInteractionInstrumentation({
          eventNames: ["click", "submit", "keydown"],
        }),
        new FetchInstrumentation({
          propagateTraceHeaderCorsUrls: [new RegExp(config.otlpEndpoint), /localhost/],
          clearTimingResources: true,
          // Removed requestHook as it doesn't exist in the type
        }),
        new XMLHttpRequestInstrumentation({
          propagateTraceHeaderCorsUrls: [new RegExp(config.otlpEndpoint), /localhost/],
        }),
      ],
    });

    isInitialized = true;
    console.log(`[OTEL Browser] Initialized telemetry for ${config.serviceName}`);
  } catch (error) {
    console.error("[OTEL Browser] Failed to initialize telemetry:", error);
  }
}

export function getBrowserTracer(name?: string): Tracer {
  if (!provider) {
    // Return a no-op tracer if not initialized
    return trace.getTracer(name ?? "browser-tracer");
  }
  return provider.getTracer(name ?? "browser-tracer");
}

// Cleanup function
export function shutdownBrowserTelemetry(): Promise<void> {
  if (provider) {
    return provider.shutdown();
  }
  return Promise.resolve();
}

// Helper function to create spans in browser (fixed attributes type)
export function withBrowserSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T> | T,
  attributes?: Record<string, string | number | boolean>,
): Promise<T> {
  const tracer = getBrowserTracer();

  // Fixed: Handle undefined attributes properly
  const spanOptions = attributes ? { attributes } : {};
  const span = tracer.startSpan(name, spanOptions);

  return context.with(trace.setSpan(context.active(), span), async () => {
    try {
      const result = await fn(span);
      span.setStatus({ code: 1 }); // OK
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message }); // ERROR
      throw error;
    } finally {
      span.end();
    }
  });
}
