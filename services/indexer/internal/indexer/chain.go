package indexer

import (
	"context"
	"errors"
	"log"
	"math/big"
	"net/http" // For http.Client
	"strings"
	"time"

	coingecko "github.com/superoo7/go-gecko/v3" // Fixed: gogecko import
	"github.com/crypto-tracker/indexer/internal/models"
	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/metric"
	"go.opentelemetry.io/otel/trace" // For trace.WithAttributes
)

var tracer = otel.Tracer("indexer.chain")
var meter = otel.Meter("indexer.chain")

type EthereumIndexer struct {
	client    *ethclient.Client
	coinGecko *coingecko.Client // Fixed: gogecko client type
}

func NewEthereumIndexer(rpcURL string, coinGeckoAPIKey string) (*EthereumIndexer, error) {
	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		return nil, err
	}

	// Fixed: Create http.Client with timeout, then init gogecko client
	httpClient := &http.Client{
		Timeout: time.Second * 10,
	}
	cgClient := coingecko.NewClient(httpClient)

	return &EthereumIndexer{client: client, coinGecko: cgClient}, nil
}

func (ei *EthereumIndexer) GetLatestBlock(ctx context.Context) (uint64, error) {
	ctx, span := tracer.Start(ctx, "GetLatestBlock")
	defer span.End()

	header, err := ei.client.HeaderByNumber(ctx, nil)
	if err != nil {
		return 0, err
	}
	return header.Number.Uint64(), nil
}

func (ei *EthereumIndexer) ProcessBlocks(ctx context.Context, start, end uint64, wallets []models.Wallet, tokenMap map[string]uuid.UUID) ([]models.Transaction, error) {
	ctx, span := tracer.Start(ctx, "ProcessBlocks", trace.WithAttributes( // Fixed: trace.WithAttributes
		attribute.Int64("start_block", int64(start)),
		attribute.Int64("end_block", int64(end)),
		attribute.Int("wallet_count", len(wallets)),
	))
	defer span.End()

	blockProcessDuration, _ := meter.Float64Histogram("block.process.duration", metric.WithDescription("Time to process blocks"), metric.WithUnit("ms"))

	startTime := time.Now()
	var transactions []models.Transaction

	walletMap := make(map[string]uuid.UUID)
	for _, w := range wallets {
		walletMap[strings.ToLower(w.Address)] = w.ID
	}

	blockTimes := make(map[uint64]time.Time)

	// Process native transfers
	for i := start; i <= end; i++ {
		block, err := ei.client.BlockByNumber(ctx, big.NewInt(int64(i)))
		if err != nil {
			log.Printf("Failed to get block %d: %v", i, err)
			continue
		}

		blockTimes[i] = time.Unix(int64(block.Time()), 0)

		for _, tx := range block.Transactions() {
			from, err := types.Sender(types.LatestSignerForChainID(tx.ChainId()), tx)
			if err != nil {
				continue
			}

			toStr := ""
			if tx.To() != nil {
				toStr = tx.To().Hex()
			}

			fromLower := strings.ToLower(from.Hex())
			toLower := strings.ToLower(toStr)

			var walletID uuid.UUID
			var ok bool
			if walletID, ok = walletMap[fromLower]; !ok {
				if walletID, ok = walletMap[toLower]; !ok {
					continue // skip if not for monitored wallet
				}
			}

			txnType := "TRANSFER"

			txn := models.Transaction{
				ID:          uuid.New(),
				Time:        blockTimes[i],
				WalletID:    walletID,
				Hash:        tx.Hash().Hex(),
				Chain:       models.ChainEthereum,
				FromAddress: from.Hex(),
				ToAddress:   toStr,
				TokenID:     nil, // native
				Amount:      tx.Value().String(),
				BlockNumber: int64(i),
				Status:      "CONFIRMED",
				Type:        &txnType,
			}

			transactions = append(transactions, txn)
		}
	}

	// Process ERC-20 transfers via logs
	query := ethereum.FilterQuery{
		FromBlock: big.NewInt(int64(start)),
		ToBlock:   big.NewInt(int64(end)),
		Topics: [][]common.Hash{{common.HexToHash("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef")}},
	}

	logs, err := ei.client.FilterLogs(ctx, query)
	if err != nil {
		return transactions, err // return native txns even if logs fail
	}

	for _, l := range logs {
		if len(l.Topics) != 3 { continue }

		from := common.BytesToAddress(l.Topics[1].Bytes()[12:]).Hex()
		to := common.BytesToAddress(l.Topics[2].Bytes()[12:]).Hex()

		fromLower := strings.ToLower(from)
		toLower := strings.ToLower(to)

		var walletID uuid.UUID
		var ok bool
		if walletID, ok = walletMap[fromLower]; !ok {
			if walletID, ok = walletMap[toLower]; !ok {
				continue
			}
		}

		tokenAddrLower := strings.ToLower(l.Address.Hex())
		tokenID, ok := tokenMap[tokenAddrLower]
		if !ok { continue }

		amount := new(big.Int).SetBytes(l.Data).String()

		txnType := "ERC20_TRANSFER"

		txn := models.Transaction{
			ID:          uuid.New(),
			Time:        blockTimes[uint64(l.BlockNumber)],
			WalletID:    walletID,
			Hash:        l.TxHash.Hex(),
			Chain:       models.ChainEthereum,
			FromAddress: from,
			ToAddress:   to,
			TokenID:     &tokenID,
			Amount:      amount,
			BlockNumber: int64(l.BlockNumber),
			Status:      "CONFIRMED",
			Type:        &txnType,
		}

		transactions = append(transactions, txn)
	}

	duration := time.Since(startTime).Milliseconds()
	blockProcessDuration.Record(ctx, float64(duration), metric.WithAttributes(
		attribute.Int("blocks_processed", int(end-start+1)),
		attribute.Int("transactions_found", len(transactions)),
	))

	return transactions, nil
}

