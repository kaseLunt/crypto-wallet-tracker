import { cn, formatPercentage, formatUSD } from "@/lib/utils";
import { type LucideIcon, Minus, TrendingDown, TrendingUp } from "lucide-react";

interface PriceDisplayProps {
  price: number;
  change24h?: number;
  change24hPercent?: number;
  size?: "sm" | "default" | "lg";
  showTrend?: boolean;
  showIcon?: boolean;
  className?: string;
}

// Extract size classes mapping
const sizeClasses = {
  sm: "text-sm",
  default: "text-lg",
  lg: "text-2xl",
} as const;

// Extract helper functions
function getTrendIcon(isPositive?: boolean, isNegative?: boolean): LucideIcon {
  if (isPositive) {
    return TrendingUp;
  }
  if (isNegative) {
    return TrendingDown;
  }
  return Minus;
}

function getTrendColorClass(
  value: number | undefined,
  isPositive?: boolean,
  isNegative?: boolean,
): string {
  if (value === undefined) {
    if (isPositive) {
      return "text-crypto-green";
    }
    if (isNegative) {
      return "text-red-500";
    }
    return "text-muted-foreground";
  }

  if (value > 0) {
    return "text-crypto-green";
  }
  if (value < 0) {
    return "text-red-500";
  }
  return "text-muted-foreground";
}

export function PriceDisplay({
  price,
  change24h,
  change24hPercent,
  size = "default",
  showTrend = true,
  showIcon = true,
  className,
}: PriceDisplayProps) {
  const percentageData = change24hPercent ? formatPercentage(change24hPercent) : null;
  const shouldShowTrend = showTrend && (change24h !== undefined || percentageData);

  const TrendIcon = getTrendIcon(percentageData?.isPositive, percentageData?.isNegative);
  const iconColorClass = getTrendColorClass(
    undefined,
    percentageData?.isPositive,
    percentageData?.isNegative,
  );
  const changeColorClass = getTrendColorClass(change24h);
  const percentColorClass = getTrendColorClass(
    undefined,
    percentageData?.isPositive,
    percentageData?.isNegative,
  );

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className="flex flex-col">
        <div className={cn("font-bold", sizeClasses[size])}>{formatUSD(price)}</div>

        {shouldShowTrend && (
          <div className="flex items-center space-x-1">
            {showIcon && <TrendIcon className={cn("h-3 w-3", iconColorClass)} />}
            <div className="flex items-center space-x-1 text-xs">
              {change24h !== undefined && (
                <span className={cn("font-medium", changeColorClass)}>
                  {change24h > 0 && "+"}
                  {formatUSD(change24h)}
                </span>
              )}
              {percentageData && (
                <span className={cn("font-medium", percentColorClass)}>
                  ({percentageData.formatted})
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
