import { Chain } from "@prisma/client";
import { prisma } from "./client.js";

async function main() {
  console.log("🌱 Seeding database...");

  // Seed some base tokens
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

  // Create a sample wallet
  const wallet = await prisma.wallet.create({
    data: {
      address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD40",
      chain: Chain.ETHEREUM,
      label: "Demo Wallet",
    },
  });

  console.log(`✅ Created demo wallet: ${wallet.address}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
