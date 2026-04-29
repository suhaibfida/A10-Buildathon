import { useEffect, useState, type ReactNode } from "react";
import { Link, Navigate } from "react-router-dom";
import { api, type ApiResult, type AuthRole, type CurrentUser } from "../api/client";
import AppShell from "./AppShell";
import { StatusPanel } from "./StatusPanel";

function readUser(result?: ApiResult) {
  return (result?.data as { user?: CurrentUser } | undefined)?.user;
}

function dashboardFor(user: CurrentUser) {
  if (user.role === "ADMIN") return "/admin";
  if (user.role === "TEACHER") return "/teacher";
  return "/student";
}

export function RequireRole({
  roles,
  children,
}: {
  roles: readonly AuthRole[];
  children: ReactNode;
}) {
  const [result, setResult] = useState<ApiResult>();

  useEffect(() => {
    api.me()
      .then(setResult)
      .catch((error) =>
        setResult({
          ok: false,
          status: 0,
          data: error instanceof Error ? error.message : "Could not verify login",
        }),
      );
  }, []);

  if (!result) {
    return (
      <AppShell title="Checking Access" subtitle="Verifying your session before opening this page.">
        <section className="app-card max-w-md p-6 text-sm text-zinc-300">
          Loading...
        </section>
      </AppShell>
    );
  }

  const user = readUser(result);
  if (!result.ok || !user) {
    return (
      <AppShell title="Login Required" subtitle="This page is available only after signing in.">
        <section className="app-card max-w-md p-6">
          <p className="text-sm text-zinc-300">Please login with an authorized account.</p>
          <Link
            className="app-primary-button mt-4 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium"
            to="/login"
          >
            Go to login
          </Link>
          <StatusPanel result={result} />
        </section>
      </AppShell>
    );
  }

  if (!roles.includes(user.role)) {
    return <Navigate replace to={dashboardFor(user)} />;
  }

  return children;
}
