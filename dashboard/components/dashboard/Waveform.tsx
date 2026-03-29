"use client";
import { useEffect, useRef } from "react";

interface Props {
  isActive: boolean;
  height?: number;
}

export default function Waveform({ isActive, height = 72 }: Props) {
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const rafRef        = useRef<number>(0);
  const tRef          = useRef(0);
  const isActiveRef   = useRef(isActive);

  // Web Audio refs
  const audioCtxRef   = useRef<AudioContext | null>(null);
  const analyserRef   = useRef<AnalyserNode | null>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const dataArrayRef  = useRef<Uint8Array<ArrayBuffer> | null>(null);

  // Idle sim amplitude
  const currentAmpRef = useRef(6);

  // Keep isActive ref in sync
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // Mic setup / teardown
  useEffect(() => {
    if (isActive) {
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: false })
        .then((stream) => {
          streamRef.current = stream;
          const ctx = new AudioContext();
          audioCtxRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 1024;
          analyser.smoothingTimeConstant = 0.82;
          source.connect(analyser);
          analyserRef.current = analyser;
          dataArrayRef.current = new Uint8Array(analyser.fftSize) as Uint8Array<ArrayBuffer>;
        })
        .catch(() => {
          // Mic denied — silently fall back to simulated waveform
        });
    } else {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
      analyserRef.current = null;
      dataArrayRef.current = null;
    }

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close().catch(() => {});
    };
  }, [isActive]);

  // Canvas + RAF loop — runs once, reads refs each frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function resize() {
      if (!canvas) return;
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width  = rect.width  * window.devicePixelRatio;
      canvas.height = height      * window.devicePixelRatio;
      canvas.style.width  = rect.width + "px";
      canvas.style.height = height + "px";
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    const ctx = canvas.getContext("2d")!;

    function draw() {
      const W      = canvas!.width;
      const H      = canvas!.height;
      const dpr    = window.devicePixelRatio;
      const active = isActiveRef.current;

      ctx.clearRect(0, 0, W, H);

      if (active && analyserRef.current && dataArrayRef.current) {
        // ── Real microphone waveform ────────────────────────────────────
        analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
        const data = dataArrayRef.current;
        const len  = data.length;

        // Glow pass (thick + transparent)
        ctx.beginPath();
        ctx.strokeStyle = "rgba(59, 111, 160, 0.18)";
        ctx.lineWidth   = 6 * dpr;
        ctx.lineJoin    = "round";
        ctx.lineCap     = "round";
        for (let i = 0; i < len; i++) {
          const x = (i / (len - 1)) * W;
          const y = H / 2 + (data[i] / 128.0 - 1) * (H / 2) * 0.78;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Main line
        ctx.beginPath();
        ctx.strokeStyle = "rgba(59, 111, 160, 0.92)";
        ctx.lineWidth   = 2 * dpr;
        ctx.lineJoin    = "round";
        ctx.lineCap     = "round";
        for (let i = 0; i < len; i++) {
          const x = (i / (len - 1)) * W;
          const y = H / 2 + (data[i] / 128.0 - 1) * (H / 2) * 0.78;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();

      } else {
        // ── Idle: flat line only, no animation ───────────────────────────
        ctx.beginPath();
        ctx.strokeStyle = "rgba(168, 158, 152, 0.3)";
        ctx.lineWidth   = 1.5 * dpr;
        ctx.moveTo(0, H / 2);
        ctx.lineTo(W, H / 2);
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [height]); // RAF loop never re-mounts; reads isActive via ref

  return (
    <div style={{ width: "100%", position: "relative" }}>
      <canvas ref={canvasRef} style={{ display: "block", borderRadius: 8 }} />
    </div>
  );
}
