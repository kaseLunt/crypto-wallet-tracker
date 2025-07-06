-- Enable TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Convert tables to hypertables
DO $$
BEGIN
    -- Convert transactions table
    IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'crypto' AND hypertable_name = 'transactions'
    ) THEN
        PERFORM create_hypertable('crypto.transactions', 'time');
        PERFORM set_chunk_time_interval('crypto.transactions', INTERVAL '1 week');
        RAISE NOTICE 'Created hypertable for crypto.transactions';
    END IF;

    -- Convert token_prices table
    IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'analytics' AND hypertable_name = 'token_prices'
    ) THEN
        PERFORM create_hypertable('analytics.token_prices', 'time');
        PERFORM set_chunk_time_interval('analytics.token_prices', INTERVAL '1 day');
        RAISE NOTICE 'Created hypertable for analytics.token_prices';
    END IF;

    -- Convert wallet_snapshots table
    IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'analytics' AND hypertable_name = 'wallet_snapshots'
    ) THEN
        PERFORM create_hypertable('analytics.wallet_snapshots', 'time');
        PERFORM set_chunk_time_interval('analytics.wallet_snapshots', INTERVAL '1 week');
        RAISE NOTICE 'Created hypertable for analytics.wallet_snapshots';
    END IF;
END $$;

-- Create continuous aggregates for token prices
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.token_prices_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS hour,
    token_id,
    FIRST(price_usd, time) AS open_price,
    MAX(price_usd) AS high_price,
    MIN(price_usd) AS low_price,
    LAST(price_usd, time) AS close_price,
    AVG(price_usd) AS avg_price,
    SUM(volume_24h_usd) AS volume
FROM analytics.token_prices
GROUP BY hour, token_id
WITH NO DATA;

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.token_prices_daily
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', time) AS day,
    token_id,
    FIRST(price_usd, time) AS open_price,
    MAX(price_usd) AS high_price,
    MIN(price_usd) AS low_price,
    LAST(price_usd, time) AS close_price,
    AVG(price_usd) AS avg_price,
    SUM(volume_24h_usd) AS volume
FROM analytics.token_prices
GROUP BY day, token_id
WITH NO DATA;

-- Add compression policies
SELECT add_compression_policy('crypto.transactions',
    compress_after => INTERVAL '30 days',
    if_not_exists => TRUE);

SELECT add_compression_policy('analytics.token_prices',
    compress_after => INTERVAL '7 days',
    if_not_exists => TRUE);

SELECT add_compression_policy('analytics.wallet_snapshots',
    compress_after => INTERVAL '30 days',
    if_not_exists => TRUE);

-- Add continuous aggregate refresh policies
SELECT add_continuous_aggregate_policy('analytics.token_prices_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE);

SELECT add_continuous_aggregate_policy('analytics.token_prices_daily',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 day',
    if_not_exists => TRUE);

-- Create useful indexes
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_time ON crypto.transactions (wallet_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_token_prices_token_time ON analytics.token_prices (token_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_snapshots_wallet_time ON analytics.wallet_snapshots (wallet_id, time DESC);
