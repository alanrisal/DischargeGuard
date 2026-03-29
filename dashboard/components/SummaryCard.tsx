"use client";

const STEPS: Record<string, string> = {
  opening: "Opening", symptoms: "Symptoms Check", medications: "Medications",
  activity_restrictions: "Activity Restrictions", wound_care: "Wound Care",
  follow_ups: "Follow-Up Appointments", warning_signs: "Warning Signs",
  open_questions: "Open Questions", closing: "Closing",
};

// Keywords to detect in patient (PT) lines
const MED_KEYWORDS    = ["medication", "pill", "tablet", "taking", "dose", "prescription", "medicine"];
const SYMPTOM_KEYWORDS = ["pain", "fever", "headache", "bleeding", "dizzy", "nausea", "swelling", "breath", "chest", "hurt", "sore", "discomfort"];
const POSITIVE_KEYWORDS = ["yes", "understand", "got it", "okay", "sure", "will do", "i will", "i'll", "confirmed"];

function parseTranscript(transcript: string): {
  medLines: string[];
  symptomLines: string[];
  keyMoments: string[];
} {
  const lines = transcript.split("\n").filter(Boolean);
  const ptLines = lines.filter((l) => l.startsWith("PT:")).map((l) => l.replace(/^PT:\s*/, "").trim());

  const medLines: string[]     = [];
  const symptomLines: string[] = [];
  const keyMoments: string[]   = [];

  ptLines.forEach((line) => {
    const lower = line.toLowerCase();
    if (MED_KEYWORDS.some((k) => lower.includes(k))) medLines.push(line);
    if (SYMPTOM_KEYWORDS.some((k) => lower.includes(k))) symptomLines.push(line);
    if (POSITIVE_KEYWORDS.some((k) => lower.includes(k)) && line.length < 120) keyMoments.push(line);
  });

  return {
    medLines:    medLines.slice(0, 3),
    symptomLines: symptomLines.slice(0, 3),
    keyMoments:  keyMoments.slice(0, 2),
  };
}

interface Props {
  sessionData: {
    completedSteps: string[];
    flaggedWarnings: { sign: string; severity: string }[];
    transcript: string;
    callDuration: string;
  };
}

