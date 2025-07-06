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

// Define constants locally instead of importing
const ATTR_DEPLOYMENT_ENVIRONMENT_NAME = "deployment.environment.name";
const ATTR_SERVICE_NAME = "service.name";
const ATTR_SERVICE_VERSION = "service.version";

// Move regex patterns to top level for performance
const LOCALHOST_REGEX = /localhost/;

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

    // Create and add span processor
    const spanProcessor = new BatchSpanProcessor(exporter);
    provider.addSpanProcessor(spanProcessor);

    // Register provider with propagator
    provider.register({
      propagator: new CompositePropagator({
        propagators: [new W3CTraceContextPropagator(), new W3CBaggagePropagator()],
      }),
    });

    // Set up context manager
    const contextManager = new ZoneContextManager();
    context.setGlobalContextManager(contextManager);

    // Create CORS URL patterns (endpoint-specific regex created here to avoid recreating constantly)
    const endpointRegex = new RegExp(config.otlpEndpoint);
    const corsUrls = [endpointRegex, LOCALHOST_REGEX];

    // Register instrumentations
    registerInstrumentations({
      instrumentations: [
        new DocumentLoadInstrumentation(),
        new UserInteractionInstrumentation({
          eventNames: ["click", "submit", "keydown"],
        }),
        new FetchInstrumentation({
          propagateTraceHeaderCorsUrls: corsUrls,
          clearTimingResources: true,
        }),
        new XMLHttpRequestInstrumentation({
          propagateTraceHeaderCorsUrls: corsUrls,
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

// Helper function to create spans in browser
export function withBrowserSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T> | T,
  attributes?: Record<string, string | number | boolean>,
): Promise<T> {
  const tracer = getBrowserTracer();

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
