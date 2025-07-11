module github.com/crypto-tracker/indexer

go 1.22

require (
	github.com/ethereum/go-ethereum v1.14.7
	github.com/google/uuid v1.6.0
	github.com/jackc/pgx/v5 v5.6.0
	github.com/kelseyhightower/envconfig v1.4.0
	github.com/nats-io/nats.go v1.36.0
	go.opentelemetry.io/otel v1.28.0
	go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc v1.28.0
	go.opentelemetry.io/otel/sdk v1.28.0
)

replace github.com/crypto-tracker/indexer => ./
