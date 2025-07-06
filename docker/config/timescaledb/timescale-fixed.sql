-- Enable TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Convert tables to hypertables with proper constraint handling
DO $$
BEGIN
    -- Handle transactions table
    IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'crypto' AND hypertable_name = 'transactions'
    ) THEN
        -- Drop the unique constraint that's preventing hypertable creation
        ALTER TABLE crypto.transactions DROP CONSTRAINT IF EXISTS transactions_hash_chain_key;

        -- Create hypertable
        PERFORM create_hypertable('crypto.transactions', 'time');
        PERFORM set_chunk_time_interval('crypto.transactions', INTERVAL '1 week');

        -- Recreate the unique constraint including the time column
        ALTER TABLE crypto.transactions ADD CONSTRAINT transactions_hash_chain_time_key
            UNIQUE (hash, chain, time);

        RAISE NOTICE 'Created hypertable for crypto.transactions';
    END IF;

    -- Handle token_prices table
    IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'analytics' AND hypertable_name = 'token_prices'
    ) THEN
        -- Drop any existing unique constraints
        ALTER TABLE analytics.token_prices DROP CONSTRAINT IF EXISTS token_prices_time_token_id_key;

        -- Create hypertable
        PERFORM create_hypertable('analytics.token_prices', 'time');
        PERFORM set_chunk_time_interval('analytics.token_prices', INTERVAL '1 day');

        -- Add back the unique constraint
        ALTER TABLE analytics.token_prices ADD CONSTRAINT token_prices_time_token_id_key
            UNIQUE (time, token_id);

        RAISE NOTICE 'Created hypertable for analytics.token_prices';
    END IF;

    -- Handle wallet_snapshots table
    IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'analytics' AND hypertable_name = 'wallet_snapshots'
    ) THEN
        -- Drop any existing unique constraints
        ALTER TABLE analytics.wallet_snapshots DROP CONSTRAINT IF EXISTS wallet_snapshots_time_wallet_id_key;

        -- Create hypertable
        PERFORM create_hypertable('analytics.wallet_snapshots', 'time');
        PERFORM set_chunk_time_interval('analytics.wallet_snapshots', INTERVAL '1 week');

        -- Add back the unique constraint
        ALTER TABLE analytics.wallet_snapshots ADD CONSTRAINT wallet_snapshots_time_wallet_id_key
            UNIQUE (time, wallet_id);

        RAISE NOTICE 'Created hypertable for analytics.wallet_snapshots';
    END IF;
END $$;

-- Create continuous aggregates only if hypertables exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'analytics' AND hypertable_name = 'token_prices'
    ) THEN
        -- Drop if exists and recreate
        DROP MATERIALIZED VIEW IF EXISTS analytics.token_prices_hourly CASCADE;
        DROP MATERIALIZED VIEW IF EXISTS analytics.token_prices_daily CASCADE;

        -- Create hourly continuous aggregate
        CREATE MATERIALIZED VIEW analytics.token_prices_hourly
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

        -- Create daily continuous aggregate
        CREATE MATERIALIZED VIEW analytics.token_prices_daily
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

        RAISE NOTICE 'Created continuous aggregates';
    END IF;
END $$;

-- Add compression policies only if hypertables exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'crypto' AND hypertable_name = 'transactions'
    ) THEN
        PERFORM add_compression_policy('crypto.transactions',
            compress_after => INTERVAL '30 days',
            if_not_exists => TRUE);
    END IF;

    IF EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'analytics' AND hypertable_name = 'token_prices'
    ) THEN
        PERFORM add_compression_policy('analytics.token_prices',
            compress_after => INTERVAL '7 days',
            if_not_exists => TRUE);
    END IF;

    IF EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'analytics' AND hypertable_name = 'wallet_snapshots'
    ) THEN
        PERFORM add_compression_policy('analytics.wallet_snapshots',
            compress_after => INTERVAL '30 days',
            if_not_exists => TRUE);
    END IF;
END $$;

-- Add continuous aggregate policies only if they exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM timescaledb_information.continuous_aggregates
        WHERE view_name = 'token_prices_hourly'
    ) THEN
        PERFORM add_continuous_aggregate_policy('analytics.token_prices_hourly',
            start_offset => INTERVAL '3 hours',
            end_offset => INTERVAL '1 hour',
            schedule_interval => INTERVAL '1 hour',
            if_not_exists => TRUE);
    END IF;

    IF EXISTS (
        SELECT 1 FROM timescaledb_information.continuous_aggregates
        WHERE view_name = 'token_prices_daily'
    ) THEN
        PERFORM add_continuous_aggregate_policy('analytics.token_prices_daily',
            start_offset => INTERVAL '3 days',
            end_offset => INTERVAL '1 day',
            schedule_interval => INTERVAL '1 day',
            if_not_exists => TRUE);
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_time ON crypto.transactions (wallet_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_token_prices_token_time ON analytics.token_prices (token_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_snapshots_wallet_time ON analytics.wallet_snapshots (wallet_id, time DESC);

-- Show summary
SELECT 'Hypertables created: ' || COUNT(*)
FROM timescaledb_information.hypertables
WHERE hypertable_schema IN ('crypto', 'analytics');

SELECT 'Continuous aggregates created: ' || COUNT(*)
FROM timescaledb_information.continuous_aggregates;
