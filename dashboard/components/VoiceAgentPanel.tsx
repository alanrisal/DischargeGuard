"use client";
import { useEffect, useRef } from "react";
import { ConversationProvider } from "@elevenlabs/react";
import { useVoiceAgent, WORKFLOW_STEPS } from "@/lib/useVoiceAgent";

const C = {
  accent:  "#2563eb",
  green:   "#16a34a",
  amber:   "#d97706",
  red:     "#dc2626",
  muted:   "#6b7a9e",
  border:  "#dde3f5",
  text:    "#1a2340",
};

// ── Inner panel (must live inside ConversationProvider) ───────────────────────
function VoiceAgentInner() {
  const {
    status, isSpeaking,
    transcript, currentStep, completedSteps, flaggedWarnings,
    startCall, endCall,
  } = useVoiceAgent();

  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  const connected  = status === "connected";
  const connecting = status === "connecting";

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 16, height: "100%",
      fontFamily: "'Outfit', system-ui, sans-serif",
    }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Voice Agent</span>
          <StatusDot status={status} isSpeaking={isSpeaking} />
        </div>
        <button
          onClick={connected ? endCall : startCall}
          disabled={connecting}
          style={{
            padding: "6px 16px", borderRadius: 8, border: "none",
            cursor: connecting ? "not-allowed" : "pointer",
            fontFamily: "inherit", fontSize: 12, fontWeight: 600,
            background: connected ? C.red : C.accent, color: "#fff",
            opacity: connecting ? 0.6 : 1, transition: "background 0.2s",
          }}
        >
          {connecting ? "Connecting…" : connected ? "End Call" : "Start Call"}
        </button>
      </div>

      {/* ── Body: transcript + sidebar ── */}
      <div style={{
        flex: 1, display: "grid", gridTemplateColumns: "1fr 180px",
        gap: 14, minHeight: 0,
      }}>

        {/* LEFT: live transcript */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: 0 }}>
          <span style={{
            fontSize: 10, fontWeight: 600, color: C.muted,
            letterSpacing: "0.6px", textTransform: "uppercase",
          }}>
            Live Transcript
          </span>
          <div
            ref={transcriptRef}
            style={{
              flex: 1, overflowY: "auto",
              background: "#fff", border: `1px solid ${C.border}`,
              borderRadius: 10, padding: "10px 12px",
              display: "flex", flexDirection: "column", gap: 8,
            }}
          >
            {transcript.length === 0 ? (
              <p style={{ color: C.muted, fontSize: 11, textAlign: "center", marginTop: 20 }}>
                {connected ? "Listening…" : "Start a call to see the live transcript."}
              </p>
            ) : (
              transcript.map((entry) => (
                <div key={entry.id} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, fontFamily: "monospace",
                    color: entry.role === "agent" ? C.accent : C.green,
                    paddingTop: 2, flexShrink: 0, width: 28,
                  }}>
                    {entry.role === "agent" ? "ALEX" : "PT"}
                  </span>
                  <span style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>
                    {entry.text}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: workflow steps + warnings */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 0, overflow: "hidden" }}>

          {/* Workflow */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{
              fontSize: 10, fontWeight: 600, color: C.muted,
              letterSpacing: "0.6px", textTransform: "uppercase",
            }}>
              Workflow
            </span>
            <div style={{
              background: "#fff", border: `1px solid ${C.border}`,
              borderRadius: 10, padding: "8px 10px",
              display: "flex", flexDirection: "column", gap: 5,
            }}>
              {WORKFLOW_STEPS.map((step) => {
                const isDone   = completedSteps.includes(step.id);
                const isActive = currentStep === step.id && !isDone;
                const isPending = !isDone && !isActive && currentStep !== null;
                return (
                  <div key={step.id} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    opacity: isPending ? 0.4 : 1,
                  }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                      background: isDone ? C.green : isActive ? C.accent : C.border,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 7, color: "#fff", fontWeight: 700,
                      ...(isActive ? { animation: "pulseRing 1.4s ease-in-out infinite" } : {}),
                    }}>
                      {isDone ? "✓" : ""}
                    </div>
                    <span style={{
                      fontSize: 10, lineHeight: 1.3,
                      color: isDone ? C.green : isActive ? C.accent : C.text,
                      fontWeight: isActive ? 700 : 400,
                    }}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Flagged warnings */}
          {flaggedWarnings.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{
                fontSize: 10, fontWeight: 600, color: C.red,
                letterSpacing: "0.6px", textTransform: "uppercase",
              }}>
                ⚠ Warnings
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" }}>
                {flaggedWarnings.map((w) => (
                  <div key={w.id} style={{
                    background: w.severity === "urgent" ? "#fef2f2" : "#fffbeb",
                    border: `1px solid ${w.severity === "urgent" ? "#fecaca" : "#fde68a"}`,
                    borderRadius: 8, padding: "6px 8px",
                  }}>
                    <div style={{
                      fontSize: 8, fontWeight: 700, fontFamily: "monospace",
                      color: w.severity === "urgent" ? C.red : C.amber,
                      marginBottom: 2,
                    }}>
                      {w.severity.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 10, color: C.text }}>{w.sign}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulseRing {
          0%, 100% { box-shadow: 0 0 0 2px ${C.accent}44; }
          50%       { box-shadow: 0 0 0 5px ${C.accent}11; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </div>
  );
}

// ── Status indicator ──────────────────────────────────────────────────────────
function StatusDot({ status, isSpeaking }: { status: string; isSpeaking: boolean }) {
  const color =
    status === "connected"    ? (isSpeaking ? C.accent : C.green)
    : status === "connecting" ? C.amber
    : C.muted;

  const label =
    status === "connected"    ? (isSpeaking ? "Speaking" : "Listening")
    : status === "connecting" ? "Connecting"
    : "Idle";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{
        width: 7, height: 7, borderRadius: "50%", background: color,
        ...(status === "connected" ? { animation: "pulse 1.5s ease-in-out infinite" } : {}),
      }} />
      <span style={{ fontSize: 10, color, fontFamily: "monospace", fontWeight: 600 }}>
        {label}
      </span>
    </div>
  );
}

// ── Public export: wraps inner with required ConversationProvider ─────────────
export default function VoiceAgentPanel() {
  return (
    <ConversationProvider>
      <VoiceAgentInner />
    </ConversationProvider>
  );
}
