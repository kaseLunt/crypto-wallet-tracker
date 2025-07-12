// packages/core/src/db/seed.ts
import { Chain } from "@prisma/client";
import { prisma } from "./client.js";

async function main() {
  console.log("🌱 Seeding database...");

  // Seed tokens (unchanged)
  const tokens = await Promise.all([
    prisma.token.upsert({
      where: {
        contractAddress_chain: {
          contractAddress: "0x0000000000000000000000000000000000000000",
          chain: Chain.ETHEREUM,
        },
      },
      update: {},
      create: {
        symbol: "ETH",
        name: "Ethereum",
        contractAddress: "0x0000000000000000000000000000000000000000",
        chain: Chain.ETHEREUM,
        decimals: 18,
        coingeckoId: "ethereum",
      },
    }),
    prisma.token.upsert({
      where: {
        contractAddress_chain: {
          contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          chain: Chain.ETHEREUM,
        },
      },
      update: {},
      create: {
        symbol: "USDC",
        name: "USD Coin",
        contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        chain: Chain.ETHEREUM,
        decimals: 6,
        coingeckoId: "usd-coin",
      },
    }),
  ]);

  console.log(`✅ Seeded ${tokens.length} tokens`);

  // NEW: Seed a test wallet
  const wallet = await prisma.wallet.upsert({
    where: {
      address_chain: {
        address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD40",
        chain: Chain.ETHEREUM,
      },
    },
    update: {
      label: "Demo Wallet",
      isActive: true,
    },
    create: {
      address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD40",
      chain: Chain.ETHEREUM,
      label: "Demo Wallet",
      isActive: true,
    },
  });
  console.log(`✅ Created/Updated demo wallet: ${wallet.address}`);

  // NEW: Seed a test transaction (for reorg testing)
  const testTransaction = await prisma.transaction.create({
    data: {
      time: new Date(),
      walletId: wallet.id,
      hash: "0x_test_transaction_hash",
      chain: Chain.ETHEREUM,
      fromAddress: "0x_from",
      toAddress: "0x_to",
      amount: "1000000000000000000", // 1 ETH in wei
      blockNumber: 100, // Arbitrary block for testing
      status: "CONFIRMED",
      type: "TRANSFER",
    },
  });
  console.log(`✅ Seeded test transaction: ${testTransaction.hash}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
