#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
# shellcheck disable=SC2034
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_step() {
    echo -e "\n${BLUE}▶${NC} $1"
}

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-crypto_tracker}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"

# Helper function to run SQL
run_sql() {
    docker compose exec -T timescaledb psql -U "$DB_USER" -d "$DB_NAME" -c "$1" 2>/dev/null
}

run_sql_file() {
    docker compose exec -T timescaledb psql -U "$DB_USER" -d "$DB_NAME" -f "$1" 2>/dev/null
}

echo "🗄️  TimescaleDB Initialization"
echo "============================"

# Step 1: Check if database exists
log_step "Checking database connection..."
if ! docker compose exec -T timescaledb pg_isready -U "$DB_USER" >/dev/null 2>&1; then
    log_error "Database is not running. Run 'pnpm docker:start' first."
    exit 1
fi

# Step 2: Create TimescaleDB-specific setup SQL
log_step "Creating TimescaleDB setup script..."

cat > docker/config/timescaledb/post-init.sql << 'EOF'
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
EOF

# Step 3: Execute the setup
log_step "Running TimescaleDB setup..."

if docker compose exec -T timescaledb psql -U "$DB_USER" -d "$DB_NAME" -f /docker-entrypoint-initdb.d/post-init.sql 2>/dev/null; then
    log_info "TimescaleDB features initialized"
else
    # If the file mapping doesn't work, execute directly
    docker compose exec -T timescaledb psql -U "$DB_USER" -d "$DB_NAME" < docker/config/timescaledb/post-init.sql
fi

# Step 4: Verify setup
log_step "Verifying TimescaleDB setup..."

# Check if hypertables were created
HYPERTABLE_COUNT=$(run_sql "SELECT COUNT(*) FROM timescaledb_information.hypertables WHERE hypertable_schema IN ('crypto', 'analytics');" | grep -E '^\s*[0-9]+' | tr -d ' ')

if [ "$HYPERTABLE_COUNT" -gt 0 ]; then
    log_info "Found $HYPERTABLE_COUNT hypertables"
else
    log_error "No hypertables found - TimescaleDB may not be properly initialized"
fi

# Check continuous aggregates
CAGG_COUNT=$(run_sql "SELECT COUNT(*) FROM timescaledb_information.continuous_aggregates;" | grep -E '^\s*[0-9]+' | tr -d ' ')

if [ "$CAGG_COUNT" -gt 0 ]; then
    log_info "Found $CAGG_COUNT continuous aggregates"
fi

# Step 5: Show TimescaleDB info
log_step "TimescaleDB Configuration Summary"

echo "Hypertables:"
run_sql "SELECT hypertable_schema, hypertable_name, chunk_time_interval FROM timescaledb_information.hypertables WHERE hypertable_schema IN ('crypto', 'analytics');"

echo -e "\nContinuous Aggregates:"
run_sql "SELECT view_schema, view_name, refresh_interval FROM timescaledb_information.continuous_aggregates;"

echo -e "\nCompression Policies:"
run_sql "SELECT hypertable_schema, hypertable_name, compress_after FROM timescaledb_information.compression_settings;"

log_info "TimescaleDB initialization complete!"