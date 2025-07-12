// packages/core/src/db/seed.ts
import { Chain } from "@prisma/client";
import { prisma } from "./client.js";

async function main() {
  console.log("🌱 Seeding database...");

  // Seed tokens
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
    prisma.token.upsert({
      where: {
        contractAddress_chain: {
          contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
          chain: Chain.ETHEREUM,
        },
      },
      update: {},
      create: {
        symbol: "USDT",
        name: "Tether",
        contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        chain: Chain.ETHEREUM,
        decimals: 6,
        coingeckoId: "tether",
      },
    }),
  ]);

  console.log(`✅ Seeded ${tokens.length} tokens`);

  // Seed a real test wallet (public address with recent activity for testing)
  const wallet = await prisma.wallet.upsert({
    where: {
      address_chain: {
        address: "0xd2674dA94285660c9b2353131bef2d8211369A4B",
        chain: Chain.ETHEREUM,
      },
    },
    update: {
      label: "Real Test Wallet",
      isActive: true,
    },
    create: {
      address: "0xd2674dA94285660c9b2353131bef2d8211369A4B",
      chain: Chain.ETHEREUM,
      label: "Real Test Wallet",
      isActive: true,
    },
  });
  console.log(`✅ Created/Updated real test wallet: ${wallet.address}`);

  // Seed a test transaction (for reorg testing)
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
