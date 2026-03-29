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
        // ── Simulated fallback (mic unavailable or inactive) ─────────────
        const target = active ? 28 : 6;
        currentAmpRef.current += (target - currentAmpRef.current) * 0.04;
        const amp = currentAmpRef.current;
        const t   = tRef.current;

        const layers = active ? 2 : 1;
        for (let l = 0; l < layers; l++) {
          const phaseOffset = l * 1.4;
          const layerAmp    = l === 0 ? amp : amp * 0.55;
          const opacity     = active ? (l === 0 ? 0.85 : 0.35) : 0.45;

          ctx.beginPath();
          ctx.strokeStyle = active
            ? `rgba(59, 111, 160, ${opacity})`
            : `rgba(168, 158, 152, ${opacity})`;
          ctx.lineWidth = (l === 0 ? 2 : 1.2) * dpr;
          ctx.lineJoin  = "round";

          const freq  = active ? 0.018 : 0.012;
          const speed = active ? 0.065 : 0.022;

          for (let px = 0; px <= W; px += 2) {
            const y =
              H / 2 +
              Math.sin(px * freq + t * speed * 60 + phaseOffset) * layerAmp * dpr +
              Math.sin(px * freq * 2.3 + t * speed * 40) * layerAmp * 0.3 * dpr;
            px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
          }
          ctx.stroke();
        }

        // Faint center line when fully idle
        if (!active && currentAmpRef.current < 8) {
          ctx.beginPath();
          ctx.strokeStyle = "rgba(168, 158, 152, 0.15)";
          ctx.lineWidth   = 1 * dpr;
          ctx.moveTo(0, H / 2);
          ctx.lineTo(W, H / 2);
          ctx.stroke();
        }

        tRef.current++;
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
