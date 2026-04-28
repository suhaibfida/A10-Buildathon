import { type InputHTMLAttributes } from "react";
import { cn } from "./utils";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = ({ className, ...props }: InputProps) => {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md px-3 text-sm shadow-sm",
        "placeholder:text-zinc-400",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950",
        "disabled:cursor-not-allowed disabled:opacity-70",
        !className && "border border-zinc-300 bg-white text-zinc-950 disabled:bg-zinc-100",
        className,
      )}
      {...props}
    />
  );
};
