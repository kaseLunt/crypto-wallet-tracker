-- Enable TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- The nuclear option for transactions table
DO $$
DECLARE
    idx RECORD;
    cons RECORD;
BEGIN
    -- Only proceed if not already a hypertable
    IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'crypto' AND hypertable_name = 'transactions'
    ) THEN
        RAISE NOTICE '[transactions] Starting nuclear conversion...';

        -- Step 1: Drop foreign keys that reference this table
        RAISE NOTICE '[transactions] Dropping referencing foreign keys...';
        ALTER TABLE crypto.token_transfers DROP CONSTRAINT IF EXISTS token_transfers_transaction_id_fkey CASCADE;
        ALTER TABLE crypto.nft_transfers DROP CONSTRAINT IF EXISTS nft_transfers_transaction_id_fkey CASCADE;

        -- Step 2: Drop ALL indexes (including unique ones)
        RAISE NOTICE '[transactions] Dropping ALL indexes...';
        FOR idx IN
            SELECT indexname
            FROM pg_indexes
            WHERE tablename = 'transactions'
            AND schemaname = 'crypto'
            AND indexname NOT LIKE '%_pkey'  -- We'll handle primary keys separately
        LOOP
            EXECUTE format('DROP INDEX IF EXISTS crypto.%I CASCADE', idx.indexname);
            RAISE NOTICE '  Dropped index: %', idx.indexname;
        END LOOP;

        -- Step 3: Drop ALL constraints
        RAISE NOTICE '[transactions] Dropping ALL constraints...';
        FOR cons IN
            SELECT conname
            FROM pg_constraint
            WHERE conrelid = 'crypto.transactions'::regclass
        LOOP
            EXECUTE format('ALTER TABLE crypto.transactions DROP CONSTRAINT IF EXISTS %I CASCADE', cons.conname);
            RAISE NOTICE '  Dropped constraint: %', cons.conname;
        END LOOP;

        -- Step 4: Now the table should be completely clean. Create hypertable
        RAISE NOTICE '[transactions] Creating hypertable (this should work now)...';
        PERFORM create_hypertable('crypto.transactions', 'time',
            chunk_time_interval => INTERVAL '1 week',
            if_not_exists => TRUE
        );

        -- Step 5: Add back ONLY what we need
        RAISE NOTICE '[transactions] Adding back constraints and indexes...';

        -- IMPORTANT: We cannot have a primary key on just 'id' with TimescaleDB
        -- Instead, we'll use a UNIQUE index on id (which allows nulls but we know id is NOT NULL)
        CREATE UNIQUE INDEX transactions_id_key ON crypto.transactions(id);

        -- Add unique constraint that includes time (required by TimescaleDB)
        ALTER TABLE crypto.transactions
            ADD CONSTRAINT transactions_time_hash_chain_unique
            UNIQUE (time, hash, chain);

        -- Re-add foreign key constraints
        ALTER TABLE crypto.transactions
            ADD CONSTRAINT transactions_wallet_id_fkey
            FOREIGN KEY (wallet_id) REFERENCES crypto.wallets(id);

        ALTER TABLE crypto.transactions
            ADD CONSTRAINT transactions_token_id_fkey
            FOREIGN KEY (token_id) REFERENCES crypto.tokens(id);

        -- Re-create foreign keys from other tables (they can reference the unique index)
        ALTER TABLE crypto.token_transfers
            ADD CONSTRAINT token_transfers_transaction_id_fkey
            FOREIGN KEY (transaction_id) REFERENCES crypto.transactions(id);

        ALTER TABLE crypto.nft_transfers
            ADD CONSTRAINT nft_transfers_transaction_id_fkey
            FOREIGN KEY (transaction_id) REFERENCES crypto.transactions(id);

        -- Create useful indexes
        CREATE INDEX idx_transactions_time ON crypto.transactions (time DESC);
        CREATE INDEX idx_transactions_wallet_time ON crypto.transactions (wallet_id, time DESC);
        CREATE INDEX idx_transactions_block_number ON crypto.transactions (block_number);

        RAISE NOTICE '[transactions] Successfully converted to hypertable!';
    ELSE
        RAISE NOTICE '[transactions] Already a hypertable, skipping.';
    END IF;
END $$;

-- Handle token_prices table
DO $$
DECLARE
    idx RECORD;
    cons RECORD;
