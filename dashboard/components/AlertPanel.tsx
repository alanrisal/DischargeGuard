"use client";
import type { Alert, Phase } from "@/lib/types";

interface Props {
  alerts: Alert[];
  phase: Phase;
  onReset: () => void;
}

export default function AlertPanel({ alerts, phase, onReset }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#a08070", marginBottom: 16, fontFamily: "monospace" }}>
        Care Team Alerts
      </div>

      {alerts.length === 0 ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", flex: 1, color: "#c4a88a",
          fontSize: 12, gap: 8, fontFamily: "monospace",
        }}>
          <span style={{ fontSize: 24, opacity: 0.3 }}>🔔</span>
          <span>No alerts triggered</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, overflowY: "auto" }}>
          {alerts.map((a) => (
            <div key={a.id} style={{
              background: "#fdf6f0",
              border: `1px solid ${a.level === "urgent" ? "#c46a6a" : "#c4a35a"}`,
              borderRadius: 10, padding: 14, position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background: a.level === "urgent"
                  ? "linear-gradient(135deg, #c46a6a08 0%, transparent 60%)"
                  : "linear-gradient(135deg, #c4a35a08 0%, transparent 60%)",
              }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>{a.icon}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, fontFamily: "monospace",
                  color: a.level === "urgent" ? "#c46a6a" : "#c4a35a",
                  letterSpacing: 1,
                }}>
                  {a.title}
                </span>
                <span style={{ marginLeft: "auto", fontSize: 10, fontFamily: "monospace", color: "#a08070" }}>
                  {a.time}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#3a2a1e", marginBottom: 8, lineHeight: 1.5 }}>{a.body}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#5aab8a", fontFamily: "monospace" }}>
                → {a.action}
              </div>
            </div>
          ))}
        </div>
      )}

      {phase === "done" && (
        <div style={{ marginTop: 12, flexShrink: 0 }}>
          <button onClick={onReset} style={{
            padding: "8px 20px",
            background: "linear-gradient(135deg, #e07b54, #c4a35a)",
            color: "white", fontFamily: "inherit", fontSize: 12, fontWeight: 600,
            border: "none", borderRadius: 10, cursor: "pointer",
          }}>
            ↺ Reset Demo
          </button>
        </div>
      )}
    </div>
  );
}
