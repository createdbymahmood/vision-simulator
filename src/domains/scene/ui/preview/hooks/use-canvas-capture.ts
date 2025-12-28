import { useRef, useState } from "react";
import { useCallbackRef } from "@radix-ui/react-use-callback-ref";
import { useToast } from "@/components/ui/toast";

export function useCanvasCapture(canvas: HTMLCanvasElement | null) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const { push } = useToast();

  const startRecording = useCallbackRef(() => {
    if (!canvas) return;
    const stream = canvas.captureStream(60);
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "recording.webm";
      anchor.click();
      URL.revokeObjectURL(url);
    };
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
    push({ title: "Recording started", description: "Capture of main viewport running." });
  });

  const stopRecording = useCallbackRef(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
    push({ title: "Recording finished", description: "Saved WebM clip." });
  });

  const snapshot = useCallbackRef(() => {
    if (!canvas) return;
    const data = canvas.toDataURL("image/png", 1.0);
    const anchor = document.createElement("a");
    anchor.href = data;
    anchor.download = "snapshot.png";
    anchor.click();
    push({ title: "Snapshot exported", description: "PNG saved." });
  });

  const toggleRecording = useCallbackRef(() => {
    if (recorderRef.current) stopRecording();
    else startRecording();
  });

  return {
    recording,
    startRecording,
    stopRecording,
    snapshot,
    toggleRecording,
  };
}
