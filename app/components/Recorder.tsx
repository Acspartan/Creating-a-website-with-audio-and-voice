"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { createUploadTarget, finishSubmission, type Mode } from "../actions";

// The browser only ever uploads through one-time signed URLs issued by the server, so the public key needs no bucket access.
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function Recorder() {
  const [mode, setMode] = useState<Mode>("audio");
  const [recording, setRecording] = useState(false);
  // Remembers which mode the clip was made in, so switching modes afterwards doesn't break playback.
  const [clip, setClip] = useState<{ url: string; mode: Mode; blob: Blob } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const submitDialogRef = useRef<HTMLDialogElement>(null);

  // showModal() makes the rest of the page inert (no clicks or keyboard focus) while submitting.
  useEffect(() => {
    const dialog = submitDialogRef.current;
    if (submitting && !dialog?.open) dialog?.showModal();
    if (!submitting && dialog?.open) dialog.close();
  }, [submitting]);

  async function start() {
    setError(null);
    setSubmitError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: mode === "video" });
      if (mode === "video" && previewRef.current) previewRef.current.srcObject = stream;

      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (clip) URL.revokeObjectURL(clip.url);
        const blob = new Blob(chunks, { type: recorder.mimeType });
        setClip({ url: URL.createObjectURL(blob), mode, blob });
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

  async function submit() {
    if (!clip) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const target = await createUploadTarget(clip.mode, clip.blob.type);
      if ("error" in target) throw new Error(target.error);

      // Bucket MIME rules compare the base type, so drop any ";codecs=..." suffix.
      const contentType = clip.blob.type.split(";")[0] || undefined;
      const { error } = await supabase.storage
        .from("Recordings")
        .uploadToSignedUrl(target.path, target.uploadToken, clip.blob, { contentType });
      if (error) throw new Error("Your recording did not finish uploading. Please try again.");

      // Redirects to the thank-you page on success; only returns on failure.
      const result = await finishSubmission(target.path);
      throw new Error(result.error);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  }

  return (
    <section className="card recorder" aria-label="Recorder">
      <div className="segmented" role="group" aria-label="Recording type">
        {(["audio", "video"] as const).map((m) => (
          <button
            key={m}
            type="button"
            className="segment"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            disabled={recording || submitting}
          >
            {m === "audio" ? "Audio" : "Video"}
          </button>
        ))}
      </div>

      {/* Stays mounted in video mode so previewRef exists before recording starts. */}
      {mode === "video" && (
        <div className="stage">
          <video ref={previewRef} className="preview" autoPlay muted playsInline hidden={!recording} />
          {!recording && <p className="stage-hint">Your camera preview appears when you start recording.</p>}
        </div>
      )}

      {recording && (
        <p className="status" role="status">
          <span className="dot" aria-hidden="true" /> Recording
        </p>
      )}

      {recording ? (
        <button type="button" className="btn btn-stop" onClick={stop}>
          Stop recording
        </button>
      ) : (
        <button type="button" className={clip ? "btn btn-secondary" : "btn btn-primary"} onClick={start} disabled={submitting}>
          {clip ? "Record again" : "Start recording"}
        </button>
      )}

      {error && (
        <p role="alert" className="error">
          Could not start recording: {error}
        </p>
      )}

      {clip && !recording && (
        <div className="playback">
          <h2 className="section-title">Your recording</h2>
          {clip.mode === "video" ? <video src={clip.url} controls className="player" /> : <audio src={clip.url} controls className="player" />}
          <p className="muted small">Review your recording, then submit it. You can only submit once.</p>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={submitting}>
            {submitting ? "Submitting\u2026" : "Submit recording"}
          </button>
          {submitError && (
            <p role="alert" className="error">
              {submitError}
            </p>
          )}
        </div>
      )}

      {/* Escape would otherwise close the dialog and unblock the page mid-upload. */}
      <dialog ref={submitDialogRef} className="submit-modal" aria-labelledby="submit-modal-title" onCancel={(e) => e.preventDefault()}>
        <div className="spinner" aria-hidden="true" />
        <p id="submit-modal-title" className="section-title">
          Submitting your recording
        </p>
        <p className="muted small">Please keep this page open until it finishes.</p>
      </dialog>
    </section>
  );
}
