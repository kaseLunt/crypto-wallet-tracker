import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, type ReactNode, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, startIcon, endIcon, ...props }, ref) => {
    return (
      <div className="relative">
        {startIcon && (
          <div className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground">
            {startIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus-visible:ring-destructive",
            startIcon && "pl-10",
            endIcon && "pr-10",
            className,
          )}
          ref={ref}
          {...props}
        />
        {endIcon && (
          <div className="-translate-y-1/2 absolute top-1/2 right-3 text-muted-foreground">
            {endIcon}
          </div>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
