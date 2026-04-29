import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api, type ApiResult, type CurrentUser } from "../api/client";

function dashboardFor(user?: CurrentUser) {
  if (user?.role === "ADMIN") return "/admin";
  if (user?.role === "TEACHER") return "/teacher";
  if (user?.role === "STUDENT") return "/student";
  return "/login";
}

export function RootRedirect() {
  const [result, setResult] = useState<ApiResult>();

  useEffect(() => {
    api.me()
      .then(setResult)
      .catch(() =>
        setResult({
          ok: false,
          status: 0,
          data: null,
        }),
      );
  }, []);

  if (!result) {
    return (
      <main className="grid min-h-screen place-items-center bg-zinc-950 text-sm text-zinc-300">
        Loading...
      </main>
    );
  }

  const user = (result.data as { user?: CurrentUser } | undefined)?.user;
  return <Navigate replace to={result.ok ? dashboardFor(user) : "/login"} />;
}
