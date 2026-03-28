"use client";
import type { Phase, ItemState } from "@/lib/types";
import { CHECKLIST } from "@/lib/demoData";

interface Props {
  phase: Phase;
  items: Record<string, ItemState>;
  callTime: string;
  alerts: { length: number };
}

const AGENTS = [
  { id: "CareCoord",  label: "CareCoordinator",   color: "#e07b54" },
  { id: "DischargeR", label: "DischargeReader",    color: "#7c9cbf" },
  { id: "VoiceCoach", label: "VoiceCoach (ES)",    color: "#5aab8a" },
  { id: "Compr.",     label: "ComprehensionCheck", color: "#c4a35a" },
  { id: "EscalAgent", label: "EscalationAgent",    color: "#c46a6a" },
];

export default function SummaryCard({ phase, items, callTime, alerts }: Props) {
  const greenCount = Object.values(items).filter((v) => v.status === "green").length;
  const scoredCount = Object.values(items).filter((v) => v.status !== "idle").length;

  const agentStatus = (id: string) => {
    if (id === "CareCoord")  return phase === "running" ? "Orchestrating" : phase === "done" ? "Complete" : "Standby";
    if (id === "DischargeR") return phase !== "idle" ? "Parsed ✓" : "Standby";
    if (id === "VoiceCoach") return phase === "running" ? "On call" : phase === "done" ? "Complete" : "Standby";
    if (id === "Compr.")     return phase !== "idle" ? `${scoredCount} scored` : "Standby";
    if (id === "EscalAgent") return alerts.length > 0 ? `${alerts.length} alert sent` : "Monitoring";
    return "Standby";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#a08070", marginBottom: 16, fontFamily: "monospace" }}>
        Session Summary
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        {[
          { val: `${greenCount}/${CHECKLIST.length}`, label: "ITEMS GREEN",    color: "#5aab8a" },
          { val: callTime,                            label: "CALL DURATION",  color: "#e07b54" },
        ].map(({ val, label, color }) => (
          <div key={label} style={{
            background: "#fdf6f0", border: "1px solid #e8d5c4",
            borderRadius: 8, padding: 12, textAlign: "center",
          }}>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "monospace", color, lineHeight: 1, marginBottom: 4 }}>{val}</div>
            <div style={{ fontSize: 10, color: "#a08070", fontFamily: "monospace" }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fdf6f0", border: "1px solid #e8d5c4", borderRadius: 8, padding: 12, flex: 1 }}>
        {AGENTS.map((a) => (
          <div key={a.id} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "5px 0", fontSize: 12,
            borderBottom: "1px solid #f0e4d8",
          }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
            <div style={{ flex: 1, fontFamily: "monospace", fontSize: 11, color: "#7a6050" }}>{a.label}</div>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: a.color }}>{agentStatus(a.id)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
