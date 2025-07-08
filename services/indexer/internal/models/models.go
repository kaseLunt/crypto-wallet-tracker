package models

import (
    "time"
    "github.com/google/uuid"
)

type Chain string

const (
    ChainEthereum Chain = "ETHEREUM"
    ChainPolygon  Chain = "POLYGON"
    ChainArbitrum Chain = "ARBITRUM"
    ChainBase     Chain = "BASE"
)

type Wallet struct {
    ID           uuid.UUID  `db:"id"`
    Address      string     `db:"address"`
    Chain        Chain      `db:"chain"`
    Label        *string    `db:"label"`
    CreatedAt    time.Time  `db:"created_at"`
    UpdatedAt    time.Time  `db:"updated_at"`
    LastSyncedAt *time.Time `db:"last_synced_at"`
    IsActive     bool       `db:"is_active"`
}

type Token struct {
    ID              uuid.UUID `db:"id"`
    Symbol          string    `db:"symbol"`
    Name            string    `db:"name"`
    ContractAddress *string   `db:"contract_address"`
    Chain           Chain     `db:"chain"`
    Decimals        int       `db:"decimals"`
    LogoURL         *string   `db:"logo_url"`
    CoingeckoID     *string   `db:"coingecko_id"`
    CreatedAt       time.Time `db:"created_at"`
    UpdatedAt       time.Time `db:"updated_at"`
}

type Transaction struct {
    ID          uuid.UUID  `db:"id"`
    Time        time.Time  `db:"time"`
    WalletID    uuid.UUID  `db:"wallet_id"`
    Hash        string     `db:"hash"`
    Chain       Chain      `db:"chain"`
    FromAddress string     `db:"from_address"`
    ToAddress   string     `db:"to_address"`
    TokenID     *uuid.UUID `db:"token_id"`
    Amount      string     `db:"amount"` // Use string for NUMERIC
    GasFee      *string    `db:"gas_fee"`
    BlockNumber int64      `db:"block_number"`
    Status      string     `db:"status"`
    Type        *string    `db:"type"`
}