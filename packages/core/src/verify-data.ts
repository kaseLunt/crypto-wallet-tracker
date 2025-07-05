import { prisma } from "./db/client.js";

async function verifyData() {
  console.log("📊 Database Contents:\n");

  // Check wallets
  const wallets = await prisma.wallet.findMany();
  console.log(`Wallets (${wallets.length}):`);
  wallets.forEach((w) => {
    console.log(`  - ${w.address} (${w.chain}) - ${w.label || "No label"}`);
  });

  // Check tokens
  const tokens = await prisma.token.findMany();
  console.log(`\nTokens (${tokens.length}):`);
  tokens.forEach((t) => {
    console.log(`  - ${t.symbol} (${t.name}) on ${t.chain}`);
  });

  // Check if we have TimescaleDB hypertables
  const hypertables = await prisma.$queryRaw`
    SELECT hypertable_name
    FROM timescaledb_information.hypertables
    WHERE hypertable_schema IN ('crypto', 'analytics')
  `;
  console.log(`\nTimescaleDB Hypertables:`, hypertables);
}

verifyData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
