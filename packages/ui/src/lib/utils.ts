import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes with proper precedence
 * Uses clsx for conditional classes and tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format cryptocurrency addresses for display
 * Truncates long addresses to show first and last characters
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address) {
    return "";
  }
  if (address.length <= chars * 2 + 2) {
    return address;
  }
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format cryptocurrency amounts with proper decimal places
 */
export function formatCryptoAmount(
  amount: string | number,
  decimals = 18,
  displayDecimals = 4,
): string {
  const num = typeof amount === "string" ? Number.parseFloat(amount) : amount;
  if (Number.isNaN(num)) {
    return "0";
  }

  // Convert from wei-like units to human-readable
  const humanReadable = num / 10 ** decimals;

  // Format with appropriate decimal places
  return humanReadable.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: displayDecimals,
  });
}

/**
 * Format USD amounts with proper currency formatting
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format percentage changes with proper sign and color indication
 */
export function formatPercentage(percentage: number): {
  formatted: string;
  isPositive: boolean;
  isNegative: boolean;
} {
  const formatted = `${percentage >= 0 ? "+" : ""}${percentage.toFixed(2)}%`;
  return {
    formatted,
    isPositive: percentage > 0,
    isNegative: percentage < 0,
  };
}
