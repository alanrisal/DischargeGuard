"use client";
import type { Alert, Phase } from "@/lib/types";

const ACCENT = "#2563eb";

interface Props { alerts: Alert[]; phase: Phase; onReset: () => void; }

export default function AlertPanel({ alerts, phase, onReset }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#6b7a9e", marginBottom: 16, fontFamily: "monospace" }}>
        Care Team Alerts
      </div>

      {alerts.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, color: "#c7d2e8", fontSize: 12, gap: 8, fontFamily: "monospace" }}>
          <span style={{ fontSize: 24, opacity: 0.4 }}>🔔</span>
          <span>No alerts triggered</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, overflowY: "auto" }}>
          {alerts.map((a) => (
            <div key={a.id} style={{
              background: a.level === "urgent" ? "#fef2f2" : "#fffbeb",
              border: `1px solid ${a.level === "urgent" ? "#fca5a5" : "#fcd34d"}`,
              borderRadius: 10, padding: 14,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>{a.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "monospace", color: a.level === "urgent" ? "#dc2626" : "#d97706", letterSpacing: 1 }}>
                  {a.title}
                </span>
                <span style={{ marginLeft: "auto", fontSize: 10, fontFamily: "monospace", color: "#6b7a9e" }}>{a.time}</span>
              </div>
              <div style={{ fontSize: 12, color: "#1a2340", marginBottom: 8, lineHeight: 1.5 }}>{a.body}</div>
              <div style={{ fontSize: 11, color: "#16a34a", fontFamily: "monospace" }}>→ {a.action}</div>
            </div>
          ))}
        </div>
      )}

      {phase === "done" && (
        <div style={{ marginTop: 12, flexShrink: 0 }}>
          <button onClick={onReset} style={{
            padding: "8px 20px",
            background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)`,
            color: "white", fontFamily: "inherit", fontSize: 12, fontWeight: 600,
            border: "none", borderRadius: 10, cursor: "pointer",
            boxShadow: `0 2px 8px ${ACCENT}40`,
          }}>
            ↺ Reset Demo
          </button>
        </div>
      )}
    </div>
  );
}
