// Path: services/indexer/cmd/indexer/main.go
package main

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/crypto-tracker/indexer/internal/events"
	"github.com/crypto-tracker/indexer/internal/indexer"
	"github.com/crypto-tracker/indexer/internal/telemetry"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nats-io/nats.go"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
)

// ... (main function code)
func main() {
	cfg, err := LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	tp, err := telemetry.InitTracer(context.Background(), cfg.ServiceName, cfg.OTLPEndpoint)
	if err != nil {
		log.Fatalf("Failed to init tracer: %v", err)
	}
	defer func() { _ = tp.Shutdown(context.Background()) }()
	tracer := otel.Tracer("indexer.main")

	nc, err := nats.Connect(cfg.NATSUrl)
	if err != nil {
		log.Fatalf("Failed to connect to NATS: %v", err)
	}
	defer nc.Close()

	dbpool, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer dbpool.Close()

	ethIndexer, err := indexer.NewEthereumIndexer(cfg.EthereumRPC)
	if err != nil {
		log.Fatalf("Failed to create Ethereum indexer: %v", err)
	}

	log.Println("🚀 Starting indexer...")
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		ctx, span := tracer.Start(context.Background(), "sync-cycle")

		latestChainBlock, err := ethIndexer.GetLatestBlock(ctx)
		if err != nil {
			log.Printf("ERROR: could not get latest block: %v", err)
			span.End()
			continue
		}

		var lastSyncedBlock int64
		err = dbpool.QueryRow(ctx, "SELECT COALESCE(MAX(block_number), 0) FROM crypto.transactions WHERE chain = 'ETHEREUM'").Scan(&lastSyncedBlock)
		if err != nil {
			log.Printf("ERROR: could not get last synced block from DB: %v", err)
			span.End()
			continue
		}

		span.SetAttributes(
			attribute.Int64("chain.head", int64(latestChainBlock)),
			attribute.Int64("db.head", lastSyncedBlock),
		)

		startBlock := uint64(lastSyncedBlock + 1)
		if startBlock > latestChainBlock {
			log.Println("No new blocks to sync.")
			span.End()
			continue
		}

		log.Printf("Syncing blocks from %d to %d", startBlock, latestChainBlock)
		transactions, err := ethIndexer.ProcessBlocks(ctx, startBlock, latestChainBlock)
		if err != nil {
			log.Printf("ERROR: failed to process blocks: %v", err)
			span.End()
			continue
		}

		if len(transactions) > 0 {
			_, err := dbpool.CopyFrom(
				ctx,
				pgx.Identifier{"crypto", "transactions"},
				[]string{"id", "time", "hash", "chain", "from_address", "to_address", "amount", "block_number", "status", "type"},
				indexer.ToCopyFromRows(transactions),
			)
			if err != nil {
				log.Printf("ERROR: failed to insert transactions: %v", err)
			} else {
				log.Printf("Successfully inserted %d transactions.", len(transactions))
				for _, txn := range transactions {
					event, _ := json.Marshal(events.TransactionFoundEvent{Chain: string(txn.Chain), Hash: txn.Hash})
					nc.Publish(events.SubjectTransactionFound, event)
				}
			}
		}
		span.End()
	}
}