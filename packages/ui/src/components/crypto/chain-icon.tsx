import { cn } from "@/lib/utils";

interface ChainIconProps {
  chain: "ethereum" | "polygon" | "arbitrum" | "base" | "optimism" | "bsc" | "avalanche";
  size?: "sm" | "default" | "lg";
  className?: string;
}

const chainColors = {
  ethereum: "bg-blue-500",
  polygon: "bg-purple-500",
  arbitrum: "bg-blue-600",
  base: "bg-blue-400",
  optimism: "bg-red-500",
  bsc: "bg-yellow-500",
  avalanche: "bg-red-600",
} as const;

const chainLabels = {
  ethereum: "ETH",
  polygon: "MATIC",
  arbitrum: "ARB",
  base: "BASE",
  optimism: "OP",
  bsc: "BSC",
  avalanche: "AVAX",
} as const;

export function ChainIcon({ chain, size = "default", className }: ChainIconProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-bold text-white",
        chainColors[chain],
        size === "sm" && "h-6 w-6 text-xs",
        size === "default" && "h-8 w-8 text-sm",
        size === "lg" && "h-10 w-10 text-base",
        className,
      )}
    >
      {chainLabels[chain]}
    </div>
  );
}