BEGIN
    -- Only proceed if not already a hypertable
    IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'analytics' AND hypertable_name = 'token_prices'
    ) THEN
        RAISE NOTICE '[token_prices] Starting conversion...';

        -- Drop all indexes first
        FOR idx IN
            SELECT indexname
            FROM pg_indexes
            WHERE tablename = 'token_prices'
            AND schemaname = 'analytics'
            AND indexname NOT LIKE '%_pkey'
        LOOP
            EXECUTE format('DROP INDEX IF EXISTS analytics.%I CASCADE', idx.indexname);
            RAISE NOTICE '  Dropped index: %', idx.indexname;
        END LOOP;

        -- Drop all constraints
        FOR cons IN
            SELECT conname
            FROM pg_constraint
            WHERE conrelid = 'analytics.token_prices'::regclass
        LOOP
            EXECUTE format('ALTER TABLE analytics.token_prices DROP CONSTRAINT IF EXISTS %I CASCADE', cons.conname);
            RAISE NOTICE '  Dropped constraint: %', cons.conname;
        END LOOP;

        -- Create hypertable
        PERFORM create_hypertable('analytics.token_prices', 'time',
            chunk_time_interval => INTERVAL '1 week',
            if_not_exists => TRUE
        );

        -- Use unique index instead of primary key
        CREATE UNIQUE INDEX token_prices_id_key ON analytics.token_prices(id);

        -- Add unique constraint with time
        ALTER TABLE analytics.token_prices
            ADD CONSTRAINT token_prices_time_token_unique
            UNIQUE (time, token_id);

        -- Add foreign key
        ALTER TABLE analytics.token_prices
            ADD CONSTRAINT token_prices_token_id_fkey
            FOREIGN KEY (token_id) REFERENCES crypto.tokens(id);

        -- Create indexes
        CREATE INDEX idx_token_prices_token_time ON analytics.token_prices (token_id, time DESC);

        RAISE NOTICE '[token_prices] Converted to hypertable.';
    END IF;
END $$;

-- Handle wallet_snapshots table
DO $$
DECLARE
    idx RECORD;
    cons RECORD;
BEGIN
    -- Only proceed if not already a hypertable
    IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'analytics' AND hypertable_name = 'wallet_snapshots'
    ) THEN
        RAISE NOTICE '[wallet_snapshots] Starting conversion...';

        -- Drop all indexes first
        FOR idx IN
            SELECT indexname
            FROM pg_indexes
            WHERE tablename = 'wallet_snapshots'
            AND schemaname = 'analytics'
            AND indexname NOT LIKE '%_pkey'
        LOOP
            EXECUTE format('DROP INDEX IF EXISTS analytics.%I CASCADE', idx.indexname);
            RAISE NOTICE '  Dropped index: %', idx.indexname;
        END LOOP;

        -- Drop all constraints
        FOR cons IN
            SELECT conname
            FROM pg_constraint
            WHERE conrelid = 'analytics.wallet_snapshots'::regclass
        LOOP
            EXECUTE format('ALTER TABLE analytics.wallet_snapshots DROP CONSTRAINT IF EXISTS %I CASCADE', cons.conname);
            RAISE NOTICE '  Dropped constraint: %', cons.conname;
        END LOOP;

        -- Create hypertable
        PERFORM create_hypertable('analytics.wallet_snapshots', 'time',
            chunk_time_interval => INTERVAL '1 week',
            if_not_exists => TRUE
        );

        -- Use unique index instead of primary key
        CREATE UNIQUE INDEX wallet_snapshots_id_key ON analytics.wallet_snapshots(id);

        -- Add unique constraint with time
        ALTER TABLE analytics.wallet_snapshots
            ADD CONSTRAINT wallet_snapshots_time_wallet_unique
            UNIQUE (time, wallet_id);

        -- Add foreign key
        ALTER TABLE analytics.wallet_snapshots
            ADD CONSTRAINT wallet_snapshots_wallet_id_fkey
            FOREIGN KEY (wallet_id) REFERENCES crypto.wallets(id);

        -- Create indexes
        CREATE INDEX idx_wallet_snapshots_wallet_time ON analytics.wallet_snapshots (wallet_id, time DESC);

        RAISE NOTICE '[wallet_snapshots] Converted to hypertable.';
    END IF;
END $$;

-- Show what we created
SELECT 'Hypertables: ' || COUNT(*) FROM timescaledb_information.hypertables WHERE hypertable_schema IN ('crypto', 'analytics');
