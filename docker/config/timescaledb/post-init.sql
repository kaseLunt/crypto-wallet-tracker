-- Enable TimescaleDB extension if not already enabled
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Convert existing tables to hypertables (if they exist and aren't already)
DO $$
BEGIN
    -- Check if transactions table exists and isn't a hypertable
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'crypto'
        AND table_name = 'transactions'
    ) AND NOT EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'crypto'
        AND hypertable_name = 'transactions'
    ) THEN
        PERFORM create_hypertable(
            'crypto.transactions',
            'time',
            if_not_exists => TRUE,
            migrate_data => TRUE
        );
        RAISE NOTICE 'Converted transactions to hypertable';
    END IF;

    -- Check if token_prices table exists and isn't a hypertable
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'analytics'
        AND table_name = 'token_prices'
    ) AND NOT EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'analytics'
        AND hypertable_name = 'token_prices'
    ) THEN
        PERFORM create_hypertable(
            'analytics.token_prices',
            'time',
            if_not_exists => TRUE,
            migrate_data => TRUE
        );
        RAISE NOTICE 'Converted token_prices to hypertable';
    END IF;

    -- Check if wallet_snapshots table exists and isn't a hypertable
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'analytics'
        AND table_name = 'wallet_snapshots'
    ) AND NOT EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'analytics'
        AND hypertable_name = 'wallet_snapshots'
    ) THEN
        PERFORM create_hypertable(
            'analytics.wallet_snapshots',
            'time',
            if_not_exists => TRUE,
            migrate_data => TRUE
        );
        RAISE NOTICE 'Converted wallet_snapshots to hypertable';
    END IF;
END $$;

-- Set chunk time intervals (1 week for transactions, 1 day for prices)
SELECT set_chunk_time_interval('crypto.transactions', INTERVAL '1 week');
SELECT set_chunk_time_interval('analytics.token_prices', INTERVAL '1 day');
SELECT set_chunk_time_interval('analytics.wallet_snapshots', INTERVAL '1 week');

-- Create continuous aggregates for hourly token prices
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

-- Create continuous aggregates for daily token prices
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_time_desc
ON crypto.transactions(time DESC);

CREATE INDEX IF NOT EXISTS idx_token_prices_time_desc
ON analytics.token_prices(time DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_snapshots_time_desc
ON analytics.wallet_snapshots(time DESC);

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

-- Add retention policies (optional - uncomment if needed)
-- SELECT add_retention_policy('crypto.transactions', INTERVAL '1 year', if_not_exists => TRUE);
-- SELECT add_retention_policy('analytics.token_prices', INTERVAL '90 days', if_not_exists => TRUE);

-- Add continuous aggregate policies
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

-- Create helper functions
CREATE OR REPLACE FUNCTION analytics.get_portfolio_value(
    p_wallet_ids UUID[],
    p_timestamp TIMESTAMPTZ DEFAULT NOW()
) RETURNS TABLE (
    wallet_id UUID,
    total_value_usd NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        wb.wallet_id,
        SUM(wb.balance * tp.price_usd / POWER(10, t.decimals)) as total_value_usd
    FROM crypto.wallet_balances wb
    JOIN crypto.tokens t ON wb.token_id = t.id
    LEFT JOIN LATERAL (
        SELECT price_usd
        FROM analytics.token_prices
        WHERE token_id = wb.token_id
        AND time <= p_timestamp
        ORDER BY time DESC
        LIMIT 1
    ) tp ON TRUE
    WHERE wb.wallet_id = ANY(p_wallet_ids)
    GROUP BY wb.wallet_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT USAGE ON SCHEMA analytics TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA analytics TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA analytics TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA analytics TO postgres;

RAISE NOTICE 'TimescaleDB setup completed successfully!';
