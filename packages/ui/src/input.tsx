import { type InputHTMLAttributes } from "react";
import { cn } from "./utils";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = ({ className, ...props }: InputProps) => {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md px-3 text-sm shadow-sm",
        "placeholder:text-slate-500",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300",
        "disabled:cursor-not-allowed disabled:opacity-70",
        !className && "app-input disabled:bg-slate-900/50",
        className,
      )}
      {...props}
    />
  );
};
