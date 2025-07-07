"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

interface TelemetryProviderProps {
  children: ReactNode;
}

export function TelemetryProvider({ children }: TelemetryProviderProps) {
  useEffect(() => {
    // Only initialize in browser environment
    if (typeof window === "undefined") {
      return;
    }

    // Dynamic import to avoid bundling issues
    const initTelemetry = async () => {
      try {
        const telemetryModule = await import("@crypto-tracker/telemetry/browser");

        // Initialize browser telemetry - no need to extract the function
        telemetryModule.initializeBrowserTelemetry({
          serviceName: "crypto-tracker-web-client",
          serviceVersion: "0.0.1",
          environment: process.env.NODE_ENV ?? "development",
          otlpEndpoint:
            process.env.NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318",
          enableConsoleExporter: process.env.NODE_ENV === "development",
          attributes: {
            "service.type": "web-client",
            "service.layer": "frontend",
          },
        });

        console.log("[OTEL Browser] Telemetry initialized successfully");
      } catch (error) {
        console.error("[OTEL Browser] Failed to initialize telemetry:", error);
      }
    };

    initTelemetry();
  }, []);

  return <>{children}</>;
}
