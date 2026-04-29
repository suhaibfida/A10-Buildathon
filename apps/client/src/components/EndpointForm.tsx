import { type FormEvent, type ReactNode } from "react";
import { Button } from "@repo/ui";
import { type ApiResult } from "../api/client";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-zinc-300">
      {label}
      {children}
    </label>
  );
}

export function ResponseBox({ result }: { result: ApiResult }) {
  return (
    <pre
      className={`mt-4 max-h-56 overflow-auto rounded-md border p-3 text-xs leading-5 ${
        result.ok
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
          : "border-red-500/30 bg-red-500/10 text-red-100"
      }`}
    >
      {result.status ? `Status ${result.status}\n` : ""}
      {JSON.stringify(result.data, null, 2)}
    </pre>
  );
}

export function EndpointForm({
  title,
  path,
  result,
  children,
  onSubmit,
}: {
  title: string;
  path: string;
  result: ApiResult;
  children: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="app-card p-5"
    >
      <div className="mb-5">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <p className="mt-1 font-mono text-xs text-zinc-500">POST {path}</p>
      </div>
      <div className="grid gap-4">{children}</div>
      <Button type="submit" className="app-primary-button mt-5 w-full">
        Submit
      </Button>
      <ResponseBox result={result} />
    </form>
  );
}
