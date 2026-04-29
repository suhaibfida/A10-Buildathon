import { Link } from "react-router-dom";

export default function AssistantShortcut() {
  return (
    <Link
      aria-label="Open AI assistant"
      title="Open AI assistant"
      to="/assistant"
      className="fixed bottom-5 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full border border-cyan-300/70 bg-cyan-400 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-950/40 transition hover:-translate-y-0.5 hover:bg-teal-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
    >
      AI
    </Link>
  );
}
