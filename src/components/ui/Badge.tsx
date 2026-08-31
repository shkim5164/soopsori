import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = {
  default: "bg-black text-white hover:bg-black/80",
  secondary: "bg-gray-200 text-black hover:bg-gray-300",
  outline: "text-black",
  vocal: "bg-neo-pink text-white",
  "acoustic-guitar": "bg-neo-yellow text-black",
  "electric-guitar": "bg-neo-blue text-black",
  bass: "bg-neo-green text-black",
  drum: "bg-gray-900 text-white",
  keyboard: "bg-white text-black",
  other: "bg-gray-200 text-black",
} as const;

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border-2 border-black px-2.5 py-0.5 text-xs font-black transition-colors focus:outline-none focus:ring-2 focus:ring-black",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
