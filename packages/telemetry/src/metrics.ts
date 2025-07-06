import type { Counter, Histogram, Meter, ObservableGauge } from "@opentelemetry/api";
import { ATTR_DB_OPERATION, ATTR_GRAPHQL_OPERATION_TYPE, ATTR_WALLET_CHAIN } from "./constants.js";

export class CryptoTrackerMetrics {
  // Counters
  private walletSyncCounter: Counter;
  private transactionProcessedCounter: Counter;
  private apiRequestCounter: Counter;
  private graphqlOperationCounter: Counter;
  private errorCounter: Counter;

  // Histograms
  private syncDurationHistogram: Histogram;
  private dbQueryDurationHistogram: Histogram;
  private externalApiDurationHistogram: Histogram;
  private transactionProcessingDurationHistogram: Histogram;

  // Gauges
  private activeWalletsGauge: ObservableGauge;
  private pendingTransactionsGauge: ObservableGauge;
  private cacheHitRatioGauge: ObservableGauge;

  constructor(meter: Meter) {
    // Initialize Counters
    this.walletSyncCounter = meter.createCounter("crypto_tracker.wallet_sync.total", {
      description: "Total number of wallet synchronizations",
      unit: "1",
    });

    this.transactionProcessedCounter = meter.createCounter("crypto_tracker.transaction.processed", {
      description: "Total number of transactions processed",
      unit: "1",
    });

    this.apiRequestCounter = meter.createCounter("crypto_tracker.api.requests", {
      description: "Total number of API requests",
      unit: "1",
    });

    this.graphqlOperationCounter = meter.createCounter("crypto_tracker.graphql.operations", {
      description: "Total number of GraphQL operations",
      unit: "1",
    });

    this.errorCounter = meter.createCounter("crypto_tracker.errors", {
      description: "Total number of errors",
      unit: "1",
    });

    // Initialize Histograms
    this.syncDurationHistogram = meter.createHistogram("crypto_tracker.wallet_sync.duration", {
      description: "Duration of wallet synchronization operations",
      unit: "ms",
    });

    this.dbQueryDurationHistogram = meter.createHistogram("crypto_tracker.db.query.duration", {
      description: "Duration of database queries",
      unit: "ms",
    });

    this.externalApiDurationHistogram = meter.createHistogram(
      "crypto_tracker.external_api.duration",
      {
        description: "Duration of external API calls",
        unit: "ms",
      },
    );

    this.transactionProcessingDurationHistogram = meter.createHistogram(
      "crypto_tracker.transaction.processing.duration",
      {
        description: "Duration of transaction processing",
        unit: "ms",
      },
    );

    // Initialize Observable Gauges
    this.activeWalletsGauge = meter.createObservableGauge("crypto_tracker.wallets.active", {
      description: "Number of active wallets being tracked",
      unit: "1",
    });

    this.pendingTransactionsGauge = meter.createObservableGauge(
      "crypto_tracker.transactions.pending",
      {
        description: "Number of pending transactions",
        unit: "1",
      },
    );

    this.cacheHitRatioGauge = meter.createObservableGauge("crypto_tracker.cache.hit_ratio", {
      description: "Cache hit ratio",
      unit: "1",
    });
  }

  // Counter methods
  public recordWalletSync(chain: string, success: boolean): void {
    this.walletSyncCounter.add(1, {
      [ATTR_WALLET_CHAIN]: chain,
      "sync.success": success,
    });
  }

  public recordTransactionProcessed(chain: string, type: string): void {
    this.transactionProcessedCounter.add(1, {
      [ATTR_WALLET_CHAIN]: chain,
      "transaction.type": type,
    });
  }

  public recordApiRequest(endpoint: string, method: string, statusCode: number): void {
    this.apiRequestCounter.add(1, {
      "http.route": endpoint,
      "http.method": method,
      "http.status_code": statusCode,
    });
  }

  public recordGraphQLOperation(
    operationType: string,
    operationName: string,
    success: boolean,
  ): void {
    this.graphqlOperationCounter.add(1, {
      [ATTR_GRAPHQL_OPERATION_TYPE]: operationType,
      "graphql.operation.name": operationName,
      "operation.success": success,
    });
  }

  public recordError(errorType: string, errorCode?: string): void {
    this.errorCounter.add(1, {
      "error.type": errorType,
      ...(errorCode && { "error.code": errorCode }),
    });
  }

  // Histogram methods
  public recordSyncDuration(duration: number, chain: string): void {
    this.syncDurationHistogram.record(duration, {
      [ATTR_WALLET_CHAIN]: chain,
    });
  }

  public recordDbQueryDuration(duration: number, operation: string, table: string): void {
    this.dbQueryDurationHistogram.record(duration, {
      [ATTR_DB_OPERATION]: operation,
      "db.table": table,
    });
  }

  public recordExternalApiDuration(duration: number, apiName: string, endpoint: string): void {
    this.externalApiDurationHistogram.record(duration, {
      "api.name": apiName,
      "api.endpoint": endpoint,
    });
  }

  public recordTransactionProcessingDuration(duration: number, chain: string): void {
    this.transactionProcessingDurationHistogram.record(duration, {
      [ATTR_WALLET_CHAIN]: chain,
    });
  }

  // Observable callback setters
  public setActiveWalletsCallback(callback: () => Promise<number>): void {
    this.activeWalletsGauge.addCallback(async (observableResult) => {
      const count = await callback();
      observableResult.observe(count);
    });
  }

  public setPendingTransactionsCallback(callback: () => Promise<number>): void {
    this.pendingTransactionsGauge.addCallback(async (observableResult) => {
      const count = await callback();
      observableResult.observe(count);
    });
  }

  public setCacheHitRatioCallback(callback: () => Promise<number>): void {
    this.cacheHitRatioGauge.addCallback(async (observableResult) => {
      const ratio = await callback();
      observableResult.observe(ratio);
    });
  }
}

// Helper function to measure async operation duration
export async function measureDuration<T>(
  operation: () => Promise<T>,
  recordDuration: (duration: number) => void,
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    recordDuration(duration);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    recordDuration(duration);
    throw error;
  }
}
