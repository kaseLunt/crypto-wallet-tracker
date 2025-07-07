import { cn } from "@/lib/utils";
import {
  Root as Tooltip,
  Content as TooltipContentPrimitive,
  Provider as TooltipProvider,
  Trigger as TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef } from "react";

const TooltipContent = forwardRef<
  ComponentRef<typeof TooltipContentPrimitive>,
  ComponentPropsWithoutRef<typeof TooltipContentPrimitive>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipContentPrimitive
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "fade-in-0 zoom-in-95 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 animate-in overflow-hidden rounded-md bg-primary px-3 py-1.5 text-primary-foreground text-xs data-[state=closed]:animate-out",
      className,
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipContentPrimitive.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
