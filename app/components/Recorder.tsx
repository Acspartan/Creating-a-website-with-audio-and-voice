"use client";

import { useRef, useState } from "react";

type Mode = "audio" | "video";

export default function Recorder() {
  const [mode, setMode] = useState<Mode>("audio");
  const [recording, setRecording] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const previewRef = useRef<HTMLVideoElement>(null);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: mode === "video" });
      if (mode === "video" && previewRef.current) previewRef.current.srcObject = stream;

      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        // TODO: upload this blob to Supabase Storage.
        setBlobUrl(URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType })));
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function stop() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  return (
    <div>
      <label>
        Mode:{" "}
        <select value={mode} onChange={(e) => setMode(e.target.value as Mode)} disabled={recording}>
          <option value="audio">Audio</option>
          <option value="video">Video</option>
        </select>
      </label>{" "}
      {recording ? <button onClick={stop}>Stop</button> : <button onClick={start}>Record</button>}

      {error && <p role="alert">Error: {error}</p>}

      {/* Stays mounted in video mode so previewRef exists before recording starts. */}
      {mode === "video" && <video ref={previewRef} autoPlay muted playsInline width="100%" hidden={!recording} />}

      {blobUrl && !recording && (
        <div>
          <h2>Playback</h2>
          {mode === "video" ? <video src={blobUrl} controls width="100%" /> : <audio src={blobUrl} controls />}
        </div>
      )}
    </div>
  );
}
