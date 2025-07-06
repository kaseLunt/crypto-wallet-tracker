// @ts-ignore
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Span } from "@opentelemetry/api";
import type { Instrumentation } from "@opentelemetry/instrumentation";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { GraphQLInstrumentation } from "@opentelemetry/instrumentation-graphql";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { PgInstrumentation } from "@opentelemetry/instrumentation-pg";
import { PinoInstrumentation } from "@opentelemetry/instrumentation-pino";
import { RedisInstrumentation } from "@opentelemetry/instrumentation-redis-4";
import { ATTR_HTTP_REQUEST_BODY_SIZE, ATTR_HTTP_RESPONSE_BODY_SIZE } from "./constants.js";

export interface InstrumentationConfig {
  http?: boolean;
  graphql?: boolean;
  express?: boolean;
  pino?: boolean;
  redis?: boolean;
  pg?: boolean;
}

const DEFAULT_INSTRUMENTATION_CONFIG: InstrumentationConfig = {
  http: true,
  graphql: true,
  express: true,
  pino: true,
  redis: true,
  pg: true,
};

// Type for HTTP response that can be either IncomingMessage or ServerResponse
type HttpResponse = IncomingMessage | ServerResponse;

// Helper function to extract headers from different response types
function getResponseHeaders(
  response: HttpResponse,
): Record<string, number | string | string[] | undefined> | undefined {
  // For client requests, response is IncomingMessage (`response.headers`)
  if ("headers" in response && response.headers) {
    return response.headers;
  }
  // For server requests, response is ServerResponse (`response.getHeaders()`)
  if ("getHeaders" in response) {
    return response.getHeaders();
  }
  return undefined;
}

// Helper function to parse content length and set span attributes
function setResponseBodySizeAttribute(
  span: Span,
  contentLength: number | string | string[] | undefined,
): void {
  if (!contentLength) {
    return;
  }

  // The header can be a string, number, or string[].
  // `parseInt` correctly parses the beginning of the string representation.
  const size = Number.parseInt(String(contentLength), 10);
  if (!Number.isNaN(size)) {
    span.setAttributes({
      [ATTR_HTTP_RESPONSE_BODY_SIZE]: size,
    });
  }
}

export function getNodeInstrumentations(
  config: InstrumentationConfig = DEFAULT_INSTRUMENTATION_CONFIG,
): Instrumentation[] {
  const instrumentations: Instrumentation[] = [];

  if (config.http) {
    instrumentations.push(
      new HttpInstrumentation({
        requestHook: (span, request) => {
          // Type guard to check if it's an incoming request or client request
          if ("headers" in request && request.headers) {
            const contentLength = request.headers["content-length"];
            if (contentLength) {
              span.setAttributes({
                [ATTR_HTTP_REQUEST_BODY_SIZE]: Number.parseInt(String(contentLength), 10),
              });
            }
          }
        },
        responseHook: (span, response) => {
          if (!response) {
            return;
          }

          const headers = getResponseHeaders(response);
          const contentLength = headers?.["content-length"];
          setResponseBodySizeAttribute(span, contentLength);
        },
        ignoreIncomingRequestHook: (request: IncomingMessage) => {
          // Ignore health checks and metrics endpoints
          const ignoredPaths = ["/health", "/metrics", "/ready", "/live"];
          const url = request.url ?? "";
          return ignoredPaths.some((path) => url.includes(path));
        },
      }),
    );
  }

  if (config.graphql) {
    instrumentations.push(
      new GraphQLInstrumentation({
        mergeItems: true,
        allowValues: true,
        depth: 2,
      }),
    );
  }

  if (config.express) {
    instrumentations.push(
      new ExpressInstrumentation({
        requestHook: (span, info) => {
          if (info.route) {
            span.setAttributes({
              "express.route": info.route,
            });
          }
          if (info.layerType) {
            span.setAttributes({
              "express.type": info.layerType,
            });
          }
        },
      }),
    );
  }

  if (config.pino) {
    instrumentations.push(
      new PinoInstrumentation({
        logHook: (span, record) => {
          span.addEvent("log", {
            "log.severity": record["level"],
            "log.message": record["msg"],
          });
        },
      }),
    );
  }

  if (config.redis) {
    instrumentations.push(
      new RedisInstrumentation({
        requireParentSpan: true,
        dbStatementSerializer: (cmdName, cmdArgs) => {
          // Sanitize sensitive data
          return `${cmdName} ${cmdArgs.length > 0 ? "[redacted]" : ""}`;
        },
      }),
    );
  }

  if (config.pg) {
    instrumentations.push(
      new PgInstrumentation({
        requireParentSpan: true,
        enhancedDatabaseReporting: true,
      }),
    );
  }

  return instrumentations;
}
