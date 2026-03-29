"use client";
import { useRef } from "react";
import type { TranscriptEntry } from "@/lib/useVoiceAgent";

// ── Sentiment classification ──────────────────────────────────────────────────
const CONFIRMED_KW  = ["yes", "understand", "got it", "okay", "i will", "i'll", "confirmed", "sure", "will do", "i know", "correct", "right"];
const HESITATION_KW = ["i think", "maybe", "not sure", "i don't know", "i'm not sure", "what", "huh", "pardon", "could you repeat", "again", "confused", "unclear"];
const CONTRADICTION_KW = ["no", "i don't", "i won't", "i can't", "i didn't", "i haven't", "never", "don't understand", "no idea", "what does that mean"];

type Sentiment = "confirmed" | "hesitation" | "contradiction" | "neutral";

function classifySentiment(text: string, role: "agent" | "user"): Sentiment {
  if (role === "agent") return "neutral";
  const lower = text.toLowerCase();
  if (CONTRADICTION_KW.some((k) => lower.includes(k))) return "contradiction";
  if (HESITATION_KW.some((k) => lower.includes(k)))    return "hesitation";
  if (CONFIRMED_KW.some((k) => lower.includes(k)))     return "confirmed";
  return "neutral";
}

const SENTIMENT_STYLES: Record<Sentiment, { bg: string; border: string; label: string; labelColor: string }> = {
  confirmed:    { bg: "var(--clinical-blue-light)",  border: "var(--clinical-blue)", label: "Understood",  labelColor: "var(--clinical-blue)" },
  hesitation:   { bg: "rgba(212, 129, 58, 0.10)",    border: "var(--warning-amber)", label: "Hesitation",  labelColor: "var(--warning-amber)" },
  contradiction:{ bg: "var(--alert-red-light)",       border: "var(--alert-red)",     label: "Confusion",   labelColor: "var(--alert-red)" },
  neutral:      { bg: "transparent",                  border: "transparent",          label: "",            labelColor: "" },
};

interface Props {
  transcript: TranscriptEntry[];
  isConnected: boolean;
  isPhoneMode: boolean;
}

export default function ComprehensionTranscript({ transcript, isConnected, isPhoneMode }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // "Jump to Friction" — scroll to first red/yellow entry
  function jumpToFriction() {
    if (!containerRef.current) return;
    const frictionEntries = transcript.filter(
      (e) => e.role === "user" && ["hesitation", "contradiction"].includes(classifySentiment(e.text, "user"))
    );
    if (frictionEntries.length === 0) return;
    const target = containerRef.current.querySelector(`[data-entry-id="${frictionEntries[0].id}"]`);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const hasFriction = transcript.some(
    (e) => e.role === "user" && ["hesitation", "contradiction"].includes(classifySentiment(e.text, "user"))
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, height: "100%", minHeight: 0 }}>

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", color: "var(--text-tertiary)",
        }}>
          Semantic Analysis Timeline
          {isPhoneMode && (
            <span style={{ fontWeight: 400, marginLeft: 6, letterSpacing: "0.03em", textTransform: "none" }}>
              (~1–2 s delay)
            </span>
          )}
        </span>

        {hasFriction && (
          <button
            onClick={jumpToFriction}
            style={{
              background: "var(--alert-red-light)",
              border: "1px solid rgba(212, 53, 28, 0.3)",
              borderRadius: 999,
              padding: "4px 14px",
              fontSize: 10, fontWeight: 600,
              color: "var(--alert-red)",
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
              minHeight: 44, minWidth: 44,
              fontFamily: "var(--font-body)",
            }}
            aria-label="Jump to comprehension friction points"
          >
            Jump to Friction
          </button>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
        {[
          { color: "var(--clinical-blue)", label: "Confirmed" },
          { color: "var(--warning-amber)", label: "Hesitation" },
          { color: "var(--alert-red)",     label: "Confusion" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: color, opacity: 0.7 }} />
            <span style={{ fontSize: 9, color: "var(--text-tertiary)", fontWeight: 500 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Transcript scroll area */}
      <div
        ref={containerRef}
        style={{
          flex: 1, overflowY: "auto",
          background: "var(--surface-inset)",
          boxShadow: "inset 4px 4px 10px var(--shadow-dark), inset -4px -4px 10px var(--shadow-light)",
          borderRadius: 12, padding: "12px",
          display: "flex", flexDirection: "column", gap: 6,
        }}
      >
        {transcript.length === 0 ? (
          <p style={{
            color: "var(--text-tertiary)", fontSize: 13,
            textAlign: "center", marginTop: 24,
            fontStyle: "italic", fontWeight: 300,
          }}>
            {isConnected ? "Listening…" : "Start a call to see the comprehension timeline."}
          </p>
        ) : (
          transcript.map((entry) => {
            const sentiment = classifySentiment(entry.text, entry.role);
            const style     = SENTIMENT_STYLES[sentiment];
            const isAgent   = entry.role === "agent";

            return (
              <div
                key={entry.id}
                data-entry-id={entry.id}
                style={{
                  display: "flex",
                  flexDirection: isAgent ? "row" : "row-reverse",
                  gap: 8,
                  alignItems: "flex-start",
                }}
              >
                {/* Role badge */}
                <div style={{
                  flexShrink: 0,
                  width: 28, height: 28,
                  borderRadius: "50%",
                  background: isAgent ? "rgba(0, 94, 184, 0.12)" : "rgba(74, 140, 111, 0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 700,
                  color: isAgent ? "var(--clinical-blue)" : "var(--accent-success)",
                  minWidth: 28, minHeight: 28,
                }}>
                  {isAgent ? "AI" : "PT"}
                </div>

                {/* Bubble */}
                <div style={{
                  maxWidth: "80%",
                  background: isAgent ? "var(--surface-raised)" : style.bg || "var(--surface-raised)",
                  borderLeft: !isAgent && style.border !== "transparent"
                    ? `3px solid ${style.border}`
                    : undefined,
                  borderRight: isAgent ? undefined : undefined,
                  borderRadius: isAgent ? "4px 12px 12px 12px" : "12px 4px 12px 12px",
                  padding: "8px 12px",
                  boxShadow: "2px 2px 6px var(--shadow-dark), -1px -1px 4px var(--shadow-light)",
                }}>
                  {/* Sentiment label for patient turns */}
                  {!isAgent && sentiment !== "neutral" && (
                    <div style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: "0.07em",
                      color: style.labelColor, marginBottom: 4,
                      textTransform: "uppercase",
                    }}>
                      {style.label}
                    </div>
                  )}
                  <p style={{
                    fontSize: 13, lineHeight: 1.5,
                    color: "var(--text-primary)",
                    margin: 0,
                    fontWeight: isAgent ? 400 : 500,
                  }}>
                    {entry.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
