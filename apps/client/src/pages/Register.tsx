import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button, Input } from "@repo/ui";
import { api, type ApiResult } from "../api/client";
import AppShell from "../components/AppShell";
import { StatusPanel } from "../components/StatusPanel";

type RegisterRole = "STUDENT" | "TEACHER";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RegisterRole>("STUDENT");
  const [rollNumber, setRollNumber] = useState("");
  const [result, setResult] = useState<ApiResult>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    if (!name.trim() || !email.trim() || password.length < 6) {
      return false;
    }

    return role === "TEACHER" || Boolean(rollNumber.trim());
  }, [email, name, password, role, rollNumber]);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        rollNumber: role === "STUDENT" ? rollNumber.trim() : undefined,
      });

      setResult(response);

      if (response.ok) {
        setName("");
        setEmail("");
        setPassword("");
        setRollNumber("");
        setRole("STUDENT");
      }
    } catch (error) {
      setResult({
        ok: false,
        status: 0,
        data: error instanceof Error ? error.message : "Could not register user",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell title="Create Account" subtitle="Register as a teacher or student to start using attendance tools.">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
        <form
          className="rounded-lg border border-zinc-800 bg-zinc-950 p-6"
          onSubmit={handleRegister}
        >
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-zinc-200">
              Name
              <Input
                placeholder="Full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-zinc-200">
              Email
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-zinc-200">
              Password
              <Input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            <div className="grid gap-2">
              <span className="text-sm font-medium text-zinc-200">Role</span>
              <div className="grid grid-cols-2 gap-2 rounded-md border border-zinc-800 bg-zinc-900 p-1">
                {(["STUDENT", "TEACHER"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`h-10 rounded px-3 text-sm font-medium transition ${
                      role === item
                        ? "bg-white text-zinc-950"
                        : "text-zinc-300 hover:bg-zinc-800"
                    }`}
                    onClick={() => setRole(item)}
                  >
                    {item === "STUDENT" ? "Student" : "Teacher"}
                  </button>
                ))}
              </div>
            </div>

            {role === "STUDENT" && (
              <label className="grid gap-2 text-sm font-medium text-zinc-200">
                Roll Number
                <Input
                  placeholder="Student roll number"
                  value={rollNumber}
                  onChange={(event) => setRollNumber(event.target.value)}
                />
              </label>
            )}

            <Button
              className="bg-blue-600 text-white hover:bg-blue-500"
              disabled={!canSubmit || isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Creating..." : "Create account"}
            </Button>
          </div>

          <p className="mt-4 text-sm text-zinc-400">
            Already registered?{" "}
            <Link className="text-blue-300 hover:underline" to="/login">
              Login
            </Link>
          </p>

          <StatusPanel result={result} />
        </form>

        <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-lg font-semibold">Signup rules</h2>
          <div className="mt-4 grid gap-4 text-sm leading-6 text-zinc-400">
            <p>Student accounts require a roll number because the backend validates it for that role.</p>
            <p>Teacher accounts only need name, email, password, and role.</p>
            <p>After successful registration, use the login page to enter the dashboard for your role.</p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
