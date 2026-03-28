"use client";
import type { Phase, ItemState } from "@/lib/types";
import { CHECKLIST } from "@/lib/demoData";
import Link from "next/link";

const AGENTS = [
  { id: "CareCoord",  label: "CareCoord",   color: "#e07b54" },
  { id: "DischargeR", label: "Discharge",   color: "#7c9cbf" },
  { id: "VoiceCoach", label: "VoiceCoach",  color: "#5aab8a" },
  { id: "Compr.",     label: "Compreh.",    color: "#c4a35a" },
  { id: "EscalAgent", label: "Escalation",  color: "#c46a6a" },
];

interface Props {
  phase: Phase;
  items: Record<string, ItemState>;
  callTime: string;
  alerts: { length: number };
}

export default function SideRail({ phase, items, callTime, alerts }: Props) {
  const greenCount = Object.values(items).filter((v) => v.status === "green").length;
  const scoredCount = Object.values(items).filter((v) => v.status !== "idle").length;

  const agentStatus = (id: string) => {
    if (id === "CareCoord")  return phase === "running" ? "active" : phase === "done" ? "done" : "idle";
    if (id === "DischargeR") return phase !== "idle" ? "done" : "idle";
    if (id === "VoiceCoach") return phase === "running" ? "active" : phase === "done" ? "done" : "idle";
    if (id === "Compr.")     return phase !== "idle" ? "active" : "idle";
    if (id === "EscalAgent") return alerts.length > 0 ? "alert" : "idle";
    return "idle";
  };

  const dotAnim = (status: string) =>
    status === "active" ? "pulse 1.2s ease-in-out infinite" : "none";

  return (
    <div style={{
      width: 64,
      background: "#fff8f3",
      borderRight: "1px solid #e8d5c4",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "16px 0",
      gap: 0,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        width: 36, height: 36,
        background: "linear-gradient(135deg, #e07b54, #c4a35a)",
        borderRadius: 10,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, marginBottom: 20,
        boxShadow: "0 2px 8px rgba(224,123,84,0.2)",
      }}>🏥</div>

      <div style={{ width: 32, height: 1, background: "#e8d5c4", marginBottom: 20 }} />

      {/* Call timer */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{
          fontSize: 13, fontWeight: 700, fontFamily: "monospace",
          color: phase === "running" ? "#5aab8a" : "#c4a88a",
          lineHeight: 1,
        }}>
          {callTime}
        </div>
        <div style={{ fontSize: 9, color: "#c4a88a", fontFamily: "monospace", marginTop: 3, letterSpacing: "0.5px" }}>
          {phase === "running" ? "LIVE" : phase === "done" ? "DONE" : "IDLE"}
        </div>
      </div>

      {/* Score */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: "#5aab8a", lineHeight: 1 }}>
          {greenCount}/{CHECKLIST.length}
        </div>
        <div style={{ fontSize: 9, color: "#c4a88a", fontFamily: "monospace", marginTop: 3, letterSpacing: "0.5px" }}>GREEN</div>
      </div>

      {/* Alerts badge */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{
          fontSize: 16, fontWeight: 700, fontFamily: "monospace",
          color: alerts.length > 0 ? "#c46a6a" : "#c4a88a", lineHeight: 1,
        }}>
          {alerts.length}
        </div>
        <div style={{ fontSize: 9, color: "#c4a88a", fontFamily: "monospace", marginTop: 3, letterSpacing: "0.5px" }}>ALERTS</div>
      </div>

      <div style={{ width: 32, height: 1, background: "#e8d5c4", marginBottom: 20 }} />

      {/* Agent dots */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
        {AGENTS.map((a) => {
          const st = agentStatus(a.id);
          return (
            <div key={a.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: st === "idle" ? "#e8d5c4" : a.color,
                boxShadow: st === "active" ? `0 0 0 3px ${a.color}30` : "none",
                animation: dotAnim(st),
                transition: "background 0.3s ease",
              }} />
              <div style={{ fontSize: 8, color: "#c4a88a", fontFamily: "monospace", letterSpacing: "0.3px" }}>
                {a.label.slice(0, 5)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Spacer + back link */}
      <div style={{ flex: 1 }} />
      <Link href="/" style={{
        fontSize: 16, color: "#c4a88a", textDecoration: "none",
        padding: "8px 0", lineHeight: 1,
      }} title="Back to patients">
        ←
      </Link>
    </div>
  );
}
