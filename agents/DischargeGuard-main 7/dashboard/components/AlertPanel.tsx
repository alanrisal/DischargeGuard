"use client";
import type { Alert, Phase } from "@/lib/types";

const ACCENT = "#2563eb";

interface Props { alerts: Alert[]; phase: Phase; onReset: () => void; }

export default function AlertPanel({ alerts, phase, onReset }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9ca3af", marginBottom: 8, fontFamily: "'Roboto', sans-serif" }}>
        Care Team Alerts
      </div>

      {alerts.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 10, fontFamily: "'Roboto', sans-serif" }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          <span style={{ fontSize: 13, color: "#9ca3af" }}>No alerts triggered</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, overflowY: "auto" }}>
          {alerts.map((a) => (
            <div key={a.id} style={{
              background: "#fff7ed", border: "1px solid #fed7aa", borderLeft: "3px solid #f59e0b",
              borderRadius: 10, padding: "12px 14px",
              fontSize: 13, color: "#92400e", fontFamily: "'Roboto', sans-serif"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 16 }}>{a.icon}</span>
                <span style={{ fontWeight: 700 }}>
                  {a.title}
                </span>
                <span style={{ marginLeft: "auto", fontSize: 11, opacity: 0.8 }}>{a.time}</span>
              </div>
              <div style={{ marginBottom: 8, lineHeight: 1.5 }}>{a.body}</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>→ {a.action}</div>
            </div>
          ))}
        </div>
      )}

      {phase === "done" && (
        <button onClick={onReset} className="reset-demo-btn" style={{
          marginTop: "auto", width: "100%", height: 44, borderRadius: 999,
          background: "#0d9488", color: "#ffffff",
          fontSize: 14, fontWeight: 700, border: "none",
          boxShadow: "0 4px 12px rgba(13,148,136,0.30)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          cursor: "pointer", transition: "all 0.2s ease", fontFamily: "'Google Sans', sans-serif"
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          Reset Demo
        </button>
      )}

      <style>{`
        .reset-demo-btn:hover {
          background: #0f766e !important;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
