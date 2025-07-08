package events

const (
    // Event subjects
    SubjectTransactionFound    = "indexer.transaction.found"
    SubjectTokenTransferFound  = "indexer.token_transfer.found"
    SubjectWalletBalanceUpdate = "indexer.wallet.balance_update"
    SubjectBlockProcessed      = "indexer.block.processed"
    SubjectIndexerStatus       = "indexer.status"
)

// Event types for structured events
type TransactionFoundEvent struct {
    Chain       string    `json:"chain"`
    Hash        string    `json:"hash"`
    BlockNumber uint64    `json:"block_number"`
    From        string    `json:"from"`
    To          string    `json:"to"`
    Value       string    `json:"value"`
    Timestamp   time.Time `json:"timestamp"`
}