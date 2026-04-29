import { useEffect, useState } from "react";
import { Button, Input } from "@repo/ui";
import { api, type ApiResult, type AttendanceHistoryRecord, type CurrentUser } from "../api/client";
import AssistantShortcut from "../components/AssistantShortcut";
import AppShell from "../components/AppShell";
import CameraCapture from "../components/CameraCapture";
import { StatusPanel } from "../components/StatusPanel";

function summaryValue(result: ApiResult | undefined, key: "percentage" | "status") {
  const data = result?.data as { percentage?: number; status?: string; data?: { percentage?: number; status?: string } } | undefined;
  return data?.[key] ?? data?.data?.[key];
}

function summaryNumber(result: ApiResult | undefined, key: "total" | "present") {
  const data = result?.data as { total?: number; present?: number; data?: { total?: number; present?: number } } | undefined;
  return data?.[key] ?? data?.data?.[key] ?? 0;
}

function readFaceRegistered(result: ApiResult | undefined) {
  return Boolean((result?.data as { registered?: boolean } | undefined)?.registered);
}

function readUser(result: ApiResult | undefined) {
  return (result?.data as { user?: CurrentUser } | undefined)?.user;
}

function readHistory(result: ApiResult | undefined) {
  return ((result?.data as { data?: AttendanceHistoryRecord[] } | undefined)?.data ?? []) as AttendanceHistoryRecord[];
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function statusClass(status?: AttendanceHistoryRecord["status"]) {
  if (status === "PRESENT") return "border-emerald-400/40 bg-emerald-400/15 text-emerald-100";
  if (status === "ABSENT") return "border-rose-400/40 bg-rose-400/15 text-rose-100";
  if (status === "FLAGGED") return "border-amber-400/40 bg-amber-400/15 text-amber-100";
  return "border-slate-700/60 bg-slate-950/30 text-zinc-500";
}

export default function StudentDashboard() {
  const [profile, setProfile] = useState<ApiResult>();
  const [summary, setSummary] = useState<ApiResult>();
  const [faceStatus, setFaceStatus] = useState<ApiResult>();
  const [activeSession, setActiveSession] = useState<ApiResult>();
  const [history, setHistory] = useState<ApiResult>();
  const [result, setResult] = useState<ApiResult>();
  const [faceFrames, setFaceFrames] = useState<string[]>([]);
  const [attendanceFrames, setAttendanceFrames] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [bleToken, setBleToken] = useState("");
  const [sharedPayload, setSharedPayload] = useState("");
  const [isRegisteringFace, setIsRegisteringFace] = useState(false);

  const isFaceRegistered = readFaceRegistered(faceStatus);

  const activeSessionId =
    sessionId.trim() ||
    ((activeSession?.data as { data?: { id?: string } } | undefined)?.data?.id ?? "").trim();

  useEffect(() => {
    Promise.all([
      api.me(),
      api.studentSummary(),
      api.faceStatus(),
      api.studentActiveSession(),
      api.studentAttendanceHistory(),
    ])
      .then(([profileResponse, summaryResponse, faceResponse, activeSessionResponse, historyResponse]) => {
        setProfile(profileResponse);
        setSummary(summaryResponse);
        setFaceStatus(faceResponse);
        setActiveSession(activeSessionResponse);
        setHistory(historyResponse);
        const suggestedSessionId =
          (activeSessionResponse.data as { data?: { id?: string } } | undefined)?.data?.id ?? "";
        if (suggestedSessionId) {
          setSessionId(suggestedSessionId);
        }
      })
      .catch((error) => {
        const failure = {
          ok: false,
          status: 0,
          data: error instanceof Error ? error.message : "Could not load student data",
        };
        setProfile(failure);
        setSummary(failure);
        setFaceStatus(failure);
        setActiveSession(failure);
        setHistory(failure);
      });
  }, []);

  async function refreshActiveSession() {
    const response = await api.studentActiveSession();
    setActiveSession(response);
    const suggestedSessionId = (response.data as { data?: { id?: string } } | undefined)?.data?.id ?? "";
    if (suggestedSessionId) {
      setSessionId(suggestedSessionId);
    }
  }

  async function registerFace() {
    if (faceFrames.length === 0 || isRegisteringFace) {
      return;
    }

    setIsRegisteringFace(true);
    const response = await api.registerFace({ frames: faceFrames });
    setResult(response);
    setIsRegisteringFace(false);

    if (response.ok) {
      setFaceFrames([]);
      const statusResponse = await api.faceStatus();
      setFaceStatus(statusResponse);
    }
  }

  async function submitAttendance() {
    const targetSessionId = activeSessionId;
    if (!targetSessionId || !bleToken.trim() || attendanceFrames.length === 0) {
      return;
    }

    const response = await api.markAttendanceWithBle({
      sessionId: targetSessionId,
      token: bleToken.trim(),
      frames: attendanceFrames,
    });
    setResult(response);
  }

  function applySharedPayload() {
    try {
      const parsed = JSON.parse(sharedPayload) as { sessionId?: string; token?: string; type?: string };
      if (parsed.type && parsed.type !== "ATTENDANCE") {
        setResult({
          ok: false,
          status: 0,
          data: { error: "Invalid payload type" },
        });
        return;
      }

      if (!parsed.sessionId || !parsed.token) {
        setResult({
          ok: false,
          status: 0,
          data: { error: "Payload must include sessionId and token" },
        });
        return;
      }

      setSessionId(parsed.sessionId);
      setBleToken(parsed.token);
      setResult({
        ok: true,
        status: 0,
        data: { message: "Token payload applied. Capture photos and submit attendance." },
      });
    } catch {
      setResult({
        ok: false,
        status: 0,
        data: { error: "Invalid JSON payload" },
      });
    }
  }

  const user = readUser(profile);
  const records = readHistory(history);
  const totalClasses = summaryNumber(summary, "total");
  const presentClasses = summaryNumber(summary, "present");
  const missedClasses = Math.max(totalClasses - presentClasses, 0);
  const activeClass = (activeSession?.data as { class?: { name?: string } } | undefined)?.class?.name;
  const latestRecord = records[0];

  return (
    <AppShell
      title="Student Attendance"
      subtitle={
        isFaceRegistered
          ? "Submit attendance during an active teacher session."
          : "Register your face once before attendance tools are unlocked."
      }
    >
      {!faceStatus ? (
        <section className="app-card max-w-2xl p-6 text-sm text-zinc-300">
          Loading student setup...
        </section>
      ) : !isFaceRegistered ? (
        <section className="app-card max-w-2xl p-5">
          <h2 className="mb-3 font-semibold">Face registration</h2>
          <CameraCapture maxFrames={5} onFramesChange={setFaceFrames} />
          <Button
            className="app-primary-button mt-3 w-full"
            disabled={faceFrames.length === 0 || isRegisteringFace}
            onClick={registerFace}
          >
            {isRegisteringFace ? "Registering..." : "Register face"}
          </Button>
          <StatusPanel result={result ?? faceStatus} />
        </section>
      ) : (
        <>
          <section className="app-card mb-5 overflow-hidden">
            <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="border-b border-slate-700/50 p-5 lg:border-b-0 lg:border-r">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-zinc-400">Student</p>
                    <h2 className="mt-1 text-2xl font-semibold text-white">{user?.name ?? "Student"}</h2>
                  </div>
                  <span className="rounded-md border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                    {summaryValue(summary, "status") ?? "Unknown"}
                  </span>
                </div>
                <div className="mt-5 grid gap-3 text-sm">
                  <Detail label="Roll number" value={user?.rollNumber ?? "Not assigned"} />
                  <Detail label="Class" value={activeClass ?? "Not assigned"} />
                  <Detail label="Email" value={user?.email ?? "Not added"} />
                  <Detail
                    label="Last marked"
                    value={latestRecord ? new Date(latestRecord.createdAt).toLocaleString() : "No attendance yet"}
                  />
                </div>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Attendance" value={`${summaryValue(summary, "percentage") ?? "--"}%`} />
                <Metric label="Present" value={presentClasses} />
                <Metric label="Missed" value={missedClasses} />
                <Metric label="Total classes" value={totalClasses} />
              </div>
            </div>
          </section>

          <div className="mb-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <AttendanceCalendar records={records} />
            <section className="app-card p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold">Recent attendance</h2>
                <span className="text-xs text-zinc-500">{records.length} records</span>
              </div>
              <div className="mt-4 grid max-h-80 gap-3 overflow-auto">
                {records.length ? (
                  records.slice(0, 8).map((record) => (
                    <div key={record.id} className="app-card-soft flex items-center justify-between gap-3 p-3">
                      <div>
                        <p className="text-sm font-medium text-zinc-100">
                          {record.session?.class?.name ?? "Class session"}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {new Date(record.createdAt).toLocaleDateString()} by {record.session?.teacher?.name ?? "Teacher"}
                        </p>
                      </div>
                      <span className={`rounded-md border px-2 py-1 text-xs ${statusClass(record.status)}`}>
                        {record.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-400">No attendance records yet.</p>
                )}
              </div>
            </section>
          </div>

          <section className="app-card max-w-2xl p-5">
            <h2 className="mb-3 font-semibold">Mark attendance</h2>
            <div className="app-card-soft mb-3 flex flex-wrap items-center justify-between gap-2 p-3 text-xs text-zinc-300">
              <span>
                Active session:{" "}
                <strong>{(activeSession?.data as { data?: { id?: string } } | undefined)?.data?.id ?? "Not available"}</strong>
              </span>
              <Button className="app-muted-button h-8 px-3 text-xs" onClick={refreshActiveSession}>
                Refresh session
              </Button>
            </div>
            <Input
              className="app-input mb-3"
              placeholder="Optional: session ID override"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
            />
            <textarea
              className="app-input mb-3 min-h-20 w-full rounded-md px-3 py-2 text-sm"
              placeholder='Paste teacher shared payload JSON: {"type":"ATTENDANCE","sessionId":"...","token":"..."}'
              value={sharedPayload}
              onChange={(e) => setSharedPayload(e.target.value)}
            />
            <Button className="app-muted-button mb-3" onClick={applySharedPayload}>
              Apply shared payload
            </Button>
            <Input
              className="app-input mb-3"
              placeholder="BLE token from classroom broadcast"
              value={bleToken}
              onChange={(e) => setBleToken(e.target.value)}
            />
            <CameraCapture maxFrames={2} onFramesChange={setAttendanceFrames} />
            <Button
              className="app-success-button mt-3 w-full"
              disabled={!activeSessionId || !bleToken.trim() || attendanceFrames.length === 0}
              onClick={submitAttendance}
            >
              Submit BLE + face attendance
            </Button>
          </section>
          <StatusPanel result={result ?? summary} />
        </>
      )}
      <AssistantShortcut />
    </AppShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-slate-700/50 bg-slate-950/30 px-3 py-2">
      <span className="text-zinc-500">{label}</span>
      <span className="truncate text-right font-medium text-zinc-100">{value}</span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <section className="app-card-soft p-4">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </section>
  );
}

function AttendanceCalendar({ records }: { records: AttendanceHistoryRecord[] }) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const leadingBlanks = monthStart.getDay();
  const byDay = new Map(records.map((record) => [dateKey(new Date(record.createdAt)), record]));
  const cells: Array<
    | { type: "blank"; key: string }
    | { type: "day"; key: string; day: number; record?: AttendanceHistoryRecord }
  > = [
    ...Array.from({ length: leadingBlanks }, (_, index) => ({
      type: "blank" as const,
      key: `blank-${index}`,
    })),
    ...Array.from({ length: monthDays }, (_, index) => {
      const day = index + 1;
      const date = new Date(now.getFullYear(), now.getMonth(), day);
      const record = byDay.get(dateKey(date));
      return { type: "day" as const, key: dateKey(date), day, record };
    }),
  ];

  return (
    <section className="app-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Attendance calendar</h2>
        <p className="text-sm text-zinc-400">
          {now.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </p>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs text-zinc-500">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-2">
        {cells.map((cell) =>
          cell.type === "day" ? (
            <div
              key={cell.key}
              className={`flex aspect-square min-h-11 flex-col items-center justify-center rounded-md border text-xs ${statusClass(cell.record?.status)}`}
              title={cell.record?.status ?? "No record"}
            >
              <span className="text-sm font-semibold">{cell.day}</span>
              <span className="mt-0.5 hidden text-[10px] sm:inline">
                {cell.record?.status ? cell.record.status.slice(0, 1) : "-"}
              </span>
            </div>
          ) : (
            <div key={cell.key} className="aspect-square min-h-11" />
          ),
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <Legend label="Present" className="border-emerald-400/40 bg-emerald-400/15" />
        <Legend label="Absent" className="border-rose-400/40 bg-rose-400/15" />
        <Legend label="Flagged" className="border-amber-400/40 bg-amber-400/15" />
      </div>
    </section>
  );
}

function Legend({ label, className }: { label: string; className: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-zinc-400">
      <span className={`h-3 w-3 rounded-sm border ${className}`} />
      {label}
    </span>
  );
}
