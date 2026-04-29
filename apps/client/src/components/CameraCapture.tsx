import { useEffect, useRef, useState } from "react";
import { Button } from "@repo/ui";

export default function CameraCapture({
  maxFrames = 3,
  onFramesChange,
}: {
  maxFrames?: number;
  onFramesChange: (frames: string[]) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [frames, setFrames] = useState<string[]>([]);
  const [message, setMessage] = useState("Camera is off");

  useEffect(() => {
    return () => stopCamera();
  }, []);

  function syncFrames(nextFrames: string[]) {
    setFrames(nextFrames);
    onFramesChange(nextFrames);
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setMessage("Camera ready");
    } catch {
      setMessage("Camera permission denied or unavailable");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setMessage("Camera is off");
  }

  function captureFrame() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      setMessage("Start the camera before capturing");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = canvas.toDataURL("image/jpeg", 0.85);
    syncFrames([...frames, frame].slice(-maxFrames));
    setMessage("Frame captured");
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <div className="aspect-video overflow-hidden rounded-md bg-black">
        <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button className="bg-zinc-100 text-zinc-950 hover:bg-white" onClick={startCamera}>
          Start camera
        </Button>
        <Button className="bg-blue-600 text-white hover:bg-blue-500" onClick={captureFrame}>
          Capture frame
        </Button>
        <Button className="border border-zinc-700 text-zinc-100 hover:bg-zinc-900" onClick={stopCamera}>
          Stop
        </Button>
        <Button
          className="border border-zinc-700 text-zinc-100 hover:bg-zinc-900"
          onClick={() => syncFrames([])}
        >
          Clear
        </Button>
      </div>
      <p className="mt-3 text-sm text-zinc-400">
        {message}. {frames.length}/{maxFrames} frame{maxFrames === 1 ? "" : "s"} ready.
      </p>
      {frames.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {frames.map((frame, index) => (
            <img
              key={frame}
              src={frame}
              alt={`Captured frame ${index + 1}`}
              className="aspect-video rounded border border-zinc-800 object-cover"
            />
          ))}
        </div>
      )}
    </div>
  );
}
