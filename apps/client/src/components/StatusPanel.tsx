import { type ApiResult } from "../api/client";

export function StatusPanel({ result }: { result?: ApiResult }) {
  if (!result) {
    return null;
  }

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
