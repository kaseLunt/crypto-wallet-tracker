import { prisma } from "./db/client.js";
import { Prisma } from "@prisma/client";

async function testPrismaV6() {
  console.log("Testing Prisma v6...");

  // Test basic query
  const wallets = await prisma.wallet.findMany({
    take: 5,
  });
  console.log(`Found ${wallets.length} wallets`);

  // Test v6 strict mode behavior with a valid UUID format
  try {
    // Use a valid UUID format (even though it doesn't exist)
    const wallet = await prisma.wallet.findFirstOrThrow({
      where: { id: "00000000-0000-0000-0000-000000000000" },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      console.log("✅ Correctly caught P2025 error (v6 behavior)");
    } else {
      console.log("Error:", error);
    }
  }

  // Test creating a wallet
  console.log("\nTesting wallet creation...");
  const newWallet = await prisma.wallet.create({
    data: {
      address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD40",
      chain: "ETHEREUM",
      label: "Test Wallet v6",
    },
  });
  console.log("✅ Created wallet:", newWallet.address);

  // Test querying with proper UUID
  const foundWallet = await prisma.wallet.findUnique({
    where: { id: newWallet.id },
  });
  console.log("✅ Found wallet by ID:", foundWallet?.address);

  // Clean up
  await prisma.wallet.delete({
    where: { id: newWallet.id },
  });
  console.log("✅ Cleaned up test wallet");

  console.log("\n✅ Prisma v6 is working correctly!");
}

testPrismaV6()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
