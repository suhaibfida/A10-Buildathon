import { Link } from "react-router-dom";

export default function AssistantShortcut() {
  return (
    <Link
      aria-label="Open AI assistant"
      title="Open AI assistant"
      to="/assistant"
      className="fixed bottom-5 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full border border-blue-400/60 bg-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-950/40 transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
    >
      AI
    </Link>
  );
}
