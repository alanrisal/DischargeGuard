"use client";
import type { PatientVoiceData } from "@/lib/scenarioData";

// SVG med type icons — stroke-based, no emojis
function PillIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M10.5 20H4a2 2 0 01-2-2V6a2 2 0 012-2h16a2 2 0 012 2v7" />
      <circle cx="17" cy="17" r="5" />
      <path d="M17 14v6M14 17h6" />
    </svg>
  );
}

function DropIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
    </svg>
  );
}

function PatchIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M9 12h6M12 9v6" />
    </svg>
  );
}

function getMedIconComponent(name: string, purpose: string, color: string) {
  const lower = (name + " " + purpose).toLowerCase();
  if (lower.includes("liquid") || lower.includes("syrup") || lower.includes("drop")) return <DropIcon color={color} />;
  if (lower.includes("patch")) return <PatchIcon color={color} />;
  return <PillIcon color={color} />;
}

// Infer which meds have been confirmed from completed workflow steps + transcript
function inferConfirmedMeds(
  medNames: string[],
  completedSteps: string[],
  transcript: { role: string; text: string }[]
): Set<string> {
  const confirmed = new Set<string>();

  // If the full medications step is done, all meds are confirmed
  if (completedSteps.includes("medications")) {
    medNames.forEach((n) => confirmed.add(n));
    return confirmed;
  }

  // Otherwise check transcript for per-med confirmation
  const CONFIRM_KW = ["yes", "understand", "got it", "okay", "i will", "i'll", "confirmed", "sure", "will do", "i know"];
  const patientLines = transcript
    .filter((e) => e.role === "user")
    .map((e) => e.text.toLowerCase());

  medNames.forEach((name) => {
    const nameLower = name.toLowerCase().split(" ")[0]; // e.g. "metformin"
    // Find agent lines that mention this med, then check if next patient line confirms
    const agentMentions = transcript
      .map((e, i) => ({ ...e, i }))
      .filter((e) => e.role === "agent" && e.text.toLowerCase().includes(nameLower));

    for (const mention of agentMentions) {
      const nextPatient = transcript.slice(mention.i + 1).find((e) => e.role === "user");
      if (nextPatient && CONFIRM_KW.some((k) => nextPatient.text.toLowerCase().includes(k))) {
        confirmed.add(name);
        break;
      }
    }

    // Also check if patient mentioned the med name themselves positively
    if (patientLines.some((l) => l.includes(nameLower) && CONFIRM_KW.some((k) => l.includes(k)))) {
      confirmed.add(name);
    }
  });

  return confirmed;
}

interface Props {
  voiceData: PatientVoiceData;
  completedSteps: string[];
  transcript: { role: string; text: string }[];
}

