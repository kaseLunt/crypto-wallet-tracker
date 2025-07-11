package indexer

import (
	"context"
	"log"
	"math/big"
	"strings"
	"time"

	"github.com/crypto-tracker/indexer/internal/models"
	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool" // Add this import
)

type ChainIndexer interface {
	GetLatestBlock(ctx context.Context) (uint64, error)
	GetLatestStableBlock(ctx context.Context, confirmations uint64) (uint64, error)
	ProcessBlocks(ctx context.Context, start, end uint64, wallets []models.Wallet, tokenMap map[string]uuid.UUID) ([]models.Transaction, error)
	HandleReorg(ctx context.Context, db *pgxpool.Pool) (bool, error)
}

type EthereumIndexer struct {
	client *ethclient.Client
}

func NewEthereumIndexer(rpcURL string) (*EthereumIndexer, error) {
	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		return nil, err
	}
	return &EthereumIndexer{client: client}, nil
}

func (ei *EthereumIndexer) GetLatestBlock(ctx context.Context) (uint64, error) {
	header, err := ei.client.HeaderByNumber(ctx, nil)
	if err != nil {
		return 0, err
	}
	return header.Number.Uint64(), nil
}

func (ei *EthereumIndexer) GetLatestStableBlock(ctx context.Context, confirmations uint64) (uint64, error) {
	latest, err := ei.GetLatestBlock(ctx)
	if err != nil {
		return 0, err
	}
	if latest < confirmations {
		return 0, nil
	}
	return latest - confirmations, nil
}

func (ei *EthereumIndexer) ProcessBlocks(ctx context.Context, start, end uint64, wallets []models.Wallet, tokenMap map[string]uuid.UUID) ([]models.Transaction, error) {
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

			var txnType = "TRANSFER"

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

	return transactions, nil
}

func (ei *EthereumIndexer) HandleReorg(ctx context.Context, db *pgxpool.Pool) (bool, error) {
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

	// Get stored hash
	var storedHash string
	err = db.QueryRow(ctx, "SELECT hash FROM crypto.transactions WHERE block_number = $1 AND chain = 'ETHEREUM' LIMIT 1", maxBlock).Scan(&storedHash)
	if err != nil {
		return false, err
	}

	if storedHash == "" || chainHash == "" {
		return false, nil
	}

	if chainHash != storedHash { // simple check, could compare full block
		log.Printf("Reorg detected at block %d: chain hash %s != stored %s", maxBlock, chainHash, storedHash)
		// Rollback recent blocks (e.g., last 12)
		rollbackTo := maxBlock - 12
		if rollbackTo < 0 {
			rollbackTo = 0
		}
		_, err = db.Exec(ctx, "DELETE FROM crypto.transactions WHERE block_number > $1 AND chain = 'ETHEREUM'", rollbackTo)
		if err != nil {
			return true, err
		}
		log.Printf("Rolled back to block %d", rollbackTo)
		return true, nil
	}

	return false, nil
}

func ToCopyFromRows(transactions []models.Transaction) [][]interface{} {
	rows := make([][]interface{}, len(transactions))
	for i, t := range transactions {
		rows[i] = []interface{}{t.ID, t.Time, t.WalletID, t.Hash, t.Chain, t.FromAddress, t.ToAddress, t.TokenID, t.Amount, t.BlockNumber, t.Status, t.Type}
	}
	return rows
}