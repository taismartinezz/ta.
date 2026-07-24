"use client";

import { useRef, useState } from "react";
import { MicIcon, StopIcon } from "./icons";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export function VoiceInputButton({ onTranscribed }: { onTranscribed: (text: string) => void }) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        await transcribe(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      setError("Microphone access denied or unavailable");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function transcribe(blob: Blob) {
    setTranscribing(true);
    try {
      const buffer = await blob.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64, mimeType: blob.type }),
      });
      const data = await res.json();
      if (res.ok && data.text) {
        onTranscribed(data.text);
      } else {
        setError(data.error || "Couldn't transcribe, try again");
      }
    } catch {
      setError("Couldn't transcribe, try again");
    } finally {
      setTranscribing(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={recording ? stopRecording : startRecording}
        disabled={transcribing}
        title={recording ? "Stop recording" : "Record voice input"}
        aria-label={recording ? "Stop recording" : "Record voice input"}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-xl shadow-sm transition disabled:opacity-50 ${
          recording
            ? "animate-pulse border-red-400 bg-red-50 text-red-700 dark:border-red-500 dark:bg-red-950 dark:text-red-300"
            : "border-accent bg-accent-soft text-accent hover:bg-accent hover:text-accent-foreground"
        }`}
      >
        {transcribing ? (
          <span className="text-xs">...</span>
        ) : recording ? (
          <StopIcon size={18} />
        ) : (
          <MicIcon size={20} />
        )}
      </button>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </span>
  );
}
