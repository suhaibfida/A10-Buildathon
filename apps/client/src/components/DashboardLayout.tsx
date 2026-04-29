import { type ReactNode } from "react";
import { Link } from "react-router-dom";

export default function DashboardLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm">
            <Link className="rounded-md border border-zinc-700 px-3 py-2 text-zinc-200 hover:bg-zinc-900" to="/admin">
              Admin
            </Link>
            <Link className="rounded-md border border-zinc-700 px-3 py-2 text-zinc-200 hover:bg-zinc-900" to="/teacher">
              Teacher
            </Link>
            <Link className="rounded-md border border-zinc-700 px-3 py-2 text-zinc-200 hover:bg-zinc-900" to="/student">
              Student
            </Link>
            <Link className="rounded-md border border-zinc-700 px-3 py-2 text-zinc-200 hover:bg-zinc-900" to="/login">
              Login
            </Link>
          </nav>
        </header>
        {children}
      </div>
    </main>
  );
}
