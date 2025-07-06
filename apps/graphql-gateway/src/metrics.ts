import { CryptoTrackerMetrics, type Meter } from "@crypto-tracker/telemetry";

export class GraphQLGatewayMetrics extends CryptoTrackerMetrics {
  // GraphQL-specific metrics
  private graphqlRequestsTotal;
  private graphqlRequestDuration;
  private graphqlErrorsTotal;
  private resolverDuration;

  constructor(meter: Meter) {
    super(meter);

    this.graphqlRequestsTotal = meter.createCounter("graphql.requests.total", {
      description: "Total number of GraphQL requests",
      unit: "1",
    });

    this.graphqlRequestDuration = meter.createHistogram("graphql.request.duration", {
      description: "GraphQL request duration",
      unit: "ms",
    });

    this.graphqlErrorsTotal = meter.createCounter("graphql.errors.total", {
      description: "Total number of GraphQL errors",
      unit: "1",
    });

    this.resolverDuration = meter.createHistogram("graphql.resolver.duration", {
      description: "GraphQL resolver execution duration",
      unit: "ms",
    });
  }

  recordGraphQLRequest(operationType: string, operationName: string | null, success: boolean) {
    this.graphqlRequestsTotal.add(1, {
      "graphql.operation.type": operationType,
      "graphql.operation.name": operationName ?? "anonymous",
      "request.success": success,
    });
  }

  recordGraphQLDuration(duration: number, operationType: string, operationName: string | null) {
    this.graphqlRequestDuration.record(duration, {
      "graphql.operation.type": operationType,
      "graphql.operation.name": operationName ?? "anonymous",
    });
  }

  recordGraphQLError(errorType: string, operationType: string, operationName: string | null) {
    this.graphqlErrorsTotal.add(1, {
      "error.type": errorType,
      "graphql.operation.type": operationType,
      "graphql.operation.name": operationName ?? "anonymous",
    });
  }

  recordResolverDuration(duration: number, fieldName: string, typeName: string) {
    this.resolverDuration.record(duration, {
      "graphql.field.name": fieldName,
      "graphql.type.name": typeName,
    });
  }
}
