import { cn, formatAddress, formatUSD } from "@/lib/utils";
import { Copy, ExternalLink, MoreVertical } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

interface WalletCardProps {
  address: string;
  chain: "ethereum" | "polygon" | "arbitrum" | "base" | "optimism" | "bsc" | "avalanche";
  balance: number;
  balanceChange24h?: number;
  label?: string;
  isActive?: boolean;
  loading?: boolean;
  error?: string;
  className?: string;
  onCopyAddress?: () => void;
  onViewExplorer?: () => void;
  onManage?: () => void;
}

export function WalletCard({
  address,
  chain,
  balance,
  balanceChange24h,
  label,
  isActive = true,
  loading = false,
  error,
  className,
  onCopyAddress,
  onViewExplorer,
  onManage,
}: WalletCardProps) {
  const isPositiveChange = balanceChange24h && balanceChange24h > 0;
  const isNegativeChange = balanceChange24h && balanceChange24h < 0;

  if (loading) {
    return (
      <Card className={cn("transition-all duration-200 hover:shadow-lg", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-6 w-16" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="mt-2 h-4 w-24" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-40" />
            <div className="flex items-center space-x-1">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("transition-all duration-200 hover:shadow-lg", className)}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:scale-[1.02] hover:shadow-lg",
        !isActive && "opacity-60",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <CardTitle className="font-medium text-sm">{label || "Wallet"}</CardTitle>
          {!isActive && (
            <Badge variant="outline" size="sm">
              Inactive
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <Badge variant={chain} size="sm">
            {chain.charAt(0).toUpperCase() + chain.slice(1)}
          </Badge>
          <Button variant="ghost" size="icon-sm" onClick={onManage} className="h-6 w-6">
            <MoreVertical className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="font-bold text-2xl">{formatUSD(balance)}</div>
          {balanceChange24h !== undefined && (
            <div
              className={cn(
                "font-medium text-sm",
                isPositiveChange && "text-crypto-green",
                isNegativeChange && "text-red-500",
              )}
            >
              {isPositiveChange && "+"}
              {formatUSD(balanceChange24h)} (24h)
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-muted-foreground text-xs">
            <span className="font-mono">{formatAddress(address)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon-sm" onClick={onCopyAddress} className="h-6 w-6">
              <Copy className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onViewExplorer} className="h-6 w-6">
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
