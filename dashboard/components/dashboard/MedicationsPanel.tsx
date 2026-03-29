"use client";
import type { PatientVoiceData } from "@/lib/scenarioData";

interface Props {
  voiceData: PatientVoiceData;
}

const MED_COLORS = [
  "var(--accent-clinical)",
  "var(--accent-warm)",
  "var(--accent-success)",
  "#7B68C8",
  "var(--warning-amber)",
];

export default function MedicationsPanel({ voiceData }: Props) {
  const meds = voiceData?.medications ?? [];

  return (
    <section style={{
      background: "var(--surface-raised)",
      boxShadow: "6px 6px 14px var(--shadow-dark), -6px -6px 14px var(--shadow-light)",
      borderRadius: 16,
      padding: "20px 24px",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: 16,
      }}>
        <h2 style={{
          fontFamily: "var(--font-display)", fontStyle: "italic",
          fontWeight: 300, fontSize: 15, color: "var(--text-primary)", margin: 0,
        }}>
          Prescriptions
        </h2>
        <div style={{
          background: "var(--surface-inset)",
          boxShadow: "inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light)",
          borderRadius: 999, padding: "3px 10px",
          fontSize: 10, fontWeight: 600, letterSpacing: "0.06em",
          color: "var(--accent-clinical)",
        }}>
          {meds.length} ACTIVE
        </div>
      </div>

      {/* Medication cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
        {meds.length === 0 ? (
          <div style={{
            background: "var(--surface-inset)",
            boxShadow: "inset 3px 3px 7px var(--shadow-dark), inset -3px -3px 7px var(--shadow-light)",
            borderRadius: 12, padding: "20px",
            textAlign: "center", fontSize: 12,
            color: "var(--text-tertiary)", fontStyle: "italic",
          }}>
            No medications on record
          </div>
        ) : (
          meds.map((med, i) => {
            const accentColor = MED_COLORS[i % MED_COLORS.length];
            return (
              <div key={i} style={{
                background: "var(--surface-inset)",
                boxShadow: "inset 3px 3px 7px var(--shadow-dark), inset -3px -3px 7px var(--shadow-light)",
                borderRadius: 12,
                padding: "11px 14px",
                borderLeft: `3px solid ${accentColor}`,
              }}>
                {/* Name + dose row */}
                <div style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between", gap: 8, marginBottom: 4,
                }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, flex: 1, minWidth: 0 }}>
                    <span style={{
                      fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12,
                      color: "var(--text-primary)", whiteSpace: "nowrap",
                    }}>
                      {med.name}
                    </span>
                    <span style={{
                      fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 11,
                      color: accentColor, flexShrink: 0,
                    }}>
                      {med.dose}
                    </span>
                  </div>
                  {/* Frequency pill */}
                  <div style={{
                    background: "var(--surface-raised)",
                    boxShadow: "2px 2px 4px var(--shadow-dark), -2px -2px 4px var(--shadow-light)",
                    borderRadius: 999, padding: "2px 8px",
                    fontSize: 9, fontWeight: 600,
                    letterSpacing: "0.05em", textTransform: "uppercase" as const,
                    color: "var(--text-secondary)",
                    flexShrink: 0,
                  }}>
                    {med.frequency}
                  </div>
                </div>

                {/* Purpose */}
                <div style={{
                  fontSize: 11, color: "var(--text-tertiary)",
                  fontWeight: 300, lineHeight: 1.35,
                }}>
                  {med.purpose}
                </div>

                {/* Special instructions */}
                {med.special_instructions && (
                  <div style={{
                    marginTop: 5, display: "flex", alignItems: "flex-start", gap: 4,
                    fontSize: 10, color: "var(--warning-amber)", fontWeight: 500,
                    lineHeight: 1.3,
                  }}>
                    <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>
                    <span>{med.special_instructions}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