// Reorg Handling
func (ei *EthereumIndexer) HandleReorg(ctx context.Context, db *pgxpool.Pool) (bool, error) {
	ctx, span := tracer.Start(ctx, "HandleReorg")
	defer span.End()

	var maxBlock int64
	err := db.QueryRow(ctx, "SELECT MAX(block_number) FROM crypto.transactions WHERE chain = 'ETHEREUM'").Scan(&maxBlock)
	if err != nil {
		return false, err
	}

	if maxBlock == 0 {
		return false, nil
	}

	// Get block hash from chain
	chainBlock, err := ei.client.BlockByNumber(ctx, big.NewInt(maxBlock))
	if err != nil {
		return false, err
	}
	chainHash := chainBlock.Hash().Hex()

	// Get stored hash (use a transaction from that block)
	var storedHash string
	err = db.QueryRow(ctx, "SELECT hash FROM crypto.transactions WHERE block_number = $1 AND chain = 'ETHEREUM' LIMIT 1", maxBlock).Scan(&storedHash)
	if err != nil {
		return false, err
	}

	if storedHash == "" || chainHash == "" {
		return false, nil
	}

	if chainHash != storedHash { // Simple check; in production, compare full block hash chain
		log.Printf("Reorg detected at block %d: chain hash %s != stored %s", maxBlock, chainHash, storedHash)
		span.AddEvent("reorg_detected", trace.WithAttributes(attribute.Int64("block", maxBlock))) // Fixed: trace.WithAttributes

		// Rollback recent blocks (e.g., last 12 for safety)
		rollbackTo := maxBlock - 12
		if rollbackTo < 0 {
			rollbackTo = 0
		}
		_, err = db.Exec(ctx, "DELETE FROM crypto.transactions WHERE block_number > $1 AND chain = 'ETHEREUM'", rollbackTo)
		if err != nil {
			return true, err
		}
		log.Printf("Rolled back to block %d", rollbackTo)
		span.AddEvent("reorg_rollback", trace.WithAttributes(attribute.Int64("rollback_to", rollbackTo))) // Fixed: trace.WithAttributes
		return true, nil
	}

	return false, nil
}

// Hybrid Integration Helpers
// GetBalance: Use go-ethereum for wallet balance (Viem-like)
func (ei *EthereumIndexer) GetBalance(ctx context.Context, address string) (*big.Int, error) {
	return ei.client.BalanceAt(ctx, common.HexToAddress(address), nil)
}

// GetPrice: Real CoinGecko integration (using gogecko)
func (ei *EthereumIndexer) GetPrice(ctx context.Context, token string) (float64, error) {
	ctx, span := tracer.Start(ctx, "GetPrice", trace.WithAttributes(attribute.String("token", token))) // Fixed: trace.WithAttributes
	defer span.End()

	priceDuration, _ := meter.Float64Histogram("price.fetch.duration", metric.WithDescription("Time to fetch price from CoinGecko"), metric.WithUnit("ms"))

	startTime := time.Now()
	data, err := ei.coinGecko.SimplePrice([]string{token}, []string{"usd"}) // Fixed: gogecko SimplePrice signature (slices)
	if err != nil {
		span.RecordError(err)
		return 0, err
	}

	priceFloat32, ok := (*data)[token]["usd"] // Fixed: Access lowercase "usd" key; it's float32
	if !ok {
		err := errors.New("price not found for token")
		span.RecordError(err)
		return 0, err
	}
	price := float64(priceFloat32) // Fixed: Convert float32 to float64

	duration := time.Since(startTime).Milliseconds()
	priceDuration.Record(ctx, float64(duration), metric.WithAttributes(attribute.String("token", token)))

	return price, nil
}

// UpdateWalletSnapshot: Store USD balance snapshot in DB
func (ei *EthereumIndexer) UpdateWalletSnapshot(ctx context.Context, db *pgxpool.Pool, wallet models.Wallet, balance *big.Int, usdPrice float64) error {
	ctx, span := tracer.Start(ctx, "UpdateWalletSnapshot")
	defer span.End()

	usdValue, _ := new(big.Float).Mul(new(big.Float).SetInt(balance), big.NewFloat(usdPrice)).Float64() // Fixed: assignment mismatch by ignoring second value

	_, err := db.Exec(ctx,
		`INSERT INTO analytics.wallet_snapshots (id, time, wallet_id, total_value_usd, token_count, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (time, wallet_id) DO UPDATE SET total_value_usd = EXCLUDED.total_value_usd`,
		uuid.New(), time.Now(), wallet.ID, usdValue, 1, "{}") // token_count=1 for ETH
	if err != nil {
		span.RecordError(err)
		return err
	}

	return nil
}