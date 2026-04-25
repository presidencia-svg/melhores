"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Camera, RotateCcw, Check } from "lucide-react";

export function SelfieCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    async function startCamera() {
      try {
        const media = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
          audio: false,
        });
        if (!active) {
          media.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(media);
        if (videoRef.current) {
          videoRef.current.srcObject = media;
          await videoRef.current.play();
        }
      } catch {
        setError("Não foi possível acessar a câmera. Verifique as permissões e tente novamente.");
      }
    }
    if (!photoData) startCamera();
    return () => {
      active = false;
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoData]);

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const xOffset = (video.videoWidth - size) / 2;
    const yOffset = (video.videoHeight - size) / 2;
    ctx.drawImage(video, xOffset, yOffset, size, size, 0, 0, size, size);
    setPhotoData(canvas.toDataURL("image/jpeg", 0.85));
    if (stream) stream.getTracks().forEach((t) => t.stop());
    setStream(null);
  }

  function reset() {
    setPhotoData(null);
  }

  async function confirm() {
    if (!photoData) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/selfie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: photoData }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Falha ao enviar selfie");
        setSubmitting(false);
        return;
      }
      router.push("/votar/categorias");
    } catch {
      setError("Erro ao enviar. Tente novamente.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-zinc-100 ring-4 ring-cdl-blue/10">
        {photoData ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoData} alt="Selfie capturada" className="w-full h-full object-cover" />
        ) : (
          <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" playsInline muted />
        )}
        <canvas ref={canvasRef} className="hidden" />

        {!photoData && !error && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-8 rounded-full border-4 border-white/40 border-dashed" />
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 font-medium text-center">{error}</p>
      )}

      <div className="flex gap-3">
        {photoData ? (
          <>
            <Button variant="outline" onClick={reset} className="flex-1" type="button">
              <RotateCcw className="w-4 h-4" />
              Refazer
            </Button>
            <Button onClick={confirm} loading={submitting} className="flex-1" type="button">
              <Check className="w-4 h-4" />
              Confirmar
            </Button>
          </>
        ) : (
          <Button onClick={capture} disabled={!stream} className="w-full" type="button">
            <Camera className="w-4 h-4" />
            Tirar selfie
          </Button>
        )}
      </div>
    </div>
  );
}
