"use client";

import { type ButtonHTMLAttributes } from "react";
import { cn } from "./utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

const variants = {
  primary:
    "bg-zinc-950 text-white shadow-sm hover:bg-zinc-800 focus-visible:outline-zinc-950",
  secondary:
    "border border-zinc-300 bg-white text-zinc-950 shadow-sm hover:bg-zinc-50 focus-visible:outline-zinc-950",
  ghost:
    "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-zinc-950",
};

export const Button = ({
  children,
  className,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) => {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        !className && variants[variant],
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
};
