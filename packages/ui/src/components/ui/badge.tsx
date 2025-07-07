import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";
import type * as React from "react";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground border-border",
        success: "border-transparent bg-crypto-green text-white shadow hover:bg-crypto-green/80",
        warning: "border-transparent bg-crypto-orange text-white shadow hover:bg-crypto-orange/80",
        // Crypto-specific chain badges
        ethereum: "border-transparent bg-blue-500 text-white shadow hover:bg-blue-500/80",
        polygon: "border-transparent bg-purple-500 text-white shadow hover:bg-purple-500/80",
        arbitrum: "border-transparent bg-blue-600 text-white shadow hover:bg-blue-600/80",
        base: "border-transparent bg-blue-400 text-white shadow hover:bg-blue-400/80",
        optimism: "border-transparent bg-red-500 text-white shadow hover:bg-red-500/80",
        bsc: "border-transparent bg-yellow-500 text-black shadow hover:bg-yellow-500/80",
        avalanche: "border-transparent bg-red-600 text-white shadow hover:bg-red-600/80",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge, badgeVariants };
