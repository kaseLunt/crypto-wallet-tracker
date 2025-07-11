// Path: services/indexer/internal/indexer/chain.go
package indexer

import (
	"context"
	"log"
	"math/big"
	"time"

	"github.com/crypto-tracker/indexer/internal/models"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/google/uuid"
)

type ChainIndexer interface {
	GetLatestBlock(ctx context.Context) (uint64, error)
	ProcessBlocks(ctx context.Context, start, end uint64) ([]models.Transaction, error)
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

func (ei *EthereumIndexer) ProcessBlocks(ctx context.Context, start, end uint64) ([]models.Transaction, error) {
	var transactions []models.Transaction
	for i := start; i <= end; i++ {
		block, err := ei.client.BlockByNumber(ctx, big.NewInt(int64(i)))
		if err != nil {
			log.Printf("Failed to get block %d: %v", i, err)
			continue
		}

		for _, tx := range block.Transactions() {
			from, err := types.Sender(types.LatestSignerForChainID(tx.ChainId()), tx)
			if err != nil {
				continue
			}

			to := ""
			if tx.To() != nil {
				to = tx.To().Hex()
			}

			txn := models.Transaction{
				ID:          uuid.New(),
				Time:        time.Unix(int64(block.Time()), 0),
				Hash:        tx.Hash().Hex(),
				Chain:       models.ChainEthereum,
				FromAddress: from.Hex(),
				ToAddress:   to,
				Amount:      tx.Value().String(),
				BlockNumber: int64(i),
				Status:      "CONFIRMED",
				Type:        "TRANSFER",
			}
			transactions = append(transactions, txn)
		}
	}
	return transactions, nil
}

func ToCopyFromRows(transactions []models.Transaction) [][]any {
	rows := make([][]any, len(transactions))
	for i, t := range transactions {
		rows[i] = []any{t.ID, t.Time, t.Hash, t.Chain, t.FromAddress, t.ToAddress, t.Amount, t.BlockNumber, t.Status, t.Type}
	}
	return rows
}