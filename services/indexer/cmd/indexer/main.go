package main

import (
    "context"
    "encoding/json"
    "log"
    "strings"
    "time"

    "github.com/crypto-tracker/indexer/internal/events"
    "github.com/crypto-tracker/indexer/internal/indexer"
    "github.com/crypto-tracker/indexer/internal/models"
    "github.com/crypto-tracker/indexer/internal/telemetry"
    pgx "github.com/jackc/pgx/v5"
    pgxpool "github.com/jackc/pgx/v5/pgxpool"
    "github.com/nats-io/nats.go"
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "github.com/google/uuid"
)

func main() {
    cfg, err := indexer.LoadConfig()
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

        // Get monitored wallets (e.g., active ones)
        wallets, err := getMonitoredWallets(ctx, dbpool)
        if err != nil {
            log.Printf("ERROR: failed to get wallets: %v", err)
            span.End()
            continue
        }

        if len(wallets) == 0 {
            log.Println("No wallets to monitor.")
            span.End()
            continue
        }

        // Get monitored ERC-20 tokens
        tokenMap, err := getERC20Tokens(ctx, dbpool)
        if err != nil {
            log.Printf("ERROR: failed to get tokens: %v", err)
            span.End()
            continue
        }

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
            attribute.Int("wallets.count", len(wallets)),
            attribute.Int("tokens.count", len(tokenMap)),
        )

        // Batch limit per cycle (as per plan)
        const batchSize = 100
        startBlock := uint64(lastSyncedBlock + 1)
        endBlock := min(startBlock + batchSize - 1, latestChainBlock)
        if startBlock > latestChainBlock {
            log.Println("No new blocks to sync.")
            span.End()
            continue
        }

        log.Printf("Syncing blocks from %d to %d for %d wallets", startBlock, endBlock, len(wallets))
        transactions, err := ethIndexer.ProcessBlocks(ctx, startBlock, endBlock, wallets, tokenMap)
        if err != nil {
            log.Printf("ERROR: failed to process blocks: %v", err)
            span.End()
            continue
        }

        if len(transactions) > 0 {
            _, err := dbpool.CopyFrom(
                ctx,
                pgx.Identifier{"crypto", "transactions"},
                []string{"id", "time", "wallet_id", "hash", "chain", "from_address", "to_address", "token_id", "amount", "block_number", "status", "type"},
                pgx.CopyFromRows(indexer.ToCopyFromRows(transactions)),
            )
            if err != nil {
                log.Printf("ERROR: failed to insert transactions: %v", err)
                span.End()
                continue
            }

            log.Printf("Inserted %d transactions", len(transactions))

            // Publish events
            for _, txn := range transactions {
                event, errMarshal := json.Marshal(events.TransactionFoundEvent{
                    Chain:       string(txn.Chain),
                    Hash:        txn.Hash,
                    BlockNumber: uint64(txn.BlockNumber),
                    From:        txn.FromAddress,
                    To:          txn.ToAddress,
                    Value:       txn.Amount,
                    Timestamp:   txn.Time,
                })
                if errMarshal != nil {
                    log.Printf("ERROR: failed to marshal event: %v", errMarshal)
                    continue
                }
                if err := nc.Publish(events.SubjectTransactionFound, event); err != nil {
                    log.Printf("ERROR: failed to publish event: %v", err)
                }
            }
        }

        span.End()
    }
}

// Helper to get monitored wallets from DB
func getMonitoredWallets(ctx context.Context, db *pgxpool.Pool) ([]models.Wallet, error) {
    rows, err := db.Query(ctx, "SELECT id, address FROM crypto.wallets WHERE is_active = true AND chain = 'ETHEREUM'")
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var wallets []models.Wallet
    for rows.Next() {
        var w models.Wallet
        if err := rows.Scan(&w.ID, &w.Address); err != nil {
            return nil, err
        }
        wallets = append(wallets, w)
    }
    return wallets, rows.Err()
}

// Helper to get monitored ERC-20 tokens
func getERC20Tokens(ctx context.Context, db *pgxpool.Pool) (map[string]uuid.UUID, error) {
    rows, err := db.Query(ctx, "SELECT id, contract_address FROM crypto.tokens WHERE chain = 'ETHEREUM' AND contract_address IS NOT NULL")
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    tokenMap := make(map[string]uuid.UUID)
    for rows.Next() {
        var id uuid.UUID
        var addr string
        if err := rows.Scan(&id, &addr); err != nil {
            return nil, err
        }
        tokenMap[strings.ToLower(addr)] = id
    }
    return tokenMap, rows.Err()
}

// Simple min helper
func min(a, b uint64) uint64 {
    if a < b {
        return a
    }
    return b
}