/**
 * OpenTelemetry Semantic Convention Attributes
 * Based on the latest OpenTelemetry semantic conventions
 */

// Service attributes
export const ATTR_SERVICE_NAME = "service.name";
export const ATTR_SERVICE_VERSION = "service.version";
export const ATTR_SERVICE_INSTANCE_ID = "service.instance.id";

// Deployment attributes
export const ATTR_DEPLOYMENT_ENVIRONMENT_NAME = "deployment.environment.name";

// Host attributes
export const ATTR_HOST_NAME = "host.name";
export const ATTR_HOST_TYPE = "host.type";
export const ATTR_HOST_ARCH = "host.arch";

// Process attributes
export const ATTR_PROCESS_PID = "process.pid";
export const ATTR_PROCESS_EXECUTABLE_NAME = "process.executable.name";
export const ATTR_PROCESS_RUNTIME_NAME = "process.runtime.name";
export const ATTR_PROCESS_RUNTIME_VERSION = "process.runtime.version";

// HTTP attributes
export const ATTR_HTTP_REQUEST_METHOD = "http.request.method";
export const ATTR_HTTP_REQUEST_BODY_SIZE = "http.request.body.size";
export const ATTR_HTTP_RESPONSE_STATUS_CODE = "http.response.status_code";
export const ATTR_HTTP_RESPONSE_BODY_SIZE = "http.response.body.size";
export const ATTR_HTTP_ROUTE = "http.route";

// Database attributes
export const ATTR_DB_SYSTEM = "db.system";
export const ATTR_DB_NAME = "db.name";
export const ATTR_DB_OPERATION = "db.operation";
export const ATTR_DB_STATEMENT = "db.statement";

// GraphQL attributes
export const ATTR_GRAPHQL_OPERATION_NAME = "graphql.operation.name";
export const ATTR_GRAPHQL_OPERATION_TYPE = "graphql.operation.type";
export const ATTR_GRAPHQL_DOCUMENT = "graphql.document";

// Custom attributes for our application
export const ATTR_WALLET_ADDRESS = "crypto.wallet.address";
export const ATTR_WALLET_CHAIN = "crypto.wallet.chain";
export const ATTR_TRANSACTION_HASH = "crypto.transaction.hash";
export const ATTR_BLOCK_NUMBER = "crypto.block.number";
