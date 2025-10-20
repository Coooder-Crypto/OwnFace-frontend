"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  onClear?: () => void;
}

export function CameraCapture({ onCapture, onClear }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" } })
      .then((mediaStream) => {
        if (!active) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "无法访问摄像头");
      });

    return () => {
      active = false;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [stream]);

  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const context = canvas.getContext("2d");
    if (!context) {
      setError("无法捕捉视频帧");
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    const base64 = dataUrl.split(",")[1];
    if (base64) {
      setCaptured(dataUrl);
      onCapture(base64);
    }
  };

  const handleRetake = () => {
    setCaptured(null);
    onClear?.();
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        {captured ? (
          <img
            src={captured}
            alt="Captured preview"
            className="h-64 w-full rounded-lg object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-64 w-full rounded-lg bg-black object-cover"
          />
        )}
      </div>
      {error && <div className="text-sm text-rose-400">{error}</div>}
      <div className="flex gap-3">
        {captured ? (
          <button
            type="button"
            onClick={handleRetake}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white transition hover:bg-white/10"
          >
            重新拍摄
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCapture}
            className="rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-4 py-2 text-sm font-semibold text-white shadow shadow-violet-500/40 transition hover:shadow-violet-500/60"
          >
            捕捉图像
          </button>
        )}
      </div>
    </div>
  );
}
