import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input } from "@repo/ui";
import { api, type ApiResult } from "../api/client";
import AppShell from "../components/AppShell";
import { StatusPanel } from "../components/StatusPanel";

export default function StudentActivate() {
  const [rollNumber, setRollNumber] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<ApiResult>();
  const navigate = useNavigate();

  async function activate() {
    const response = await api.activateStudent({ rollNumber, password });
    setResult(response);
    if (response.ok) {
      setTimeout(() => navigate("/login"), 500);
    }
  }

  return (
    <AppShell
      title="Activate Student Account"
      subtitle="Students start inactive. Use the roll number created by the admin, then set a password."
    >
      <section className="app-card max-w-md p-6">
        <div className="grid gap-3">
          <Input placeholder="Roll number" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} />
          <Input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button className="app-primary-button" onClick={activate}>
            Activate account
          </Button>
        </div>
        <p className="mt-4 text-sm text-zinc-400">
          Already active?{" "}
          <Link className="text-blue-300 hover:underline" to="/login">
            Login
          </Link>
        </p>
        <StatusPanel result={result} />
      </section>
    </AppShell>
  );
}
