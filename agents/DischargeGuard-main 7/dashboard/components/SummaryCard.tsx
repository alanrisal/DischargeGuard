"use client";

const STEPS: Record<string, string> = {
  opening:               "Opening",
  symptoms:              "Symptoms Check",
  medications:           "Medications",
  activity_restrictions: "Activity Restrictions",
  wound_care:            "Wound Care",
  follow_ups:            "Follow-Up Appointments",
  warning_signs:         "Warning Signs",
  open_questions:        "Open Questions",
  closing:               "Closing",
};

const MED_KEYWORDS     = ["medication", "pill", "tablet", "taking", "dose", "prescription", "medicine"];
const SYMPTOM_KEYWORDS = ["pain", "fever", "headache", "bleeding", "dizzy", "nausea", "swelling", "breath", "chest", "hurt", "sore"];
const POSITIVE_KEYWORDS = ["yes", "understand", "got it", "okay", "sure", "will do", "i will", "i'll", "confirmed"];

function parseTranscript(transcript: string) {
  const lines    = transcript.split("\n").filter(Boolean);
  const ptLines  = lines.filter((l) => l.startsWith("PT:")).map((l) => l.replace(/^PT:\s*/, "").trim());
  const medLines: string[]     = [];
  const symptomLines: string[] = [];
  const keyMoments: string[]   = [];

  ptLines.forEach((line) => {
    const lower = line.toLowerCase();
    if (MED_KEYWORDS.some((k) => lower.includes(k)))                              medLines.push(line);
    if (SYMPTOM_KEYWORDS.some((k) => lower.includes(k)))                          symptomLines.push(line);
    if (POSITIVE_KEYWORDS.some((k) => lower.includes(k)) && line.length < 120)   keyMoments.push(line);
  });

  return { medLines: medLines.slice(0, 3), symptomLines: symptomLines.slice(0, 3), keyMoments: keyMoments.slice(0, 2) };
}

interface Props {
  sessionData: {
    completedSteps: string[];
    flaggedWarnings: { sign: string; severity: string }[];
    transcript: string;
    callDuration: string;
  };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
      textTransform: "uppercase" as const, color: "var(--text-tertiary)",
      fontFamily: "var(--font-body)", marginBottom: 8,
    }}>
      {children}
    </div>
  );
}

