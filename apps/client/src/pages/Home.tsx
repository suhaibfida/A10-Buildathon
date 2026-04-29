import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type ApiResult } from "../api/client";
import AppShell from "../components/AppShell";

function readCount(result: ApiResult | undefined) {
  const data = result?.data as { count?: number; presentToday?: number } | undefined;
  return data?.presentToday ?? data?.count ?? 0;
}

export default function Home() {
  const [result, setResult] = useState<ApiResult>();

  useEffect(() => {
    api.todayPresent()
      .then(setResult)
      .catch((error) =>
        setResult({
          ok: false,
          status: 0,
          data: error instanceof Error ? error.message : "Could not load today's count",
        }),
      );
  }, []);

  return (
    <AppShell
      title="AI Attendance System"
      subtitle="Role-based attendance with clerk setup, teacher sessions, student face capture, and data-aware assistant support."
    >
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">Present today</p>
          <div className="mt-4 text-6xl font-semibold tracking-tight">{readCount(result)}</div>
          <p className="mt-4 text-sm leading-6 text-zinc-400">
            Counts unique students who attended at least one session today. The frontend only displays
            the backend total.
          </p>
        </section>

        <section className="grid gap-3">
          <Link className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 hover:bg-zinc-900" to="/login">
            <h2 className="font-semibold">Login</h2>
            <p className="mt-1 text-sm text-zinc-400">Admin, teacher, and active student access.</p>
          </Link>
          <Link className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 hover:bg-zinc-900" to="/register">
            <h2 className="font-semibold">Register</h2>
            <p className="mt-1 text-sm text-zinc-400">Create teacher and student accounts.</p>
          </Link>
          <Link className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 hover:bg-zinc-900" to="/student/activate">
            <h2 className="font-semibold">Student activation</h2>
            <p className="mt-1 text-sm text-zinc-400">Use roll number, set password, then register face.</p>
          </Link>
          <Link className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 hover:bg-zinc-900" to="/assistant">
            <h2 className="font-semibold">AI assistant</h2>
            <p className="mt-1 text-sm text-zinc-400">Ask questions using your own attendance data and college info.</p>
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
