import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { api, type ApiResult, type CurrentUser } from "../api/client";

function readUser(result?: ApiResult) {
  return (result?.data as { user?: CurrentUser } | undefined)?.user;
}

function navFor(user?: CurrentUser) {
  if (user?.role === "ADMIN") {
    return [
      { label: "Admin", to: "/admin" },
      { label: "Assistant", to: "/assistant" },
    ];
  }

  if (user?.role === "TEACHER") {
    return [
      { label: "Teacher", to: "/teacher" },
      { label: "Assistant", to: "/assistant" },
    ];
  }

  if (user?.role === "STUDENT") {
    return [
      { label: "Student", to: "/student" },
      { label: "Assistant", to: "/assistant" },
    ];
  }

  return [
    { label: "Home", to: "/home" },
    { label: "Login", to: "/login" },
    { label: "Activate", to: "/student/activate" },
  ];
}

export default function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const [session, setSession] = useState<ApiResult>();
  const user = readUser(session);
  const navItems = useMemo(() => navFor(user), [user]);

  useEffect(() => {
    api.me()
      .then(setSession)
      .catch(() =>
        setSession({
          ok: false,
          status: 0,
          data: null,
        }),
      );
  }, []);

  return (
    <main className="app-shell">
      <header className="app-header sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 text-lg font-semibold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-400 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-950/30">
              AI
            </span>
            <span>Attendance</span>
          </Link>
          <nav className="flex flex-wrap gap-2 text-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 transition ${
                    isActive
                      ? "bg-cyan-300 text-slate-950 shadow-sm shadow-cyan-950/20"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Smart campus</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-6 text-zinc-400">{subtitle}</p>}
        </div>
        {children}
      </section>
    </main>
  );
}
