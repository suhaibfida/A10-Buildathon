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
    <main className="app-shell px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-slate-700/50 pb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm">
            <Link className="app-muted-button rounded-md px-3 py-2 text-sm" to="/admin">
              Admin
            </Link>
            <Link className="app-muted-button rounded-md px-3 py-2 text-sm" to="/teacher">
              Teacher
            </Link>
            <Link className="app-muted-button rounded-md px-3 py-2 text-sm" to="/student">
              Student
            </Link>
            <Link className="app-muted-button rounded-md px-3 py-2 text-sm" to="/login">
              Login
            </Link>
          </nav>
        </header>
        {children}
      </div>
    </main>
  );
}
