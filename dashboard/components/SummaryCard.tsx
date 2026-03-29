"use client";

const STEPS: Record<string, string> = {
  opening: "Opening", symptoms: "Symptoms Check", medications: "Medications",
  activity_restrictions: "Activity Restrictions", wound_care: "Wound Care",
  follow_ups: "Follow-Up Appointments", warning_signs: "Warning Signs",
  open_questions: "Open Questions", closing: "Closing",
};

interface Props {
  sessionData: {
    completedSteps: string[];
    flaggedWarnings: { sign: string; severity: string }[];
    transcript: string;
    callDuration: string;
  };
}

export default function SummaryCard({ sessionData }: Props) {
  const { completedSteps, flaggedWarnings, callDuration } = sessionData;
  const total = Object.keys(STEPS).length;
  const comp  = Math.round((completedSteps.length / total) * 100);
  const scoreColor = comp > 80 ? "#16a34a" : comp > 50 ? "#d97706" : "#dc2626";

  // Build highlights from transcript + steps
  const highlights: { icon: string; color: string; bg: string; border: string; text: string }[] = [];

  if (completedSteps.includes("medications")) {
    highlights.push({ icon: "💊", color: "#16a34a", bg: "#f0fdf4", border: "#86efac", text: "Medications section completed — patient reviewed all prescriptions" });
  } else {
    highlights.push({ icon: "💊", color: "#d97706", bg: "#fffbeb", border: "#fcd34d", text: "Medications section not completed — follow-up recommended" });
  }

  if (completedSteps.includes("symptoms")) {
    highlights.push({ icon: "🩺", color: "#16a34a", bg: "#f0fdf4", border: "#86efac", text: "Symptoms check completed — no critical concerns reported" });
  }

  flaggedWarnings.forEach((w) => {
    highlights.push({
      icon: w.severity === "urgent" ? "🚨" : "⚠️",
      color: w.severity === "urgent" ? "#dc2626" : "#d97706",
      bg: w.severity === "urgent" ? "#fef2f2" : "#fffbeb",
      border: w.severity === "urgent" ? "#fca5a5" : "#fcd34d",
      text: `Concerning symptom flagged: ${w.sign}`,
    });
  });

  if (completedSteps.length === total) {
    highlights.push({ icon: "✅", color: "#16a34a", bg: "#f0fdf4", border: "#86efac", text: "All workflow steps completed successfully" });
  }

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#6b7a9e", marginBottom: 14, fontFamily: "monospace" }}>
        Session Summary
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
        {[
          { val: `${completedSteps.length}/${total}`, label: "Steps Done",    color: "#16a34a" },
          { val: `${comp}%`,                          label: "Comprehension", color: scoreColor },
          { val: callDuration,                        label: "Call Duration", color: "#2563eb" },
        ].map(({ val, label, color }) => (
          <div key={label} style={{ background: "#f8faff", border: "1px solid #dde3f5", borderRadius: 8, padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "monospace", color, lineHeight: 1, marginBottom: 4 }}>{val}</div>
            <div style={{ fontSize: 9, color: "#6b7a9e", fontFamily: "monospace" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Highlights */}
      {highlights.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: "#6b7a9e", fontFamily: "monospace", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 8 }}>Call Highlights</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {highlights.map((h, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, background: h.bg, border: `1px solid ${h.border}`, borderRadius: 8, padding: "8px 10px" }}>
                <span style={{ fontSize: 13, flexShrink: 0 }}>{h.icon}</span>
                <span style={{ fontSize: 11, color: h.color, lineHeight: 1.4 }}>{h.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workflow progress */}
      <div style={{ background: "#f8faff", border: "1px solid #dde3f5", borderRadius: 8, padding: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: "#6b7a9e", fontFamily: "monospace", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 8 }}>Workflow Progress</div>
        {Object.entries(STEPS).map(([id, label]) => {
          const done = completedSteps.includes(id);
          return (
            <div key={id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid #e8eeff" }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, background: done ? "#f0fdf4" : "#f0f4ff", border: `1px solid ${done ? "#86efac" : "#dde3f5"}`, color: done ? "#16a34a" : "#c7d2e8" }}>
                {done ? "✓" : "○"}
              </div>
              <div style={{ flex: 1, fontSize: 11, color: done ? "#1a2340" : "#6b7a9e" }}>{label}</div>
              <div style={{ fontSize: 9, fontFamily: "monospace", color: done ? "#16a34a" : "#c7d2e8" }}>{done ? "DONE" : "—"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
