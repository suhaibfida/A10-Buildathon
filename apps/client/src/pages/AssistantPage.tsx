import { useState } from "react";
import { Button } from "@repo/ui";
import { api, type ApiResult } from "../api/client";
import AppShell from "../components/AppShell";
import { StatusPanel } from "../components/StatusPanel";

export default function AssistantPage() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<ApiResult>();

  return (
    <AppShell
      title="AI Assistant"
      subtitle="Ask questions using your own attendance data and general college info. The backend enforces data boundaries."
    >
      <section className="max-w-3xl rounded-lg border border-zinc-800 bg-zinc-950 p-5">
        <textarea
          className="min-h-36 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
          placeholder="Example: What is my attendance percentage this month?"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
        <Button
          className="mt-3 bg-blue-600 text-white hover:bg-blue-500"
          onClick={() => api.assistant({ question }).then(setResult)}
        >
          Ask assistant
        </Button>
        <StatusPanel result={result} />
      </section>
    </AppShell>
  );
}
