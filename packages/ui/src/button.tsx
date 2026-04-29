"use client";

import { type ButtonHTMLAttributes } from "react";
import { cn } from "./utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

const variants = {
  primary: "app-primary-button",
  secondary: "app-muted-button",
  ghost: "text-slate-300 hover:bg-slate-800/70 hover:text-white focus-visible:outline-cyan-300",
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
