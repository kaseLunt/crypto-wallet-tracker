#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_step() {
    echo -e "\n${BLUE}▶${NC} $1"
}

echo "🧪 Testing TimescaleDB Functionality"
echo "===================================="

# Create test script
cat > docker/config/timescaledb/test-timescale.sql << 'EOF'
-- First, let's insert some test data to see TimescaleDB in action

-- Get a test token (or create one)
DO $$
DECLARE
    test_token_id UUID;
    test_wallet_id UUID;
BEGIN
    -- Get or create a test token (with all required fields)
    INSERT INTO crypto.tokens (symbol, name, chain, decimals, created_at, updated_at)
    VALUES ('TEST', 'Test Token', 'ETHEREUM', 18, NOW(), NOW())
    ON CONFLICT (contract_address, chain) DO UPDATE
        SET updated_at = NOW()
    RETURNING id INTO test_token_id;

    IF test_token_id IS NULL THEN
        SELECT id INTO test_token_id FROM crypto.tokens WHERE symbol = 'TEST' LIMIT 1;
    END IF;

    -- Get or create a test wallet (with all required fields)
    INSERT INTO crypto.wallets (address, chain, label, created_at, updated_at, is_active)
    VALUES ('0x' || encode(gen_random_bytes(20), 'hex'), 'ETHEREUM', 'Test Wallet', NOW(), NOW(), true)
    RETURNING id INTO test_wallet_id;

    -- Insert historical price data (last 30 days, every hour)
    RAISE NOTICE 'Inserting test price data for token %', test_token_id;
    INSERT INTO analytics.token_prices (id, time, token_id, price_usd, volume_24h_usd, source)
    SELECT
        gen_random_uuid(),
        ts as time,
        test_token_id,
        100 + (random() * 50) as price_usd,  -- Price between 100-150
        1000000 + (random() * 500000) as volume_24h_usd,
        'COINGECKO'
    FROM generate_series(
        NOW() - INTERVAL '30 days',
        NOW(),
        INTERVAL '1 hour'
    ) as ts
    ON CONFLICT (time, token_id) DO NOTHING;

    -- Insert wallet snapshots (last 30 days, daily)
    RAISE NOTICE 'Inserting test wallet snapshots for wallet %', test_wallet_id;
    INSERT INTO analytics.wallet_snapshots (id, time, wallet_id, total_value_usd, token_count)
    SELECT
        gen_random_uuid(),
        ts as time,
        test_wallet_id,
        10000 + (random() * 5000) as total_value_usd,  -- Value between 10k-15k
        5 + floor(random() * 10)::int as token_count
    FROM generate_series(
        NOW() - INTERVAL '30 days',
        NOW(),
        INTERVAL '1 day'
    ) as ts
    ON CONFLICT (time, wallet_id) DO NOTHING;

    -- Show what we inserted
    RAISE NOTICE 'Inserted % price records', (SELECT COUNT(*) FROM analytics.token_prices WHERE token_id = test_token_id);
    RAISE NOTICE 'Inserted % wallet snapshots', (SELECT COUNT(*) FROM analytics.wallet_snapshots WHERE wallet_id = test_wallet_id);
END $$;

-- Show that data is being stored in chunks
\echo
\echo '📊 Chunk Information (TimescaleDB partitions):'
SELECT
    ch.hypertable_name,
    ch.chunk_name,
    CASE
        WHEN ch.range_start IS NOT NULL THEN ch.range_start::text
        ELSE 'N/A'
    END as chunk_start,
    CASE
        WHEN ch.range_end IS NOT NULL THEN ch.range_end::text
        ELSE 'N/A'
    END as chunk_end,
    pg_size_pretty(
        COALESCE(
            pg_relation_size(format('%I.%I', ch.chunk_schema, ch.chunk_name)::regclass),
            0
        )
    ) as size
FROM timescaledb_information.chunks ch
WHERE ch.hypertable_schema = 'analytics'
ORDER BY ch.hypertable_name, ch.chunk_name DESC
LIMIT 10;

-- Show data distribution
\echo
\echo '📈 Data Distribution:'
SELECT
    'token_prices' as table_name,
    COUNT(*) as row_count,
    MIN(time)::date as oldest_data,
    MAX(time)::date as newest_data,
    pg_size_pretty(pg_relation_size('analytics.token_prices')) as table_size
FROM analytics.token_prices
UNION ALL
SELECT
    'wallet_snapshots' as table_name,
    COUNT(*) as row_count,
    MIN(time)::date as oldest_data,
    MAX(time)::date as newest_data,
    pg_size_pretty(pg_relation_size('analytics.wallet_snapshots')) as table_size
FROM analytics.wallet_snapshots;

-- Test time-based query performance
\echo
\echo '⚡ Testing TimescaleDB query performance:'
\echo 'Query: Last 7 days of price data:'

-- Check how many chunks are touched
WITH query_chunks AS (
    SELECT COUNT(DISTINCT ch.chunk_name) as chunks_touched
    FROM analytics.token_prices tp
    JOIN timescaledb_information.chunks ch
        ON ch.hypertable_schema = 'analytics'
        AND ch.hypertable_name = 'token_prices'
    WHERE tp.time > NOW() - INTERVAL '7 days'
)
SELECT
    'Chunks touched for 7-day query: ' || COALESCE(chunks_touched::text, '0')
