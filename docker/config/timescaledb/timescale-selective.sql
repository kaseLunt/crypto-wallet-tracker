-- Enable TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Important: We'll only convert tables that:
-- 1. Don't have foreign key references to their primary key
-- 2. Are truly time-series data

-- For now, let's only convert the analytics tables which are pure time-series
DO $$
BEGIN
    -- Check if token_prices is already a hypertable
    IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'analytics' AND hypertable_name = 'token_prices'
    ) THEN
        RAISE NOTICE '[token_prices] Converting to hypertable...';

        -- Since token_prices has no foreign keys referencing it, we can safely convert it
        -- First, drop the primary key constraint
        ALTER TABLE analytics.token_prices DROP CONSTRAINT IF EXISTS token_prices_pkey CASCADE;

        -- Create hypertable
        PERFORM create_hypertable('analytics.token_prices', 'time',
            chunk_time_interval => INTERVAL '1 week',
            if_not_exists => TRUE
        );

        -- Add a composite primary key that includes time
        ALTER TABLE analytics.token_prices
            ADD CONSTRAINT token_prices_pkey PRIMARY KEY (id, time);

        -- Keep the unique constraint for deduplication
        ALTER TABLE analytics.token_prices DROP CONSTRAINT IF EXISTS token_prices_time_token_id_key;
        ALTER TABLE analytics.token_prices
            ADD CONSTRAINT token_prices_time_token_unique
            UNIQUE (time, token_id);

        -- Create useful indexes
        CREATE INDEX IF NOT EXISTS idx_token_prices_token_time
            ON analytics.token_prices (token_id, time DESC);

        RAISE NOTICE '[token_prices] Successfully converted to hypertable!';
    ELSE
        RAISE NOTICE '[token_prices] Already a hypertable, skipping.';
    END IF;

    -- Check if wallet_snapshots is already a hypertable
    IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'analytics' AND hypertable_name = 'wallet_snapshots'
    ) THEN
        RAISE NOTICE '[wallet_snapshots] Converting to hypertable...';

        -- Drop the primary key constraint
        ALTER TABLE analytics.wallet_snapshots DROP CONSTRAINT IF EXISTS wallet_snapshots_pkey CASCADE;

        -- Create hypertable
        PERFORM create_hypertable('analytics.wallet_snapshots', 'time',
            chunk_time_interval => INTERVAL '1 week',
            if_not_exists => TRUE
        );

        -- Add a composite primary key that includes time
        ALTER TABLE analytics.wallet_snapshots
            ADD CONSTRAINT wallet_snapshots_pkey PRIMARY KEY (id, time);

        -- Keep the unique constraint
        ALTER TABLE analytics.wallet_snapshots DROP CONSTRAINT IF EXISTS wallet_snapshots_time_wallet_id_key;
        ALTER TABLE analytics.wallet_snapshots
            ADD CONSTRAINT wallet_snapshots_time_wallet_unique
            UNIQUE (time, wallet_id);

        -- Create useful indexes
        CREATE INDEX IF NOT EXISTS idx_wallet_snapshots_wallet_time
            ON analytics.wallet_snapshots (wallet_id, time DESC);

        RAISE NOTICE '[wallet_snapshots] Successfully converted to hypertable!';
    ELSE
        RAISE NOTICE '[wallet_snapshots] Already a hypertable, skipping.';
    END IF;
END $$;

-- For the transactions table, we'll keep it as a regular table for now
DO $$
BEGIN
    RAISE NOTICE '[transactions] Keeping as regular table due to foreign key dependencies.';
    RAISE NOTICE 'Consider partitioning by time using PostgreSQL native partitioning instead.';

    -- Ensure we have good indexes for time-based queries
    CREATE INDEX IF NOT EXISTS idx_transactions_time
        ON crypto.transactions (time DESC);
    CREATE INDEX IF NOT EXISTS idx_transactions_wallet_time
        ON crypto.transactions (wallet_id, time DESC);
END $$;

-- Enable compression on hypertables (optional but recommended)
DO $$
DECLARE
    compression_job_id INTEGER;
BEGIN
    -- Compress data older than 1 month for token_prices
    IF EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'analytics' AND hypertable_name = 'token_prices'
    ) THEN
        ALTER TABLE analytics.token_prices SET (
            timescaledb.compress,
            timescaledb.compress_segmentby = 'token_id'
        );

        -- Check if compression policy already exists
        IF NOT EXISTS (
            SELECT 1 FROM timescaledb_information.jobs
            WHERE proc_name = 'policy_compression'
            AND hypertable_name = 'token_prices'
        ) THEN
            SELECT add_compression_policy('analytics.token_prices', INTERVAL '1 month') INTO compression_job_id;
            RAISE NOTICE 'Added compression policy for token_prices with job_id: %', compression_job_id;
        END IF;
    END IF;

    -- Compress data older than 1 month for wallet_snapshots
    IF EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'analytics' AND hypertable_name = 'wallet_snapshots'
    ) THEN
        ALTER TABLE analytics.wallet_snapshots SET (
            timescaledb.compress,
            timescaledb.compress_segmentby = 'wallet_id'
        );

        -- Check if compression policy already exists
        IF NOT EXISTS (
            SELECT 1 FROM timescaledb_information.jobs
            WHERE proc_name = 'policy_compression'
            AND hypertable_name = 'wallet_snapshots'
        ) THEN
            SELECT add_compression_policy('analytics.wallet_snapshots', INTERVAL '1 month') INTO compression_job_id;
            RAISE NOTICE 'Added compression policy for wallet_snapshots with job_id: %', compression_job_id;
        END IF;
    END IF;
END $$;

-- Show results
SELECT 'Hypertables created: ' || COUNT(*)
FROM timescaledb_information.hypertables
WHERE hypertable_schema IN ('crypto', 'analytics');

-- Show hypertable details
SELECT
    hypertable_schema,
    hypertable_name,
    compression_enabled
FROM timescaledb_information.hypertables
WHERE hypertable_schema IN ('crypto', 'analytics')
ORDER BY hypertable_schema, hypertable_name;
