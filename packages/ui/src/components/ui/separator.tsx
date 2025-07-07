import { cn } from "@/lib/utils";
import { Root as SeparatorRoot } from "@radix-ui/react-separator";
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef } from "react";

const Separator = forwardRef<
  ComponentRef<typeof SeparatorRoot>,
  ComponentPropsWithoutRef<typeof SeparatorRoot>
>(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
  <SeparatorRoot
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      "shrink-0 bg-border",
      orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
      className,
    )}
    {...props}
  />
));
Separator.displayName = SeparatorRoot.displayName;

export { Separator };
