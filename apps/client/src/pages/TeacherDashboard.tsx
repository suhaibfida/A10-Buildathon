import { useEffect, useState } from "react";
import { Button, Input } from "@repo/ui";
import { api, type ApiResult, type BlePayload, type TeacherClass } from "../api/client";
import AssistantShortcut from "../components/AssistantShortcut";
import AppShell from "../components/AppShell";
import { StatusPanel } from "../components/StatusPanel";

export default function TeacherDashboard() {
  const [result, setResult] = useState<ApiResult>();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [classId, setClassId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [blePayload, setBlePayload] = useState<BlePayload | null>(null);
  const [studentId, setStudentId] = useState("");
  const [status, setStatus] = useState("PRESENT");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.teacherClasses()
      .then((response) => {
        if (!response.ok) {
          setResult(response);
          return;
        }
        const data = (response.data as { data?: TeacherClass[] } | undefined)?.data ?? [];
        setClasses(data);
        if (data.length > 0) {
          setClassId((current) => current || data[0]?.id || "");
        }
      })
      .catch((error) =>
        setResult({
          ok: false,
          status: 0,
          data: error instanceof Error ? error.message : "Could not load teacher classes",
        }),
      );
  }, []);

  useEffect(() => {
    if (!classId) return;
    api.teacherActiveSession(classId)
      .then((response) => {
        if (!response.ok) {
          setResult(response);
          return;
        }
        const activeId = (response.data as { data?: { id?: string } } | undefined)?.data?.id;
        if (activeId) {
          setSessionId(activeId);
          api.teacherBleToken(activeId)
            .then((tokenResponse) => {
              const payload = (tokenResponse.data as { data?: BlePayload } | undefined)?.data;
              if (payload) setBlePayload(payload);
            })
            .catch(() => undefined);
        }
      })
      .catch(() => undefined);
  }, [classId]);

  async function startSession() {
    if (!classId.trim()) {
      setResult({
        ok: false,
        status: 0,
        data: { error: "Select a class before starting session" },
      });
      return;
    }

    const response = await api.startSession(classId, { durationMinutes: 5 });
    setResult(response);

    const data = response.data as { data?: { id?: string }; session?: { id?: string } };
    const nextSessionId = data?.data?.id ?? data?.session?.id;
    if (nextSessionId) {
      setSessionId(nextSessionId);
    }
    const ble = (response.data as { ble?: BlePayload } | undefined)?.ble;
    setBlePayload(ble ?? null);
  }

  async function refreshBleToken() {
    if (!sessionId.trim()) return;
    const response = await api.teacherBleToken(sessionId);
    setResult(response);
    const payload = (response.data as { data?: BlePayload } | undefined)?.data;
    if (payload) {
      setBlePayload(payload);
    }
  }

  async function copyBlePayload() {
    if (!blePayload) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(blePayload));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setResult({
        ok: false,
        status: 0,
        data: { error: "Could not copy payload. Copy manually from box." },
      });
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
            <select
              className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            >
              <option value="">Select your class</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} {item.department?.name ? `- ${item.department.name}` : ""} ({item._count?.students ?? 0} students)
                </option>
              ))}
            </select>
            <Button className="bg-blue-600 text-white hover:bg-blue-500" onClick={startSession}>
              Start 5-minute session
            </Button>
          </div>
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="font-semibold">Session controls</h2>
          <div className="mt-4 grid gap-3">
            <Input placeholder="Session ID" value={sessionId} onChange={(e) => setSessionId(e.target.value)} />
            <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3 text-xs text-zinc-300">
              <p className="font-semibold text-zinc-200">BLE broadcast payload</p>
              <pre className="mt-2 overflow-auto whitespace-pre-wrap">
                {blePayload
                  ? JSON.stringify(blePayload, null, 2)
                  : "Start session and fetch token every 10-15s for BLE advertising"}
              </pre>
              <div className="mt-2 flex gap-2">
                <Button className="border border-zinc-700 text-white hover:bg-zinc-900" onClick={refreshBleToken}>
                  Refresh BLE token
                </Button>
                <Button
                  className="border border-zinc-700 text-white hover:bg-zinc-900"
                  onClick={copyBlePayload}
                  disabled={!blePayload}
                >
                  {copied ? "Copied" : "Copy payload"}
                </Button>
              </div>
            </div>
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
                disabled={!sessionId.trim() || !studentId.trim()}
                onClick={() => api.markAttendance(sessionId, { userId: studentId, status }).then(setResult)}
              >
                Manual mark
              </Button>
              <Button
                className="bg-red-600 text-white hover:bg-red-500"
                disabled={!sessionId.trim()}
                onClick={() => api.endSession(sessionId).then(setResult)}
              >
                End session
              </Button>
            </div>
          </div>
        </section>
      </div>
      <StatusPanel result={result} />
      <AssistantShortcut />
    </AppShell>
  );
}
