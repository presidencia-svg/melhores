"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Camera, RotateCcw, Check, ShieldCheck } from "lucide-react";
import {
  loadLandmarker,
  parseDetection,
  CHALLENGES,
  type ChallengeKey,
} from "@/lib/face/liveness-detector";

type Phase = "loading" | "ready" | "challenges" | "preview" | "submitting" | "error";

const CHALLENGE_HOLD_MS = 120;

export function SelfieCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const challengeStartRef = useRef<number | null>(null);

  const [phase, setPhase] = useState<Phase>("loading");
  const [statusMsg, setStatusMsg] = useState<string>("Carregando câmera e modelo...");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const challengesRef = useRef<ChallengeKey[]>([]);
  const challengeIdxRef = useRef(0);
  const [challenges, setChallenges] = useState<ChallengeKey[]>([]);
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  const router = useRouter();

  useEffect(() => {
    challengeIdxRef.current = challengeIdx;
  }, [challengeIdx]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // 1) Load model + camera in parallel
        setStatusMsg("Carregando modelo de reconhecimento...");
        const [landmarker, stream] = await Promise.all([
          loadLandmarker(),
          navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
            audio: false,
          }),
        ]);

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // 2) Apenas sorriso — liveness mínimo
        const picked: ChallengeKey[] = ["smile"];
        challengesRef.current = picked;
        setChallenges(picked);
        setChallengeIdx(0);
        setPhase("challenges");

        // 3) Detection loop
        const detect = () => {
          if (cancelled || !videoRef.current || videoRef.current.readyState < 2) {
            rafRef.current = requestAnimationFrame(detect);
            return;
          }
          const result = landmarker.detectForVideo(videoRef.current, performance.now());
          const det = parseDetection(result);

          if (!det.hasFace) {
            setStatusMsg("Centralize seu rosto na câmera");
            setProgress(0);
            challengeStartRef.current = null;
            rafRef.current = requestAnimationFrame(detect);
            return;
          }

          const idx = challengeIdxRef.current;
          const list = challengesRef.current;
          if (idx >= list.length) {
            // All done — capture
            void capture();
            return;
          }

          const ch = CHALLENGES[list[idx]!];
          setStatusMsg(ch.label);

          if (ch.check(det)) {
            const now = performance.now();
            if (challengeStartRef.current === null) {
              challengeStartRef.current = now;
            }
            const elapsed = now - challengeStartRef.current;
            const pct = Math.min(1, elapsed / CHALLENGE_HOLD_MS);
            setProgress(pct);
            if (elapsed >= CHALLENGE_HOLD_MS) {
              // Move to next challenge
              challengeStartRef.current = null;
              setProgress(0);
              const nextIdx = idx + 1;
              setChallengeIdx(nextIdx);
              challengeIdxRef.current = nextIdx;
            }
          } else {
            challengeStartRef.current = null;
            setProgress(0);
          }

          rafRef.current = requestAnimationFrame(detect);
        };

        rafRef.current = requestAnimationFrame(detect);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Erro ao iniciar câmera";
        setErrorMsg(
          /permission|denied|notallowed/i.test(msg)
            ? "Precisamos da câmera para validar sua identidade. Permita o acesso e atualize a página."
            : "Não foi possível iniciar a câmera. Tente novamente em outro navegador."
        );
        setPhase("error");
      }
    }

    init();

    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function capture() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setPhase("preview");
  }

  function reset() {
    setPhotoData(null);
    setPhase("loading");
    setStatusMsg("Reiniciando...");
    setProgress(0);
    setChallengeIdx(0);
    challengeIdxRef.current = 0;
    challengeStartRef.current = null;
    // Force re-mount via a tiny trick: navigate to same page
    router.refresh();
  }

  async function confirm() {
    if (!photoData) return;
    setSubmitting(true);
    setPhase("submitting");
    try {
      const res = await fetch("/api/selfie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: photoData }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error ?? "Falha ao enviar selfie");
        setPhase("preview");
        setSubmitting(false);
        return;
      }
      router.push("/votar/categorias");
    } catch {
      setErrorMsg("Erro de conexão. Tente novamente.");
      setPhase("preview");
      setSubmitting(false);
    }
  }

  const showVideo = phase === "loading" || phase === "challenges";
  const ch = phase === "challenges" && challenges[challengeIdx]
    ? CHALLENGES[challenges[challengeIdx]!]
    : null;
  const totalChallenges = challenges.length;
  const completedCount = challengeIdx;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-zinc-900 ring-4 ring-cdl-blue/10">
        {photoData ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoData} alt="Selfie capturada" className="w-full h-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-cover scale-x-[-1]"
            playsInline
            muted
          />
        )}
        <canvas ref={canvasRef} className="hidden" />

        {showVideo && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-8 rounded-full border-4 border-white/40 border-dashed" />
          </div>
        )}

        {/* Status overlay no topo */}
        {phase === "challenges" && ch && (
          <div className="absolute top-4 left-4 right-4 bg-black/70 backdrop-blur-md rounded-xl px-4 py-3 text-center text-white animate-fade-in">
            <div className="text-3xl mb-1">{ch.emoji}</div>
            <div className="font-semibold text-sm">{ch.label}</div>
            <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-cdl-yellow transition-all duration-100"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-wider opacity-70">
              Desafio {completedCount + 1} de {totalChallenges}
            </div>
          </div>
        )}

        {phase === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white text-center px-6">
            <svg className="w-8 h-8 animate-spin mb-3" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" fill="none" />
            </svg>
            <p className="text-sm">{statusMsg}</p>
          </div>
        )}

        {phase === "submitting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white text-center px-6">
            <svg className="w-8 h-8 animate-spin mb-3" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" fill="none" />
            </svg>
            <p className="text-sm">Enviando selfie...</p>
          </div>
        )}
      </div>

      {phase === "challenges" && !ch && (
        <p className="text-sm text-center text-muted">{statusMsg}</p>
      )}

      {phase === "error" && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {errorMsg && phase === "preview" && (
        <p className="text-sm text-red-600 font-medium text-center">{errorMsg}</p>
      )}

      {phase === "preview" && (
        <div className="flex gap-3">
          <Button variant="outline" onClick={reset} className="flex-1" type="button">
            <RotateCcw className="w-4 h-4" />
            Refazer
          </Button>
          <Button onClick={confirm} loading={submitting} className="flex-1" type="button">
            <Check className="w-4 h-4" />
            Confirmar
          </Button>
        </div>
      )}

      {phase === "challenges" && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted">
          <ShieldCheck className="w-3 h-3 text-cdl-green" />
          <span>Validação anti-fraude em tempo real</span>
        </div>
      )}
    </div>
  );
}
