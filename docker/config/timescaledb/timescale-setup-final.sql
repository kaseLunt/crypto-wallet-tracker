-- Enable TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Convert tables to hypertables
DO $$
DECLARE
    constraint_rec RECORD;
BEGIN
    RAISE NOTICE 'Starting TimescaleDB setup...';

    -- Handle token_prices table
    IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'analytics' AND hypertable_name = 'token_prices'
    ) THEN
        RAISE NOTICE '[token_prices] Converting to hypertable...';

        -- Drop all constraints
        FOR constraint_rec IN
            SELECT conname
            FROM pg_constraint
            WHERE conrelid = 'analytics.token_prices'::regclass
        LOOP
            EXECUTE format('ALTER TABLE analytics.token_prices DROP CONSTRAINT %I CASCADE', constraint_rec.conname);
        END LOOP;

        -- Create hypertable
        PERFORM create_hypertable('analytics.token_prices', 'time');

        -- Add back necessary constraints
        ALTER TABLE analytics.token_prices ADD CONSTRAINT token_prices_time_token_id_unique UNIQUE (time, token_id);

        RAISE NOTICE '[token_prices] Successfully converted to hypertable.';
    ELSE
        RAISE NOTICE '[token_prices] Already a hypertable.';
    END IF;

    -- Handle wallet_snapshots table
    IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'analytics' AND hypertable_name = 'wallet_snapshots'
    ) THEN
        RAISE NOTICE '[wallet_snapshots] Converting to hypertable...';

        -- Drop all constraints
        FOR constraint_rec IN
            SELECT conname
            FROM pg_constraint
            WHERE conrelid = 'analytics.wallet_snapshots'::regclass
        LOOP
            EXECUTE format('ALTER TABLE analytics.wallet_snapshots DROP CONSTRAINT %I CASCADE', constraint_rec.conname);
        END LOOP;

        -- Create hypertable
        PERFORM create_hypertable('analytics.wallet_snapshots', 'time');

        -- Add back necessary constraints
        ALTER TABLE analytics.wallet_snapshots ADD CONSTRAINT wallet_snapshots_time_wallet_id_unique UNIQUE (time, wallet_id);

        RAISE NOTICE '[wallet_snapshots] Successfully converted to hypertable.';
    ELSE
        RAISE NOTICE '[wallet_snapshots] Already a hypertable.';
    END IF;

    -- Handle transactions table
    IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'crypto' AND hypertable_name = 'transactions'
    ) THEN
        RAISE NOTICE '[transactions] Beginning conversion...';

        -- First, save foreign key definitions before dropping them
        RAISE NOTICE '[transactions] Saving foreign key relationships...';

        -- Drop dependent foreign keys
        ALTER TABLE crypto.token_transfers DROP CONSTRAINT IF EXISTS token_transfers_transaction_id_fkey CASCADE;
        ALTER TABLE crypto.nft_transfers DROP CONSTRAINT IF EXISTS nft_transfers_transaction_id_fkey CASCADE;

        -- Drop all constraints on transactions table
        RAISE NOTICE '[transactions] Dropping all constraints...';
        FOR constraint_rec IN
            SELECT conname
            FROM pg_constraint
            WHERE conrelid = 'crypto.transactions'::regclass
        LOOP
            EXECUTE format('ALTER TABLE crypto.transactions DROP CONSTRAINT %I CASCADE', constraint_rec.conname);
            RAISE NOTICE '  Dropped: %', constraint_rec.conname;
        END LOOP;

        -- Create hypertable
        RAISE NOTICE '[transactions] Creating hypertable...';
        PERFORM create_hypertable('crypto.transactions', 'time');

        -- Add back necessary constraints
        RAISE NOTICE '[transactions] Re-creating constraints...';

        -- Unique constraint for deduplication (including time for TimescaleDB compatibility)
        ALTER TABLE crypto.transactions ADD CONSTRAINT transactions_hash_chain_time_unique
            UNIQUE (hash, chain, time);

        -- Create index on id for foreign key performance (NOT unique)
        CREATE INDEX idx_transactions_id ON crypto.transactions(id);

        -- Re-add foreign key constraints
        ALTER TABLE crypto.transactions
            ADD CONSTRAINT transactions_wallet_id_fkey
            FOREIGN KEY (wallet_id) REFERENCES crypto.wallets(id);

        ALTER TABLE crypto.transactions
            ADD CONSTRAINT transactions_token_id_fkey
            FOREIGN KEY (token_id) REFERENCES crypto.tokens(id);

        -- Re-create foreign keys from other tables
        ALTER TABLE crypto.token_transfers
            ADD CONSTRAINT token_transfers_transaction_id_fkey
            FOREIGN KEY (transaction_id) REFERENCES crypto.transactions(id);

        ALTER TABLE crypto.nft_transfers
            ADD CONSTRAINT nft_transfers_transaction_id_fkey
            FOREIGN KEY (transaction_id) REFERENCES crypto.transactions(id);

        RAISE NOTICE '[transactions] Successfully converted to hypertable.';
    ELSE
        RAISE NOTICE '[transactions] Already a hypertable.';
    END IF;

    -- Set chunk intervals
    PERFORM set_chunk_time_interval('crypto.transactions', INTERVAL '1 week');
    PERFORM set_chunk_time_interval('analytics.token_prices', INTERVAL '1 day');
    PERFORM set_chunk_time_interval('analytics.wallet_snapshots', INTERVAL '1 week');

