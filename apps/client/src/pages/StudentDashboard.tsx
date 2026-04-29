import { useEffect, useState } from "react";
import { Button, Input } from "@repo/ui";
import { api, type ApiResult } from "../api/client";
import AssistantShortcut from "../components/AssistantShortcut";
import AppShell from "../components/AppShell";
import CameraCapture from "../components/CameraCapture";
import { StatusPanel } from "../components/StatusPanel";

function summaryValue(result: ApiResult | undefined, key: "percentage" | "status") {
  const data = result?.data as { percentage?: number; status?: string; data?: { percentage?: number; status?: string } } | undefined;
  return data?.[key] ?? data?.data?.[key];
}

function readFaceRegistered(result: ApiResult | undefined) {
  return Boolean((result?.data as { registered?: boolean } | undefined)?.registered);
}

export default function StudentDashboard() {
  const [summary, setSummary] = useState<ApiResult>();
  const [faceStatus, setFaceStatus] = useState<ApiResult>();
  const [activeSession, setActiveSession] = useState<ApiResult>();
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
    Promise.all([api.studentSummary(), api.faceStatus(), api.studentActiveSession()])
      .then(([summaryResponse, faceResponse, activeSessionResponse]) => {
        setSummary(summaryResponse);
        setFaceStatus(faceResponse);
        setActiveSession(activeSessionResponse);
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
        setSummary(failure);
        setFaceStatus(failure);
        setActiveSession(failure);
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
          <div className="mb-5 grid gap-5 sm:grid-cols-2">
            <section className="app-card p-5">
              <p className="text-sm text-zinc-400">Attendance percentage</p>
              <p className="mt-3 text-4xl font-semibold">{summaryValue(summary, "percentage") ?? "--"}%</p>
            </section>
            <section className="app-card p-5">
              <p className="text-sm text-zinc-400">Current status</p>
              <p className="mt-3 text-4xl font-semibold">{summaryValue(summary, "status") ?? "Unknown"}</p>
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
