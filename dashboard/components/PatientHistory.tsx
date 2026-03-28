"use client";
import { useState } from "react";
import { PATIENT_PRESCRIPTIONS, PATIENT_VISITS, PATIENT_CALL_HISTORY } from "@/lib/demoData";

type Tab = "prescriptions" | "visits" | "calls";

const ACCENT = "#2563eb";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "prescriptions", label: "Rx",      icon: "💊" },
  { id: "visits",        label: "Visits",  icon: "🏥" },
  { id: "calls",         label: "Calls",   icon: "📞" },
];

const STATUS_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  active:       { color: "#16a34a", bg: "#f0fdf4", border: "#86efac" },
  new:          { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  discontinued: { color: "#6b7a9e", bg: "#f8faff", border: "#dde3f5" },
  completed:    { color: "#16a34a", bg: "#f0fdf4", border: "#86efac" },
  "no-answer":  { color: "#d97706", bg: "#fffbeb", border: "#fcd34d" },
};

export default function PatientHistory() {
  const [tab, setTab] = useState<Tab>("prescriptions");
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#6b7a9e", marginBottom: 12, fontFamily: "monospace" }}>
        Patient Records
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14, flexShrink: 0 }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "6px 4px", border: "1px solid",
            borderColor: tab === t.id ? ACCENT : "#dde3f5",
            borderRadius: 8, cursor: "pointer", fontSize: 10, fontWeight: 600,
            background: tab === t.id ? "#eff6ff" : "#f8faff",
            color: tab === t.id ? ACCENT : "#6b7a9e",
            transition: "all 0.15s ease", fontFamily: "inherit",
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>

        {/* Prescriptions */}
        {tab === "prescriptions" && PATIENT_PRESCRIPTIONS.map((rx, i) => {
          const s = STATUS_STYLE[rx.status] ?? STATUS_STYLE.active;
          return (
            <div key={i} style={{ background: "#f8faff", border: "1px solid #dde3f5", borderRadius: 10, padding: "10px 12px", borderLeft: `3px solid ${s.color}` }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1a2340" }}>{rx.name}</div>
                  <div style={{ fontSize: 10, color: "#6b7a9e", marginTop: 2 }}>{rx.purpose}</div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, fontFamily: "monospace", padding: "2px 7px", borderRadius: 20, color: s.color, background: s.bg, border: `1px solid ${s.border}`, flexShrink: 0, textTransform: "uppercase" as const }}>
                  {rx.status}
                </span>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                <span style={{ fontSize: 9, color: "#6b7a9e", fontFamily: "monospace" }}>By {rx.by}</span>
                <span style={{ fontSize: 9, color: "#6b7a9e", fontFamily: "monospace" }}>{rx.prescribed}</span>
                {rx.refills > 0 && <span style={{ fontSize: 9, color: ACCENT, fontFamily: "monospace" }}>{rx.refills} refills</span>}
              </div>
            </div>
          );
        })}

        {/* Visits */}
        {tab === "visits" && PATIENT_VISITS.map((v, i) => (
          <div key={i} style={{ background: "#f8faff", border: "1px solid #dde3f5", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{ fontSize: 9, fontWeight: 700, fontFamily: "monospace", padding: "2px 7px", borderRadius: 20, color: ACCENT, background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                {v.type}
              </div>
              <span style={{ fontSize: 9, color: "#6b7a9e", fontFamily: "monospace", marginLeft: "auto" }}>{v.date}</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#1a2340" }}>{v.provider}</div>
            <div style={{ fontSize: 10, color: "#6b7a9e", marginTop: 1 }}>{v.dept}</div>
            <div style={{ fontSize: 10, color: "#374151", marginTop: 5, lineHeight: 1.4, fontStyle: "italic" }}>{v.note}</div>
          </div>
        ))}

        {/* Call History */}
        {tab === "calls" && PATIENT_CALL_HISTORY.map((c, i) => {
          const s = STATUS_STYLE[c.status] ?? STATUS_STYLE.completed;
          const isOpen = expanded === i;
          const ringColor = c.comprehension > 80 ? "#16a34a" : c.comprehension > 50 ? "#d97706" : c.comprehension === 0 ? "#c7d2e8" : "#dc2626";
          return (
            <div key={i} style={{ background: "#f8faff", border: "1px solid #dde3f5", borderRadius: 10, overflow: "hidden" }}>
              <button onClick={() => setExpanded(isOpen ? null : i)} style={{
                width: "100%", padding: "10px 12px", background: "none",
                border: "none", cursor: "pointer", textAlign: "left",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{ position: "relative", width: 32, height: 32, flexShrink: 0 }}>
                  <svg width="32" height="32" viewBox="0 0 32 32">
                    <circle cx="16" cy="16" r="12" fill="none" stroke="#dde3f5" strokeWidth="2.5" />
                    {c.comprehension > 0 && (
                      <circle cx="16" cy="16" r="12" fill="none"
                        stroke={ringColor} strokeWidth="2.5" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 12 * (c.comprehension / 100)} ${2 * Math.PI * 12}`}
                        style={{ transform: "rotate(-90deg)", transformOrigin: "16px 16px" }}
                      />
                    )}
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, fontFamily: "monospace", color: ringColor }}>
                    {c.comprehension > 0 ? `${c.comprehension}%` : "—"}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#1a2340" }}>{c.type}</span>
                    <span style={{ fontSize: 8, fontWeight: 700, fontFamily: "monospace", padding: "1px 6px", borderRadius: 20, color: s.color, background: s.bg, border: `1px solid ${s.border}`, textTransform: "uppercase" as const }}>
                      {c.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 9, color: "#6b7a9e", fontFamily: "monospace", marginTop: 2 }}>
                    {c.date} · {c.time} · {c.duration} · {c.language}
                  </div>
                </div>
                <span style={{ fontSize: 10, color: "#c7d2e8" }}>{isOpen ? "▲" : "▼"}</span>
              </button>

              {isOpen && (
                <div style={{ padding: "0 12px 12px", borderTop: "1px solid #e8eeff" }}>
                  <div style={{ fontSize: 10, color: "#374151", lineHeight: 1.5, marginTop: 8, fontStyle: "italic" }}>{c.summary}</div>
                  {c.flags.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                      {c.flags.map((f, fi) => (
                        <div key={fi} style={{ fontSize: 9, fontFamily: "monospace", color: "#dc2626", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6, padding: "3px 8px" }}>
                          ⚡ {f}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize: 9, color: "#6b7a9e", fontFamily: "monospace", marginTop: 8 }}>
                    via {c.agent} · <span style={{ color: ACCENT, cursor: "pointer" }}>View full transcript →</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 10, padding: "6px 10px", borderRadius: 8, background: "#eff6ff", border: "1px solid #bfdbfe", fontSize: 9, color: "#6b7a9e", fontFamily: "monospace", flexShrink: 0, textAlign: "center" as const }}>
        Demo data · Live: Google ADK + ElevenLabs API
      </div>
    </div>
  );
}
