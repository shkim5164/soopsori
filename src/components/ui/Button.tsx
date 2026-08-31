import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = {
  default: "bg-white text-black neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:neo-shadow-sm hover:bg-neo-yellow hover:text-black active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
  primary: "bg-neo-pink text-white neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:neo-shadow-sm hover:bg-black hover:text-neo-yellow active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
  secondary: "bg-neo-yellow text-black border-black neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:neo-shadow-sm hover:bg-neo-pink hover:text-white active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
  ghost: "border-transparent bg-transparent shadow-none hover:bg-gray-100",
  link: "border-transparent bg-transparent shadow-none underline-offset-4 hover:underline text-black",
} as const;

const buttonSizes = {
  default: "h-10 px-4 py-2",
  sm: "h-9 px-3 py-1.5 text-sm",
  lg: "h-11 px-8 py-3 text-lg",
  icon: "h-10 w-10 p-2 rounded-full flex items-center justify-center",
} as const;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center border-2 border-black rounded-full font-bold lowercase transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:pointer-events-none disabled:opacity-50",
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

// For other components (like Link) to use the same classes
export function getButtonClasses({ variant = "default", size = "default", className }: { variant?: keyof typeof buttonVariants; size?: keyof typeof buttonSizes; className?: string }) {
  return cn(
    "inline-flex items-center justify-center border-2 border-black rounded-full font-bold lowercase transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:pointer-events-none disabled:opacity-50",
    buttonVariants[variant],
    buttonSizes[size],
    className
  );
}

export { Button, buttonVariants };