END $$;

-- Create continuous aggregates if they don't exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'analytics' AND hypertable_name = 'token_prices'
    ) AND NOT EXISTS (
        SELECT 1 FROM timescaledb_information.continuous_aggregates
        WHERE view_name = 'hourly_token_prices'
    ) THEN
        CREATE MATERIALIZED VIEW analytics.hourly_token_prices
        WITH (timescaledb.continuous) AS
        SELECT
            time_bucket('1 hour', time) AS hour,
            token_id,
            FIRST(price_usd, time) AS open_price,
            MAX(price_usd) AS high_price,
            MIN(price_usd) AS low_price,
            LAST(price_usd, time) AS close_price,
            AVG(price_usd) AS avg_price,
            SUM(volume_24h_usd) as total_volume
        FROM analytics.token_prices
        GROUP BY hour, token_id
        WITH NO DATA;

        PERFORM add_continuous_aggregate_policy('analytics.hourly_token_prices',
            start_offset => INTERVAL '3 hours',
            end_offset => INTERVAL '1 hour',
            schedule_interval => INTERVAL '1 hour',
            if_not_exists => TRUE
        );

        RAISE NOTICE 'Created continuous aggregate: hourly_token_prices';
    END IF;
END $$;

-- Add compression policies (only if hypertables exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM timescaledb_information.hypertables WHERE hypertable_schema = 'crypto' AND hypertable_name = 'transactions') THEN
        PERFORM add_compression_policy('crypto.transactions', INTERVAL '30 days', if_not_exists => TRUE);
    END IF;

    IF EXISTS (SELECT 1 FROM timescaledb_information.hypertables WHERE hypertable_schema = 'analytics' AND hypertable_name = 'token_prices') THEN
        PERFORM add_compression_policy('analytics.token_prices', INTERVAL '7 days', if_not_exists => TRUE);
    END IF;

    IF EXISTS (SELECT 1 FROM timescaledb_information.hypertables WHERE hypertable_schema = 'analytics' AND hypertable_name = 'wallet_snapshots') THEN
        PERFORM add_compression_policy('analytics.wallet_snapshots', INTERVAL '30 days', if_not_exists => TRUE);
    END IF;
END $$;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_time ON crypto.transactions (wallet_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_token_prices_token_time ON analytics.token_prices (token_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_snapshots_wallet_time ON analytics.wallet_snapshots (wallet_id, time DESC);

-- Show summary
SELECT 'Hypertables created: ' || COUNT(*) FROM timescaledb_information.hypertables WHERE hypertable_schema IN ('crypto', 'analytics');
