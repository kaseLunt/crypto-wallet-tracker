-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS crypto;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Set default search path
ALTER DATABASE crypto_tracker SET search_path TO public, crypto, analytics;

-- Create base tables
CREATE TABLE IF NOT EXISTS crypto.wallets (
                                              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address VARCHAR(255) NOT NULL,
    chain VARCHAR(50) NOT NULL,
    label VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    UNIQUE(address, chain)
    );

CREATE TABLE IF NOT EXISTS crypto.tokens (
                                             id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    contract_address VARCHAR(255),
    chain VARCHAR(50) NOT NULL,
    decimals INTEGER NOT NULL DEFAULT 18,
    logo_url TEXT,
    coingecko_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    UNIQUE(contract_address, chain)
    );

-- Create hypertables for time-series data
CREATE TABLE IF NOT EXISTS crypto.transactions (
                                                   time TIMESTAMPTZ NOT NULL,
                                                   wallet_id UUID NOT NULL REFERENCES crypto.wallets(id),
    hash VARCHAR(255) NOT NULL,
    chain VARCHAR(50) NOT NULL,
    from_address VARCHAR(255) NOT NULL,
    to_address VARCHAR(255) NOT NULL,
    token_id UUID REFERENCES crypto.tokens(id),
    amount NUMERIC(78, 0) NOT NULL,
    gas_fee NUMERIC(78, 0),
    block_number BIGINT NOT NULL,
    status VARCHAR(50) DEFAULT 'confirmed',
    type VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    UNIQUE(hash, chain)
    );

-- Convert to hypertable
SELECT create_hypertable('crypto.transactions', 'time', if_not_exists => TRUE);

-- Create price history hypertable
CREATE TABLE IF NOT EXISTS analytics.token_prices (
                                                      time TIMESTAMPTZ NOT NULL,
                                                      token_id UUID NOT NULL REFERENCES crypto.tokens(id),
    price_usd NUMERIC(20, 8) NOT NULL,
    price_btc NUMERIC(20, 8),
    price_eth NUMERIC(20, 8),
    market_cap_usd NUMERIC(20, 2),
    volume_24h_usd NUMERIC(20, 2),
    price_change_24h_pct NUMERIC(8, 4),
    source VARCHAR(50) DEFAULT 'coingecko'
    );

SELECT create_hypertable('analytics.token_prices', 'time', if_not_exists => TRUE);

-- Create wallet snapshots for portfolio tracking
CREATE TABLE IF NOT EXISTS analytics.wallet_snapshots (
                                                          time TIMESTAMPTZ NOT NULL,
                                                          wallet_id UUID NOT NULL REFERENCES crypto.wallets(id),
    total_value_usd NUMERIC(20, 2) NOT NULL,
    token_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'
    );

SELECT create_hypertable('analytics.wallet_snapshots', 'time', if_not_exists => TRUE);

-- Create indexes
CREATE INDEX idx_wallets_address ON crypto.wallets(address);
CREATE INDEX idx_wallets_chain ON crypto.wallets(chain);
CREATE INDEX idx_tokens_symbol ON crypto.tokens(symbol);
CREATE INDEX idx_tokens_chain ON crypto.tokens(chain);
CREATE INDEX idx_transactions_wallet_time ON crypto.transactions(wallet_id, time DESC);
CREATE INDEX idx_token_prices_token_time ON analytics.token_prices(token_id, time DESC);
CREATE INDEX idx_wallet_snapshots_wallet_time ON analytics.wallet_snapshots(wallet_id, time DESC);

-- Create continuous aggregates for performance
CREATE MATERIALIZED VIEW analytics.hourly_token_prices
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS hour,
    token_id,
    AVG(price_usd) AS avg_price_usd,
    MAX(price_usd) AS high_price_usd,
    MIN(price_usd) AS low_price_usd,
    LAST(price_usd, time) AS close_price_usd,
    AVG(volume_24h_usd) AS avg_volume_24h_usd
FROM analytics.token_prices
GROUP BY hour, token_id
WITH NO DATA;

-- Refresh policy for continuous aggregate
SELECT add_continuous_aggregate_policy('analytics.hourly_token_prices',
                                       start_offset => INTERVAL '3 hours',
                                       end_offset => INTERVAL '1 hour',
                                       schedule_interval => INTERVAL '1 hour');

-- Add compression policy for old data
SELECT add_compression_policy('crypto.transactions', INTERVAL '30 days');
SELECT add_compression_policy('analytics.token_prices', INTERVAL '7 days');
SELECT add_compression_policy('analytics.wallet_snapshots', INTERVAL '30 days');

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON crypto.wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tokens_updated_at BEFORE UPDATE ON crypto.tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed)
GRANT ALL PRIVILEGES ON SCHEMA crypto TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA analytics TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA crypto TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA analytics TO postgres;