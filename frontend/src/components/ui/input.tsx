import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, ...props }, ref) => {
    if (icon) {
      return (
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </div>
          <input
            ref={ref}
            className={cn(
              "flex h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm",
              "placeholder:text-slate-400",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors duration-150",
              className
            )}
            {...props}
          />
        </div>
      );
    }

    return (
      <input
        ref={ref}
        className={cn(
          "flex h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm",
          "placeholder:text-slate-400",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-colors duration-150",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
