import { useEffect, useState } from "react";
import { Button, Input } from "@repo/ui";
import { api, type ApiResult } from "../api/client";
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
  const [result, setResult] = useState<ApiResult>();
  const [faceFrames, setFaceFrames] = useState<string[]>([]);
  const [attendanceFrames, setAttendanceFrames] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [isRegisteringFace, setIsRegisteringFace] = useState(false);

  const isFaceRegistered = readFaceRegistered(faceStatus);

  useEffect(() => {
    Promise.all([api.studentSummary(), api.faceStatus()])
      .then(([summaryResponse, faceResponse]) => {
        setSummary(summaryResponse);
        setFaceStatus(faceResponse);
      })
      .catch((error) => {
        const failure = {
          ok: false,
          status: 0,
          data: error instanceof Error ? error.message : "Could not load student data",
        };
        setSummary(failure);
        setFaceStatus(failure);
      });
  }, []);

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
        <section className="max-w-2xl rounded-lg border border-zinc-800 bg-zinc-950 p-6 text-sm text-zinc-300">
          Loading student setup...
        </section>
      ) : !isFaceRegistered ? (
        <section className="max-w-2xl rounded-lg border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="mb-3 font-semibold">Face registration</h2>
          <CameraCapture maxFrames={5} onFramesChange={setFaceFrames} />
          <Button
            className="mt-3 w-full bg-blue-600 text-white hover:bg-blue-500"
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
            <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-sm text-zinc-400">Attendance percentage</p>
              <p className="mt-3 text-4xl font-semibold">{summaryValue(summary, "percentage") ?? "--"}%</p>
            </section>
            <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-sm text-zinc-400">Current status</p>
              <p className="mt-3 text-4xl font-semibold">{summaryValue(summary, "status") ?? "Unknown"}</p>
            </section>
          </div>

          <section className="max-w-2xl rounded-lg border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="mb-3 font-semibold">Mark attendance</h2>
            <Input
              className="mb-3 border border-zinc-700 bg-zinc-900 text-white"
              placeholder="Active session ID"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
            />
            <CameraCapture maxFrames={2} onFramesChange={setAttendanceFrames} />
            <Button
              className="mt-3 w-full bg-emerald-600 text-white hover:bg-emerald-500"
              disabled={!sessionId.trim() || attendanceFrames.length === 0}
              onClick={() => api.submitAttendance({ sessionId, frames: attendanceFrames }).then(setResult)}
            >
              Submit attendance frames
            </Button>
          </section>
          <StatusPanel result={result ?? summary} />
        </>
      )}
    </AppShell>
  );
}
