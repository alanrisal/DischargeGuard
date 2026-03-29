"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ─── Robotic flat waveform (canvas) ─────────────────────────────────────────── */
function RoboticWaveform({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const tRef      = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    function draw() {
      const W = canvas!.width;
      const H = canvas!.height;
      ctx.clearRect(0, 0, W, H);

      ctx.beginPath();
      ctx.strokeStyle = active ? "rgba(240,235,227,0.35)" : "rgba(240,235,227,0.15)";
      ctx.lineWidth = 1.5;

      const amp   = active ? 14 : 4;
      const freq  = active ? 0.06 : 0.03;
      const speed = active ? 0.04 : 0.015;

      for (let x = 0; x <= W; x++) {
        const y = H / 2 + Math.sin(x * freq + tRef.current * speed * 40) * amp;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      tRef.current++;
      rafRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={60}
      style={{ width: "100%", maxWidth: 560, height: 60, opacity: active ? 1 : 0.5 }}
    />
  );
}

/* ─── Stat line component ────────────────────────────────────────────────────── */
function StatLine({ text, delay }: { text: string; delay: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      style={{
        clipPath: visible ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
        opacity: visible ? 1 : 0,
        transition: "clip-path 0.9s cubic-bezier(0.16,1,0.3,1), opacity 0.4s ease",
        fontFamily: "var(--font-display)",
        fontStyle: "italic",
        fontWeight: 300,
        fontSize: "clamp(36px, 5vw, 64px)",
        lineHeight: 1.15,
        color: "var(--landing-text)",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
}

/* ─── Landing Page ───────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [phase, setPhase]               = useState<"robotic" | "stats" | "logo">("robotic");
  const [roboActive, setRoboActive]     = useState(false);
  const [showX, setShowX]               = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showLogo, setShowLogo]         = useState(false);
  const [showCta, setShowCta]           = useState(false);

  useEffect(() => {
    // Sequence: robotic wave → X + subtitle → stats → logo + CTA
    const timers = [
      setTimeout(() => setRoboActive(true),  400),
      setTimeout(() => setShowSubtitle(true), 1800),
      setTimeout(() => setShowX(true),        2200),
      setTimeout(() => setPhase("stats"),     3400),
      setTimeout(() => setPhase("logo"),      6800),
      setTimeout(() => setShowLogo(true),     6900),
      setTimeout(() => setShowCta(true),      7800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--landing-bg)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      position: "relative",
      overflow: "hidden",
      fontFamily: "var(--font-body)",
    }}>

      {/* Subtle grain texture overlay */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
        opacity: 0.6,
      }} />

      {/* ── Robotic contrast moment ── */}
      {(phase === "robotic") && (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: 24, maxWidth: 560, width: "100%",
          animation: "fade-in 0.6s ease both",
        }}>
          {/* Cold label */}
          <div style={{
            fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 11,
            letterSpacing: "0.14em", textTransform: "uppercase",
            color: "var(--landing-muted)",
          }}>
            Current Standard of Care
          </div>

          {/* Robotic waveform */}
          <div style={{ width: "100%", position: "relative" }}>
            <RoboticWaveform active={roboActive} />
            {/* Red X that fades in */}
            {showX && (
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%,-50%)",
                fontSize: 48, color: "#B84040",
                animation: "fade-in 0.4s ease both",
                lineHeight: 1,
              }}>
                ✕
              </div>
            )}
          </div>

          {/* Subtitle */}
          {showSubtitle && (
            <div style={{
              fontFamily: "var(--font-body)", fontWeight: 300,
              fontSize: "clamp(13px, 1.8vw, 16px)",
              color: "var(--landing-muted)",
              textAlign: "center",
              fontStyle: "italic",
              animation: "fade-in 0.7s ease both",
              maxWidth: 380,
            }}>
              "Your discharge instructions have been sent. Please refer to page four for medication guidance."
            </div>
          )}
        </div>
      )}

      {/* ── Stat reveal ── */}
      {(phase === "stats" || phase === "logo") && (
        <div style={{
          display: "flex", flexDirection: "column",
          alignItems: "flex-start",
          gap: 4,
          animation: phase === "logo" ? "fade-in 0.4s ease both" : undefined,
          opacity: phase === "logo" ? 0 : 1,
          transition: "opacity 0.6s ease",
        }}>
          <StatLine text="1 in 5 patients"        delay={100} />
          <StatLine text="are readmitted"          delay={500} />
          <StatLine text="within 30 days."         delay={900} />
          <div style={{
            marginTop: 20,
            fontFamily: "var(--font-body)",
            fontSize: "clamp(13px, 1.6vw, 15px)",
            color: "var(--landing-muted)",
            fontWeight: 300,
            animation: "fade-in 1s 1.4s ease both",
            opacity: 0,
            animationFillMode: "forwards",
          }}>
            Not because they didn't care. Because no one followed up.
          </div>
        </div>
      )}

      {/* ── Logo + CTA ── */}
      {phase === "logo" && (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: 32, marginTop: 0,
        }}>

          {/* Logo lockup */}
          {showLogo && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 12,
              animation: "logo-in 0.8s cubic-bezier(0.16,1,0.3,1) both",
              position: "relative",
            }}>
              {/* Pulse ring behind logo */}
              <div style={{
                position: "absolute",
                width: 90, height: 90, borderRadius: "50%",
                border: "1px solid rgba(194,113,79,0.3)",
                animation: "pulse-ring 2s ease-out 0.3s 1 both",
                top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
              }} />

              {/* Wordmark */}
              <div style={{ textAlign: "center" }}>
                <span style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: 300,
                  fontSize: "clamp(42px, 6vw, 72px)",
                  color: "var(--landing-text)",
                  letterSpacing: "-1px",
                }}>
                  Care
                </span>
                <span style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 300,
                  fontSize: "clamp(42px, 6vw, 72px)",
                  color: "var(--landing-accent)",
                  letterSpacing: "-2px",
                }}>
                  Call
                </span>
              </div>

              <div style={{
                fontFamily: "var(--font-body)",
                fontWeight: 300,
                fontSize: "clamp(12px, 1.4vw, 14px)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--landing-muted)",
              }}>
                AI · Multilingual · Post-discharge
              </div>
            </div>
          )}

          {/* CTA */}
          {showCta && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <Link href="/my-care" style={{ textDecoration: "none" }}>
              <button
                style={{
                  background: "transparent",
                  border: "1px solid rgba(240,235,227,0.18)",
                  borderRadius: 999,
                  padding: "10px 32px",
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                  fontSize: 13,
                  letterSpacing: "0.06em",
                  color: "rgba(240,235,227,0.85)",
                  cursor: "pointer",
                  animation: "slide-up 0.5s ease both",
                  transition: "border-color 250ms ease, background 250ms ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(240,235,227,0.08)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(240,235,227,0.35)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(240,235,227,0.18)";
                }}
              >
                My care portal →
              </button>
            </Link>

            <Link href="/patients" style={{ textDecoration: "none" }}>
              <button
                style={{
                  background: "transparent",
                  border: "1px solid rgba(240,235,227,0.25)",
                  borderRadius: 999,
                  padding: "14px 44px",
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                  fontSize: 14,
                  letterSpacing: "0.08em",
                  color: "var(--landing-text)",
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                  animation: "slide-up 0.5s ease both",
                  transition: "border-color 250ms ease, background 250ms ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(194,113,79,0.12)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(194,113,79,0.5)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(240,235,227,0.25)";
                }}
              >
                Open Dashboard →
              </button>
            </Link>
            </div>
          )}

          {/* Bottom attribution */}
          {showCta && (
            <div style={{
              fontFamily: "var(--font-body)", fontWeight: 300, fontSize: 11,
              color: "rgba(240,235,227,0.2)", letterSpacing: "0.1em",
              animation: "fade-in 0.6s 0.4s ease both", opacity: 0,
              animationFillMode: "forwards",
            }}>
              Google ADK · ElevenLabs · Gemini
            </div>
          )}
        </div>
      )}
    </div>
  );
}