export default function MedChecklist({ voiceData, completedSteps, transcript }: Props) {
  const meds = voiceData?.medications ?? [];
  const confirmedMeds = inferConfirmedMeds(meds.map((m) => m.name), completedSteps, transcript);
  const confirmedCount = confirmedMeds.size;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 12 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", color: "var(--text-tertiary)",
        }}>
          Discharge Medications
        </span>
        <div style={{
          background: confirmedCount === meds.length && meds.length > 0
            ? "var(--clinical-blue-light)"
            : "rgba(212, 129, 58, 0.1)",
          border: `1px solid ${confirmedCount === meds.length && meds.length > 0 ? "var(--clinical-blue)" : "var(--warning-amber)"}`,
          borderRadius: 999, padding: "3px 10px",
          fontSize: 10, fontWeight: 700,
          color: confirmedCount === meds.length && meds.length > 0 ? "var(--clinical-blue)" : "var(--warning-amber)",
        }}>
          {confirmedCount}/{meds.length} confirmed
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        background: "var(--surface-inset)",
        boxShadow: "inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light)",
        borderRadius: 999, height: 6, overflow: "hidden", flexShrink: 0,
      }}>
        <div style={{
          height: "100%", borderRadius: 999,
          width: meds.length > 0 ? `${(confirmedCount / meds.length) * 100}%` : "0%",
          background: "var(--clinical-blue)",
          transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
        }} />
      </div>

      {/* Med list */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        {meds.length === 0 ? (
          <div style={{
            background: "var(--surface-inset)",
            borderRadius: 12, padding: "20px",
            textAlign: "center", fontSize: 13,
            color: "var(--text-tertiary)", fontStyle: "italic",
          }}>
            No medications on record
          </div>
        ) : (
          meds.map((med, i) => {
            const isConfirmed = confirmedMeds.has(med.name);

            return (
              <div
                key={i}
                style={{
                  background: isConfirmed ? "rgba(0, 94, 184, 0.05)" : "var(--surface-inset)",
                  boxShadow: isConfirmed
                    ? "none"
                    : "inset 3px 3px 7px var(--shadow-dark), inset -3px -3px 7px var(--shadow-light)",
                  borderRadius: 12,
                  padding: "12px 14px",
                  borderLeft: `3px solid ${isConfirmed ? "var(--clinical-blue)" : "var(--warning-amber)"}`,
                  opacity: isConfirmed ? 0.65 : 1,
                  transition: "all 0.4s ease",
                  position: "relative",
                }}
              >
                {/* Confirmed badge */}
                {isConfirmed && (
                  <div style={{
                    position: "absolute", top: 10, right: 12,
                    fontSize: 10, fontWeight: 700,
                    color: "var(--clinical-blue)",
                    background: "var(--clinical-blue-light)",
                    borderRadius: 999, padding: "2px 8px",
                    letterSpacing: "0.06em",
                  }}>
                    CONFIRMED
                  </div>
                )}

                {/* Name row */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, paddingRight: isConfirmed ? 88 : 0 }}>
                  <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
                    {getMedIconComponent(med.name, med.purpose ?? "", isConfirmed ? "var(--text-tertiary)" : "var(--clinical-blue)")}
                  </span>
                  <span style={{
                    fontSize: 16, fontWeight: 700,
                    color: isConfirmed ? "var(--text-tertiary)" : "var(--text-primary)",
                    textDecoration: isConfirmed ? "line-through" : "none",
                    textDecorationColor: "var(--clinical-blue)",
                    transition: "all 0.3s ease",
                  }}>
                    {med.name}
                  </span>
                  <span style={{
                    fontSize: 13, fontWeight: 500,
                    color: isConfirmed ? "var(--text-tertiary)" : "var(--clinical-blue)",
                    flexShrink: 0,
                  }}>
                    {med.dose}
                  </span>
                </div>

                {/* Frequency pill */}
                <div style={{
                  display: "inline-flex", alignItems: "center",
                  background: isConfirmed ? "transparent" : "var(--surface-raised)",
                  boxShadow: isConfirmed ? "none" : "2px 2px 4px var(--shadow-dark), -2px -2px 4px var(--shadow-light)",
                  borderRadius: 999, padding: "2px 10px",
                  fontSize: 11, fontWeight: 600,
                  color: isConfirmed ? "var(--text-tertiary)" : "var(--text-secondary)",
                  marginBottom: 6, minHeight: 24,
                }}>
                  {med.frequency}
                </div>

                {/* Purpose */}
                <div style={{ fontSize: 12, color: "var(--text-tertiary)", fontWeight: 300, lineHeight: 1.4 }}>
                  {med.purpose}
                </div>

                {/* Special instructions — alert style when unconfirmed */}
                {med.special_instructions && !isConfirmed && (
                  <div style={{
                    marginTop: 6,
                    background: "var(--alert-red-light)",
                    border: "1px solid rgba(212, 53, 28, 0.2)",
                    borderRadius: 8, padding: "6px 10px",
                    display: "flex", alignItems: "flex-start", gap: 6,
                    fontSize: 11, color: "var(--alert-red)", fontWeight: 500,
                    lineHeight: 1.4, minHeight: 44,
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span>{med.special_instructions}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
