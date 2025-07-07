import { cn, formatCryptoAmount, formatUSD } from "@/lib/utils";
import { Badge } from "../ui/badge";

interface TokenBadgeProps {
  symbol: string;
  name?: string;
  logoUrl?: string;
  balance?: string;
  balanceUSD?: number;
  priceChange24h?: number;
  size?: "sm" | "default" | "lg";
  showBalance?: boolean;
  showPrice?: boolean;
  className?: string;
}

export function TokenBadge({
  symbol,
  name,
  logoUrl,
  balance,
  balanceUSD,
  priceChange24h,
  size = "default",
  showBalance = false,
  showPrice = false,
  className,
}: TokenBadgeProps) {
  const isPositiveChange = priceChange24h && priceChange24h > 0;
  const isNegativeChange = priceChange24h && priceChange24h < 0;

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className="flex items-center space-x-2">
        {logoUrl && (
          <img
            src={logoUrl}
            alt={`${symbol} logo`}
            className={cn(
              "rounded-full",
              size === "sm" && "h-4 w-4",
              size === "default" && "h-6 w-6",
              size === "lg" && "h-8 w-8",
            )}
          />
        )}
        <div className="flex flex-col">
          <div className="flex items-center space-x-1">
            <Badge variant="outline" size={size}>
              {symbol}
            </Badge>
            {name && size !== "sm" && <span className="text-muted-foreground text-xs">{name}</span>}
          </div>
          {showPrice && priceChange24h !== undefined && (
            <div
              className={cn(
                "font-medium text-xs",
                isPositiveChange && "text-crypto-green",
                isNegativeChange && "text-red-500",
              )}
            >
              {isPositiveChange && "+"}
              {priceChange24h.toFixed(2)}%
            </div>
          )}
        </div>
      </div>

      {showBalance && balance && (
        <div className="flex flex-col items-end">
          <div className="font-medium text-sm">
            {formatCryptoAmount(balance)} {symbol}
          </div>
          {balanceUSD && (
            <div className="text-muted-foreground text-xs">{formatUSD(balanceUSD)}</div>
          )}
        </div>
      )}
    </div>
  );
}
