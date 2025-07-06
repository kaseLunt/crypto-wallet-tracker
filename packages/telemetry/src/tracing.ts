import {
  type AttributeValue,
  type Attributes,
  type Span,
  type SpanOptions,
  SpanStatusCode,
  type Tracer,
  context,
  trace,
} from "@opentelemetry/api";
import {
  ATTR_BLOCK_NUMBER,
  ATTR_TRANSACTION_HASH,
  ATTR_WALLET_ADDRESS,
  ATTR_WALLET_CHAIN,
} from "./constants.js";

export interface CryptoSpanAttributes {
  walletAddress?: string;
  chain?: string;
  transactionHash?: string;
  blockNumber?: string | number;
  [key: string]: AttributeValue;
}

function isValidAttributeValue(value: unknown): value is AttributeValue {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    (Array.isArray(value) &&
      value.every((v) => typeof v === "string" || typeof v === "number" || typeof v === "boolean"))
  );
}

export function createCryptoSpan(
  tracer: Tracer,
  name: string,
  options: SpanOptions & { attributes?: CryptoSpanAttributes } = {},
): Span {
  const { attributes = {}, ...spanOptions } = options;

  // Map crypto attributes to OpenTelemetry attributes
  const otelAttributes: Attributes = {};

  if (attributes.walletAddress) {
    otelAttributes[ATTR_WALLET_ADDRESS] = attributes.walletAddress;
  }
  if (attributes.chain) {
    otelAttributes[ATTR_WALLET_CHAIN] = attributes.chain;
  }
  if (attributes.transactionHash) {
    otelAttributes[ATTR_TRANSACTION_HASH] = attributes.transactionHash;
  }
  if (attributes.blockNumber) {
    otelAttributes[ATTR_BLOCK_NUMBER] = String(attributes.blockNumber);
  }

  // Add any other custom attributes
  for (const [key, value] of Object.entries(attributes)) {
    if (!["walletAddress", "chain", "transactionHash", "blockNumber"].includes(key)) {
      if (isValidAttributeValue(value)) {
        otelAttributes[key] = value;
      }
    }
  }

  return tracer.startSpan(name, {
    ...spanOptions,
    attributes: otelAttributes,
  });
}

export async function withSpan<T>(
  tracer: Tracer,
  name: string,
  fn: (span: Span) => Promise<T>,
  options?: SpanOptions & { attributes?: CryptoSpanAttributes },
): Promise<T> {
  const span = createCryptoSpan(tracer, name, options);
  const ctx = trace.setSpan(context.active(), span);

  try {
    const result = await context.with(ctx, () => fn(span));
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  } finally {
    span.end();
  }
}

export function withSyncSpan<T>(
  tracer: Tracer,
  name: string,
  fn: (span: Span) => T,
  options?: SpanOptions & { attributes?: CryptoSpanAttributes },
): T {
  const span = createCryptoSpan(tracer, name, options);
  const ctx = trace.setSpan(context.active(), span);

  try {
    const result = context.with(ctx, () => fn(span));
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  } finally {
    span.end();
  }
}

// Interface for objects that might have a tracer
interface TracerProvider {
  tracer?: Tracer;
}

// Decorator for tracing class methods
export function Trace(spanName?: string) {
  // Converted to an arrow function as recommended by the linter.
  return (
    target: object,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor => {
    const originalMethod = descriptor.value;

    if (typeof originalMethod !== "function") {
      return descriptor;
    }

    descriptor.value = function (this: TracerProvider, ...args: unknown[]) {
      const className = target.constructor.name;
      const name = spanName ?? `${className}.${propertyName}`;

      const tracer: Tracer = this.tracer ?? trace.getTracer(className);

      return withSpan(tracer, name, async () => {
        return await originalMethod.apply(this, args);
      });
    };

    return descriptor;
  };
}

// Helper to add event to current span
export function addSpanEvent(name: string, attributes?: Attributes): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

// Helper to set attributes on current span
export function setSpanAttributes(attributes: Attributes): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttributes(attributes);
  }
}

// Helper to safely convert unknown values to attributes
export function toAttributes(obj: Record<string, unknown>): Attributes {
  const attributes: Attributes = {};

  for (const [key, value] of Object.entries(obj)) {
    if (isValidAttributeValue(value)) {
      attributes[key] = value;
    } else if (value !== null && value !== undefined) {
      // Convert complex objects to strings
      attributes[key] = String(value);
    }
  }

  return attributes;
}
