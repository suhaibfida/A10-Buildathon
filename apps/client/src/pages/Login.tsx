import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input } from "@repo/ui";
import { api, type CurrentUser } from "../api/client";
import AppShell from "../components/AppShell";
import { StatusPanel } from "../components/StatusPanel";

function dashboardFor(user?: CurrentUser) {
  if (user?.role === "ADMIN") return "/admin";
  if (user?.role === "TEACHER") return "/teacher";
  if (user?.role === "STUDENT") return "/student";
  return undefined;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<Awaited<ReturnType<typeof api.login>>>();
  const navigate = useNavigate();

  useEffect(() => {
    api.me().then((response) => {
      const user = (response.data as { user?: CurrentUser } | undefined)?.user;
      const dashboard = response.ok ? dashboardFor(user) : undefined;
      if (dashboard) {
        navigate(dashboard, { replace: true });
      }
    }).catch(() => undefined);
  }, [navigate]);

  async function handleLogin() {
    const response = await api.login({ email, password });
    setResult(response);

    if (!response.ok) {
      return;
    }

    const user = (response.data as { user?: CurrentUser } | undefined)?.user;
    navigate(dashboardFor(user) ?? "/student");
  }

  return (
    <AppShell title="Login" subtitle="Sign in and continue to your role-specific dashboard.">
      <div className="app-card max-w-md p-6">
        <div className="grid gap-4">
          <Input placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button className="app-primary-button" onClick={handleLogin}>
            Login
          </Button>
        </div>
        <p className="mt-4 text-sm text-zinc-400">
          Student not active yet?{" "}
          <Link className="text-blue-300 hover:underline" to="/student/activate">
            Activate with roll number
          </Link>
        </p>
        <StatusPanel result={result} />
      </div>
    </AppShell>
  );
}
