-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

DO $$
DECLARE
    hypertable_count INTEGER;
BEGIN
    -- Check if we already have hypertables
    SELECT COUNT(*) INTO hypertable_count
    FROM timescaledb_information.hypertables
    WHERE hypertable_schema IN ('crypto', 'analytics');

    IF hypertable_count > 0 THEN
        RAISE NOTICE 'Hypertables already exist, skipping conversion';
        RETURN;
    END IF;

    -- For transactions table, we need to work around the composite primary key
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'crypto' AND table_name = 'transactions'
    ) THEN
        -- Drop the existing primary key constraint
        ALTER TABLE crypto.transactions DROP CONSTRAINT IF EXISTS transactions_pkey CASCADE;

        -- Create hypertable
        PERFORM create_hypertable(
            'crypto.transactions',
            'time',
            if_not_exists => TRUE
        );

        -- Add back a unique constraint (not primary key) for the original columns
        ALTER TABLE crypto.transactions
        ADD CONSTRAINT transactions_unique
        UNIQUE (time, wallet_id, hash);

        RAISE NOTICE 'Converted transactions to hypertable';
    END IF;

    -- For token_prices table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'analytics' AND table_name = 'token_prices'
    ) THEN
        -- Drop the existing primary key
        ALTER TABLE analytics.token_prices DROP CONSTRAINT IF EXISTS token_prices_pkey CASCADE;

        -- Create hypertable
        PERFORM create_hypertable(
            'analytics.token_prices',
            'time',
            if_not_exists => TRUE
        );

        -- Add unique constraint
        ALTER TABLE analytics.token_prices
        ADD CONSTRAINT token_prices_unique
        UNIQUE (time, token_id);

        RAISE NOTICE 'Converted token_prices to hypertable';
    END IF;

    -- For wallet_snapshots table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'analytics' AND table_name = 'wallet_snapshots'
    ) THEN
        -- Drop the existing primary key
        ALTER TABLE analytics.wallet_snapshots DROP CONSTRAINT IF EXISTS wallet_snapshots_pkey CASCADE;

        -- Create hypertable
        PERFORM create_hypertable(
            'analytics.wallet_snapshots',
            'time',
            if_not_exists => TRUE
        );

        -- Add unique constraint
        ALTER TABLE analytics.wallet_snapshots
        ADD CONSTRAINT wallet_snapshots_unique
        UNIQUE (time, wallet_id);

        RAISE NOTICE 'Converted wallet_snapshots to hypertable';
    END IF;
END $$;

-- Only set chunk intervals if tables are hypertables
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'crypto' AND hypertable_name = 'transactions'
    ) THEN
        PERFORM set_chunk_time_interval('crypto.transactions', INTERVAL '1 week');
    END IF;

    IF EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'analytics' AND hypertable_name = 'token_prices'
    ) THEN
        PERFORM set_chunk_time_interval('analytics.token_prices', INTERVAL '1 day');
    END IF;

    IF EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'analytics' AND hypertable_name = 'wallet_snapshots'
    ) THEN
        PERFORM set_chunk_time_interval('analytics.wallet_snapshots', INTERVAL '1 week');
    END IF;
END $$;

-- Create continuous aggregates only if the hypertables exist
DO $$
BEGIN
    -- Check if token_prices is a hypertable before creating continuous aggregates
    IF EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'analytics' AND hypertable_name = 'token_prices'
    ) THEN
        -- Drop existing views if they exist
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

        -- Add refresh policies
        PERFORM add_continuous_aggregate_policy('analytics.token_prices_hourly',
            start_offset => INTERVAL '3 hours',
            end_offset => INTERVAL '1 hour',
            schedule_interval => INTERVAL '1 hour',
            if_not_exists => TRUE);

        PERFORM add_continuous_aggregate_policy('analytics.token_prices_daily',
            start_offset => INTERVAL '3 days',
            end_offset => INTERVAL '1 day',
            schedule_interval => INTERVAL '1 day',
            if_not_exists => TRUE);

        RAISE NOTICE 'Created continuous aggregates';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_time_desc
ON crypto.transactions(time DESC);

CREATE INDEX IF NOT EXISTS idx_token_prices_time_desc
ON analytics.token_prices(time DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_snapshots_time_desc
ON analytics.wallet_snapshots(time DESC);

-- Add compression policies only for hypertables
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

-- Grant permissions
GRANT USAGE ON SCHEMA analytics TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA analytics TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA analytics TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA analytics TO postgres;