export default function SummaryCard({ sessionData }: Props) {
  const { completedSteps, flaggedWarnings, callDuration, transcript } = sessionData;
  const total = Object.keys(STEPS).length;
  const comp  = Math.round((completedSteps.length / total) * 100);

  const scoreColor = comp > 80
    ? "var(--accent-success)"
    : comp > 50
    ? "var(--warning-amber)"
    : "var(--warning-red)";

  const { medLines, symptomLines, keyMoments } = parseTranscript(transcript);

  // Build highlights
  const highlights: { icon: string; colorVar: string; bgVar: string; accentVar: string; text: string }[] = [];

  if (completedSteps.includes("medications")) {
    highlights.push({
      icon: "💊", colorVar: "var(--accent-success)",
      bgVar: "var(--accent-success-light)", accentVar: "var(--accent-success)",
      text: medLines.length > 0
        ? `Medications reviewed — patient confirmed: "${medLines[0]}"`
        : "Medications reviewed — patient confirmed all prescriptions",
    });
  } else {
    highlights.push({
      icon: "💊", colorVar: "var(--warning-amber)",
      bgVar: "var(--warning-amber-bg)", accentVar: "var(--warning-amber)",
      text: "Medications not completed — follow-up recommended",
    });
  }

  if (completedSteps.includes("symptoms")) {
    highlights.push({
      icon: "🩺", colorVar: "var(--accent-success)",
      bgVar: "var(--accent-success-light)", accentVar: "var(--accent-success)",
      text: symptomLines.length > 0
        ? `Symptoms discussed — patient reported: "${symptomLines[0]}"`
        : "Symptoms check completed — no critical concerns",
    });
  }

  if (completedSteps.includes("warning_signs")) {
    highlights.push({
      icon: "⚠️", colorVar: "var(--accent-success)",
      bgVar: "var(--accent-success-light)", accentVar: "var(--accent-success)",
      text: "Warning signs reviewed — patient knows ER triggers",
    });
  }

  flaggedWarnings.forEach((w) => {
    highlights.push({
      icon: w.severity === "urgent" ? "🚨" : "⚠️",
      colorVar: w.severity === "urgent" ? "var(--warning-red)" : "var(--warning-amber)",
      bgVar: w.severity === "urgent" ? "var(--warning-red-bg)" : "var(--warning-amber-bg)",
      accentVar: w.severity === "urgent" ? "var(--warning-red)" : "var(--warning-amber)",
      text: `Concerning symptom flagged: ${w.sign}`,
    });
  });

  if (completedSteps.length === total) {
    highlights.push({
      icon: "✅", colorVar: "var(--accent-success)",
      bgVar: "var(--accent-success-light)", accentVar: "var(--accent-success)",
      text: "All workflow steps completed successfully",
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Title */}
      <h2 style={{
        fontFamily: "var(--font-display)", fontStyle: "italic",
        fontWeight: 300, fontSize: 15, color: "var(--text-primary)",
        marginBottom: 16, margin: "0 0 16px 0",
      }}>
        Session Summary
      </h2>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { val: `${completedSteps.length}/${total}`, label: "Steps Done",    color: "var(--accent-success)" },
          { val: `${comp}%`,                           label: "Comprehension", color: scoreColor },
          { val: callDuration,                         label: "Duration",      color: "var(--accent-clinical)" },
        ].map(({ val, label, color }) => (
          <div key={label} style={{
            background: "var(--surface-inset)",
            boxShadow: "inset 3px 3px 7px var(--shadow-dark), inset -3px -3px 7px var(--shadow-light)",
            borderRadius: 12, padding: "12px 10px", textAlign: "center",
          }}>
            <div style={{
              fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 400,
              color, lineHeight: 1, marginBottom: 5,
            }}>
              {val}
            </div>
            <div style={{
              fontSize: 9, color: "var(--text-tertiary)",
              fontFamily: "var(--font-body)", fontWeight: 500,
              letterSpacing: "0.07em", textTransform: "uppercase" as const,
            }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Call highlights */}
      {highlights.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <SectionLabel>Call Highlights</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {highlights.slice(0, 4).map((h, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                background: h.bgVar,
                borderLeft: `2px solid ${h.accentVar}`,
                borderRadius: "0 8px 8px 0",
                padding: "8px 10px",
              }}>
                <span style={{ fontSize: 12, flexShrink: 0 }}>{h.icon}</span>
                <span style={{
                  fontSize: 11, color: h.colorVar,
                  lineHeight: 1.4, fontFamily: "var(--font-body)", fontWeight: 400,
                }}>
                  {h.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patient quotes */}
      {keyMoments.length > 0 && (
        <div style={{
          background: "var(--surface-inset)",
          boxShadow: "inset 3px 3px 7px var(--shadow-dark), inset -3px -3px 7px var(--shadow-light)",
          borderRadius: 12, padding: "12px 14px", marginBottom: 14,
        }}>
          <SectionLabel>Patient Responses</SectionLabel>
          {keyMoments.map((q, i) => (
            <div key={i} style={{
              fontSize: 11, color: "var(--text-secondary)",
              fontStyle: "italic", lineHeight: 1.5,
              padding: "4px 0",
              borderBottom: i < keyMoments.length - 1 ? "1px solid var(--shadow-dark)" : undefined,
            }}>
              "{q}"
            </div>
          ))}
        </div>
      )}

      {/* Symptom mentions */}
      {symptomLines.length > 0 && (
        <div style={{
          background: "var(--warning-amber-bg)",
          borderLeft: "2px solid var(--warning-amber)",
          borderRadius: "0 10px 10px 0",
          padding: "10px 14px", marginBottom: 14,
        }}>
          <SectionLabel>Symptom Mentions</SectionLabel>
          {symptomLines.map((s, i) => (
            <div key={i} style={{
              fontSize: 11, color: "var(--text-primary)",
              fontFamily: "var(--font-body)", padding: "2px 0",
            }}>
              ⚡ {s}
            </div>
          ))}
        </div>
      )}

      {/* Workflow progress */}
      <div style={{
        background: "var(--surface-inset)",
        boxShadow: "inset 3px 3px 7px var(--shadow-dark), inset -3px -3px 7px var(--shadow-light)",
        borderRadius: 12, padding: "12px 14px",
      }}>
        <SectionLabel>Workflow Progress</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {Object.entries(STEPS).map(([id, label], idx, arr) => {
            const done = completedSteps.includes(id);
            return (
              <div key={id} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 0",
                borderBottom: idx < arr.length - 1 ? "1px solid var(--shadow-dark)" : undefined,
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: "50%",
                  flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 8, fontWeight: 700,
                  background: done ? "var(--accent-success-light)" : "var(--surface-raised)",
                  boxShadow: done
                    ? undefined
                    : "2px 2px 4px var(--shadow-dark), -2px -2px 4px var(--shadow-light)",
                  color: done ? "var(--accent-success)" : "var(--text-tertiary)",
                }}>
                  {done ? "✓" : "○"}
                </div>
                <div style={{
                  flex: 1,
                  fontSize: 11, fontWeight: done ? 500 : 400,
                  color: done ? "var(--text-primary)" : "var(--text-tertiary)",
                  fontFamily: "var(--font-body)",
                }}>
                  {label}
                </div>
                <div style={{
                  fontSize: 9, fontWeight: 600, letterSpacing: "0.06em",
                  color: done ? "var(--accent-success)" : "var(--shadow-dark)",
                  fontFamily: "var(--font-body)",
                }}>
                  {done ? "DONE" : "—"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