FROM query_chunks;

-- Show the execution plan
EXPLAIN (ANALYZE, BUFFERS, SUMMARY)
SELECT
    time_bucket('1 hour', time) as hour,
    AVG(price_usd) as avg_price,
    MAX(price_usd) as max_price,
    MIN(price_usd) as min_price
FROM analytics.token_prices
WHERE time > NOW() - INTERVAL '7 days'
GROUP BY hour
ORDER BY hour DESC
LIMIT 24;

-- Create or refresh continuous aggregate
\echo
\echo '🔄 Continuous aggregate management:'
DROP MATERIALIZED VIEW IF EXISTS token_prices_hourly CASCADE;

CREATE MATERIALIZED VIEW token_prices_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS hour,
    token_id,
    AVG(price_usd) as avg_price,
    MAX(price_usd) as high_price,
    MIN(price_usd) as low_price,
    AVG(volume_24h_usd) as avg_volume
FROM analytics.token_prices
GROUP BY hour, token_id;

-- Refresh the continuous aggregate with recent data
CALL refresh_continuous_aggregate('token_prices_hourly', NULL, NULL);

-- Query the continuous aggregate
\echo
\echo '📊 Querying continuous aggregate:'
SELECT
    hour::date as day,
    COUNT(*) as data_points,
    AVG(avg_price)::numeric(10,2) as daily_avg_price,
    MIN(low_price)::numeric(10,2) as daily_low,
    MAX(high_price)::numeric(10,2) as daily_high
FROM token_prices_hourly
WHERE hour > NOW() - INTERVAL '7 days'
GROUP BY day
ORDER BY day DESC
LIMIT 7;

-- Show hypertable statistics
\echo
\echo '📊 Hypertable Statistics:'
SELECT
    ht.hypertable_name,
    ht.compression_enabled,
    COUNT(DISTINCT ch.chunk_name) as total_chunks,
    COUNT(DISTINCT ch.chunk_name) FILTER (WHERE ch.is_compressed) as compressed_chunks,
    pg_size_pretty(
        SUM(
            COALESCE(
                pg_relation_size(format('%I.%I', ch.chunk_schema, ch.chunk_name)::regclass),
                0
            )
        )
    ) as total_size
FROM timescaledb_information.hypertables ht
LEFT JOIN timescaledb_information.chunks ch
    ON ht.hypertable_schema = ch.hypertable_schema
    AND ht.hypertable_name = ch.hypertable_name
WHERE ht.hypertable_schema = 'analytics'
GROUP BY ht.hypertable_name, ht.compression_enabled;

-- Show compression policies
\echo
\echo '🗜️ Compression Policies:'
SELECT
    j.hypertable_name,
    j.config ->> 'compress_after' as compress_after_interval,
    j.schedule_interval,
    j.next_start
FROM timescaledb_information.jobs j
WHERE j.proc_name = 'policy_compression'
ORDER BY j.hypertable_name;

-- Final summary
\echo
\echo '✅ TimescaleDB Feature Summary:'
SELECT
    'Hypertables' as feature,
    COUNT(*)::text as count,
    string_agg(hypertable_schema || '.' || hypertable_name, ', ') as details
FROM timescaledb_information.hypertables
WHERE hypertable_schema = 'analytics'
UNION ALL
SELECT
    'Continuous Aggregates' as feature,
    COUNT(*)::text as count,
    string_agg(view_name, ', ') as details
FROM timescaledb_information.continuous_aggregates
UNION ALL
SELECT
    'Total Chunks' as feature,
    COUNT(*)::text as count,
    'Across all hypertables' as details
FROM timescaledb_information.chunks
WHERE hypertable_schema = 'analytics'
UNION ALL
SELECT
    'Data Points' as feature,
    to_char(
        (SELECT COUNT(*) FROM analytics.token_prices) +
        (SELECT COUNT(*) FROM analytics.wallet_snapshots),
        'FM999,999'
    ) as count,
    'Total rows in hypertables' as details;

-- Performance tip
\echo
\echo '💡 Performance Tip:'
\echo 'TimescaleDB automatically partitions your data into chunks.'
\echo 'Queries that filter by time will only scan relevant chunks, making them much faster!'
EOF

# Run the test
log_step "Running TimescaleDB tests..."
docker compose exec -T timescaledb psql -U postgres -d crypto_tracker < docker/config/timescaledb/test-timescale.sql

log_info "Test complete!"

# Quick verification
log_step "Quick verification of data:"
docker compose exec timescaledb psql -U postgres -d crypto_tracker -c "
SELECT
    'analytics.token_prices' as table_name,
    COUNT(*) as rows,
    COUNT(DISTINCT date_trunc('day', time)) as days_of_data
FROM analytics.token_prices
UNION ALL
SELECT
    'analytics.wallet_snapshots',
    COUNT(*),
    COUNT(DISTINCT date_trunc('day', time))
FROM analytics.wallet_snapshots;"

echo ""
echo "✅ If you see data in the tables above, TimescaleDB is working correctly!"
echo "   The data is automatically partitioned into chunks for optimal performance."