import { useState } from "react";
import { Button } from "@repo/ui";
import { api, type ApiResult } from "../api/client";
import AppShell from "../components/AppShell";
import { StatusPanel } from "../components/StatusPanel";

type AssistantSource = {
  id: string;
  title: string;
  type: string;
  score: number;
};

function readAnswer(result: ApiResult | undefined) {
  return (result?.data as { answer?: string } | undefined)?.answer;
}

function readSources(result: ApiResult | undefined) {
  return ((result?.data as { sources?: AssistantSource[] } | undefined)?.sources ?? []) as AssistantSource[];
}

export default function AssistantPage() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<ApiResult>();
  const [isAsking, setIsAsking] = useState(false);

  const answer = readAnswer(result);
  const sources = readSources(result);

  async function askQuestion() {
    if (!question.trim() || isAsking) return;

    setIsAsking(true);
    const response = await api.assistant({ question: question.trim() });
    setResult(response);
    setIsAsking(false);
  }

  return (
    <AppShell
      title="AI Assistant"
      subtitle="Ask questions using official college knowledge added by admins. The backend retrieves matching chunks before asking Gemini."
    >
      <section className="app-card max-w-3xl p-5">
        <textarea
          className="app-input min-h-36 w-full rounded-md px-3 py-2 text-sm leading-6"
          placeholder="Example: What are the exam rules for my department?"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
        <Button
          className="app-primary-button mt-3"
          disabled={!question.trim() || isAsking}
          onClick={askQuestion}
        >
          {isAsking ? "Thinking..." : "Ask assistant"}
        </Button>

        {answer && (
          <section className="app-card-soft mt-5 p-4">
            <h2 className="text-sm font-semibold text-zinc-200">Answer</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-100">{answer}</p>
          </section>
        )}

        {sources.length > 0 && (
          <section className="app-card-soft mt-4 p-4">
            <h2 className="text-sm font-semibold text-zinc-200">Sources</h2>
            <div className="mt-3 grid gap-2">
              {sources.map((source) => (
                <div key={source.id} className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
                  <span>
                    {source.title} - {source.type}
                  </span>
                  <span>{Math.round(source.score * 100)}%</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {result && !result.ok && <StatusPanel result={result} />}
      </section>
    </AppShell>
  );
}
