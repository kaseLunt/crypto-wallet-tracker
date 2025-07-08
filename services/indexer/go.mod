module github.com/crypto-tracker/indexer

go 1.22

require (
    github.com/ethereum/go-ethereum v1.14.7
    github.com/jackc/pgx/v5 v5.6.0
    github.com/nats-io/nats.go v1.36.0
    google.golang.org/grpc v1.65.0
    google.golang.org/protobuf v1.34.2
    go.opentelemetry.io/otel v1.28.0
    go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc v1.28.0
    github.com/prometheus/client_golang v1.19.1
    github.com/kelseyhightower/envconfig v1.4.0
    go.uber.org/zap v1.27.0
)