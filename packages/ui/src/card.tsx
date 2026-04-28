import { type JSX } from "react";
import { cn } from "./utils";

export function Card({
  className,
  title,
  children,
  href,
}: {
  className?: string;
  title: string;
  children: React.ReactNode;
  href: string;
}): JSX.Element {
  return (
    <a
      className={cn(
        "block rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50",
        className,
      )}
      href={`${href}?utm_source=create-turbo&utm_medium=basic&utm_campaign=create-turbo`}
      rel="noopener noreferrer"
      target="_blank"
    >
      <h2 className="text-base font-semibold text-zinc-950">
        {title} <span>-&gt;</span>
      </h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{children}</p>
    </a>
  );
}
