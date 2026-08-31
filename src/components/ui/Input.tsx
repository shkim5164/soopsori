import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-100% border-2 border-black bg-white px-4 py-2 font-bold text-black",
          "shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.05)]",
          "focus:outline-none focus:bg-neo-yellow focus:shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.1)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
