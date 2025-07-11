package indexer

import (
    "github.com/kelseyhightower/envconfig"
)

type Config struct {
    // Service
    ServiceName    string `envconfig:"SERVICE_NAME" default:"crypto-tracker-indexer"`
    Environment    string `envconfig:"ENVIRONMENT" default:"development"`
    Port           int    `envconfig:"PORT" default:"8081"`
    GRPCPort       int    `envconfig:"GRPC_PORT" default:"50051"`

    // Database
    DatabaseURL    string `envconfig:"DATABASE_URL" required:"true"`

    // NATS
    NATSUrl        string `envconfig:"NATS_URL" default:"nats://localhost:4222"`

    // Blockchain RPC
    EthereumRPC    string `envconfig:"ETHEREUM_RPC_URL" required:"true"`
    PolygonRPC     string `envconfig:"POLYGON_RPC_URL"`
    ArbitrumRPC    string `envconfig:"ARBITRUM_RPC_URL"`
    BaseRPC        string `envconfig:"BASE_RPC_URL"`

    // Observability
    OTLPEndpoint   string `envconfig:"OTEL_EXPORTER_OTLP_ENDPOINT" default:"http://localhost:4318"`

    // Indexing
    BlockBatchSize int    `envconfig:"BLOCK_BATCH_SIZE" default:"100"`
    WorkerCount    int    `envconfig:"WORKER_COUNT" default:"4"`
}

func LoadConfig() (*Config, error) {
    var cfg Config
    err := envconfig.Process("", &cfg)
    return &cfg, err
}