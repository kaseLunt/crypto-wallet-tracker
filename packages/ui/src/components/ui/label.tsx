import { cn } from "@/lib/utils";
import { Root as LabelRoot } from "@radix-ui/react-label";
import { type VariantProps, cva } from "class-variance-authority";
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef } from "react";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

const Label = forwardRef<
  ComponentRef<typeof LabelRoot>,
  ComponentPropsWithoutRef<typeof LabelRoot> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelRoot ref={ref} className={cn(labelVariants(), className)} {...props} />
));
Label.displayName = LabelRoot.displayName;

export { Label };