export default function SummaryCard({ sessionData }: Props) {
  const { completedSteps, flaggedWarnings, callDuration, transcript } = sessionData;
  const total = Object.keys(STEPS).length;
  const comp  = Math.round((completedSteps.length / total) * 100);
  const scoreColor = comp > 80 ? "#16a34a" : comp > 50 ? "#d97706" : "#dc2626";

  // Build highlights from transcript + steps
  const highlights: { icon: string | React.ReactNode; color: string; bg: string; border: string; text: string }[] = [];

  const pillIcon = (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: "rotate(-35deg)", flexShrink: 0 }}>
      <rect x="2" y="10" width="28" height="12" rx="6" fill="white" stroke="#0f766e" strokeWidth="2.2" />
      <path d="M2 16 Q2 10 8 10 L16 10 L16 22 L8 22 Q2 22 2 16 Z" fill="#0f766e" />
      <line x1="16" y1="10" x2="16" y2="22" stroke="#0f766e" strokeWidth="2" />
      <rect x="2" y="10" width="28" height="12" rx="6" fill="none" stroke="#0f766e" strokeWidth="2.2" />
    </svg>
  );

  if (completedSteps.includes("medications")) {
    highlights.push({ icon: pillIcon, color: "#065f46", bg: "#d1fae5", border: "1px solid #6ee7b7; border-left: 4px solid #0d9488", text: "Medications section completed — patient reviewed all prescriptions" });
  } else {
    highlights.push({ icon: pillIcon, color: "#065f46", bg: "#d1fae5", border: "1px solid #6ee7b7; border-left: 4px solid #0d9488", text: "Medications section not completed — follow-up recommended" });
  }

  if (completedSteps.includes("symptoms")) {
    highlights.push({ icon: "🩺", color: "var(--md-sys-color-on-primary-container)", bg: "var(--md-sys-color-primary-container)", border: "transparent", text: "Symptoms check completed — no critical concerns reported" });
  }

  flaggedWarnings.forEach((w) => {
    highlights.push({
      icon: w.severity === "urgent" ? "🚨" : "⚠️",
      color: w.severity === "urgent" ? "var(--md-sys-color-on-error-container)" : "#451a03",
      bg: w.severity === "urgent" ? "var(--md-sys-color-error-container)" : "#fef3c7",
      border: w.severity === "urgent" ? `1px solid var(--md-sys-color-error-container)` : `1px solid #fde68a`,
      text: `Concerning symptom flagged: ${w.sign}`,
    });
  });

  if (completedSteps.length === total) {
    highlights.push({ icon: "✅", color: "var(--md-sys-color-on-primary-container)", bg: "var(--md-sys-color-primary-container)", border: "transparent", text: "All workflow steps completed successfully" });
  }

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--md-sys-color-on-surface-variant)", marginBottom: 14, fontFamily: "'Roboto', sans-serif" }}>
        Session Summary
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { val: `${completedSteps.length}/${total}`, label: "Steps Done",    color: "var(--md-sys-color-primary)", delay: "0s" },
          { val: `${comp}%`,                          label: "Comprehension", color: scoreColor, delay: "0.6s" },
          { val: callDuration,                        label: "Call Duration", color: "#1a6fa0", delay: "1.2s" },
        ].map(({ val, label, color, delay }) => (
          <div key={label} className="md-card" style={{ borderRadius: 16, padding: "24px 16px", textAlign: "center", animationDelay: delay, animationDuration: "6s" }}>
            <div style={{ fontSize: 36, fontWeight: 700, fontFamily: "'Google Sans Display', sans-serif", color, lineHeight: 1, marginBottom: 8 }}>{val}</div>
            <div style={{ fontSize: 12, color: "var(--md-sys-color-on-surface-variant)", fontFamily: "'Roboto', sans-serif" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Call Highlights */}
      {highlights.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--md-sys-color-on-surface-variant)", fontFamily: "'Roboto', sans-serif", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 8 }}>Call Highlights</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {highlights.map((h, i) => (
              <div key={i} style={{ 
                display: "flex", alignItems: "center", gap: 10, 
                padding: "12px 16px", borderRadius: 10,
                background: h.bg, color: h.color, fontSize: 13, fontWeight: 500,
                border: h.border.includes("border-left") ? h.border.split(";")[0].replace("border:", "").trim() : h.border,
                borderLeft: h.border.includes("border-left") ? h.border.split(";")[1].replace("border-left:", "").trim() : (h.color === "var(--md-sys-color-on-error-container)" ? "4px solid var(--md-sys-color-error)" : "1px solid transparent"),
              }}>
                <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>{h.icon}</span>
                <span style={{ lineHeight: 1.4, fontFamily: "'Roboto', sans-serif" }}>{h.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key patient quotes */}
      {keyMoments.length > 0 && (
        <div style={{ background: "#f8faff", border: "1px solid #dde3f5", borderRadius: 8, padding: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: "#6b7a9e", fontFamily: "monospace", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 8 }}>Patient Responses</div>
          {keyMoments.map((q, i) => (
            <div key={i} style={{ fontSize: 11, color: "#1a2340", padding: "4px 0", borderBottom: "1px solid #e8eeff", fontStyle: "italic" }}>
              "{q}"
            </div>
          ))}
        </div>
      )}

      {/* Symptom mentions from transcript */}
      {symptomLines.length > 0 && (
        <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, padding: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: "#d97706", fontFamily: "monospace", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 8 }}>Symptom Mentions</div>
          {symptomLines.map((s, i) => (
            <div key={i} style={{ fontSize: 11, color: "#1a2340", padding: "3px 0" }}>⚡ {s}</div>
          ))}
        </div>
      )}

      {/* Workflow progress */}
      <div className="md-card" style={{ borderRadius: 12, padding: 16, animationDuration: "4.5s" }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: "var(--md-sys-color-on-surface-variant)", fontFamily: "'Roboto', sans-serif", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 12 }}>Workflow Progress</div>
        {Object.entries(STEPS).map(([id, label]) => {
          const done = completedSteps.includes(id);
          return (
            <div key={id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--md-sys-color-surface-container)" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, background: done ? "var(--md-sys-color-primary)" : "transparent", border: `2px solid ${done ? "var(--md-sys-color-primary)" : "var(--md-sys-color-outline-variant)"}`, color: done ? "#ffffff" : "var(--md-sys-color-outline-variant)" }}>
                {done ? "✓" : ""}
              </div>
              <div style={{ flex: 1, fontSize: 14, fontFamily: "'Google Sans', sans-serif", fontWeight: 500, color: done ? "var(--md-sys-color-on-surface)" : "var(--md-sys-color-on-surface-variant)" }}>{label}</div>
              <div style={{ fontSize: 11, fontFamily: "'Roboto', sans-serif", color: done ? "var(--md-sys-color-primary)" : "var(--md-sys-color-outline-variant)" }}>{done ? "DONE" : "—"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
