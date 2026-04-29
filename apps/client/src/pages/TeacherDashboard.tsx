import { useState } from "react";
import { Button, Input } from "@repo/ui";
import { api, type ApiResult } from "../api/client";
import AppShell from "../components/AppShell";
import { StatusPanel } from "../components/StatusPanel";

export default function TeacherDashboard() {
  const [result, setResult] = useState<ApiResult>();
  const [classId, setClassId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [status, setStatus] = useState("PRESENT");

  async function startSession() {
    const response = await api.startSession(classId, { durationMinutes: 5 });
    setResult(response);

    const data = response.data as { data?: { id?: string }; session?: { id?: string } };
    const nextSessionId = data?.data?.id ?? data?.session?.id;
    if (nextSessionId) {
      setSessionId(nextSessionId);
    }
  }

  return (
    <AppShell
      title="Teacher Attendance Session"
      subtitle="Start a 5-minute class session. Students submit camera frames during the active window."
    >
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="font-semibold">Start class session</h2>
          <p className="mt-1 text-sm text-zinc-400">
            The backend owns the session timer and validates teacher/class access.
          </p>
          <div className="mt-4 grid gap-3">
            <Input placeholder="Class ID" value={classId} onChange={(e) => setClassId(e.target.value)} />
            <Button className="bg-blue-600 text-white hover:bg-blue-500" onClick={startSession}>
              Start 5-minute session
            </Button>
          </div>
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="font-semibold">Session controls</h2>
          <div className="mt-4 grid gap-3">
            <Input placeholder="Session ID" value={sessionId} onChange={(e) => setSessionId(e.target.value)} />
            <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
              <Input placeholder="Student ID for manual correction" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
              <select
                className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="FLAGGED">Flagged</option>
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                className="border border-zinc-700 text-white hover:bg-zinc-900"
                onClick={() => api.markAttendance(sessionId, { userId: studentId, status }).then(setResult)}
              >
                Manual mark
              </Button>
              <Button
                className="bg-red-600 text-white hover:bg-red-500"
                onClick={() => api.endSession(sessionId).then(setResult)}
              >
                End session
              </Button>
            </div>
          </div>
        </section>
      </div>
      <StatusPanel result={result} />
    </AppShell>
  );
}
