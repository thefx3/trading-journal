import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = cva(
  "inline-flex h-10 items-center justify-center gap-2 rounded-[0.625rem] px-3.5 text-[13px] font-medium transition-[color,background-color,border-color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 disabled:pointer-events-none disabled:opacity-45 active:translate-y-px",
  {
    variants: {
      variant: {
        default:
          "border border-primary/10 bg-control text-foreground shadow-sm hover:border-primary/20 hover:bg-control-hover",
        primary:
          "border border-primary bg-primary text-white shadow-[0_10px_24px_-14px_var(--primary)] hover:border-primary/90 hover:bg-primary/90",
        outline:
          "border border-primary/10 bg-transparent text-muted hover:border-primary/20 hover:bg-control hover:text-foreground",
        ghost: "text-muted hover:bg-primary/5 hover:text-foreground",
        destructive:
          "border border-red-600 bg-red-600 text-white hover:bg-red-500",
      },
      size: {
        default: "h-10 px-3.5",
        sm: "h-8 px-2.5 text-xs",
        lg: "h-11 px-4",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof variants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp className={cn(variants({ variant, size }), className)} {...props} />
  );
}
