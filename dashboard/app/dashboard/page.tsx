"use client";
import { useCallStream } from "@/lib/useCallStream";
import CallPanel from "@/components/CallPanel";
import ChecklistPanel from "@/components/ChecklistPanel";
import AgentGraph from "@/components/AgentGraph";
import AlertPanel from "@/components/AlertPanel";
import PatientHistory from "@/components/PatientHistory";
import Link from "next/link";
import { CHECKLIST } from "@/lib/demoData";

// ── Blue palette ──────────────────────────────────────────────
const B = {
  accent:   "#2563eb",
  accentBg: "#eff6ff",
  accentBd: "#bfdbfe",
  surface:  "#f8faff",
  surfaceD: "#f0f4ff",
  border:   "#dde3f5",
  text:     "#1a2340",
  muted:    "#6b7a9e",
  green:    "#16a34a",
  red:      "#dc2626",
};

export default function DashboardPage() {
  const {
    phase, items, subtitle, alerts, a2aMsgs, particles,
    callTime, comprehension,
    startDemo, resetDemo,
  } = useCallStream();

  const greenCount = Object.values(items).filter((v) => v.status === "green").length;
  const redCount   = Object.values(items).filter((v) => v.status === "red").length;

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: B.surface, color: B.text,
      fontFamily: "'Outfit', system-ui, sans-serif", overflow: "hidden",
    }}>

      {/* ── Top header bar ── */}
      <div style={{
        background: "#fff", borderBottom: `1px solid ${B.border}`,
        padding: "10px 20px", display: "flex", alignItems: "center",
        gap: 16, flexShrink: 0,
        boxShadow: "0 1px 4px rgba(37,99,235,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/logo.png" alt="DischargeGuard" style={{ width: 32, height: 32, objectFit: "contain" }} />
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.3px", color: B.text }}>
            Discharge<span style={{ color: B.accent }}>Guard</span>
          </span>
        </div>

        <div style={{ width: 1, height: 28, background: B.border }} />

        {/* Patient info */}
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: B.text }}>Maria Garcia</div>
          <div style={{ display: "flex", gap: 5, marginTop: 3, flexWrap: "wrap" }}>
            {["MRN 847291", "Post-cholecystectomy", "DOB 03/15/1955"].map((t) => (
              <span key={t} style={{
                background: B.surfaceD, border: `1px solid ${B.border}`,
                borderRadius: 20, padding: "1px 8px", fontSize: 9, color: B.muted, fontFamily: "monospace",
              }}>{t}</span>
            ))}
            <span style={{
              background: "#dcfce7", border: "1px solid #86efac",
              borderRadius: 20, padding: "1px 8px", fontSize: 9, color: "#15803d", fontFamily: "monospace",
            }}>ES · Spanish</span>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Key metrics */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {[
            { val: callTime,                             label: "Call Time",    color: phase === "running" ? B.accent : B.muted },
            { val: `${greenCount}/${CHECKLIST.length}`,  label: "Understood",   color: B.green },
            { val: redCount,                             label: "Needs Review", color: redCount > 0 ? B.red : B.muted },
            { val: alerts.length,                        label: "Alerts",       color: alerts.length > 0 ? B.red : B.muted },
          ].map(({ val, label, color }) => (
            <div key={label} style={{
              background: B.surfaceD, border: `1px solid ${B.border}`,
              borderRadius: 9, padding: "5px 12px", textAlign: "center", minWidth: 58,
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color, lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: 8, color: B.muted, marginTop: 2, fontFamily: "monospace", letterSpacing: "0.3px" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Status + back */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {phase === "running" && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 600, color: B.green, fontFamily: "monospace" }}>
              <div style={{ width: 6, height: 6, background: B.green, borderRadius: "50%", animation: "pulse 1.2s ease-in-out infinite" }} />
              LIVE
            </div>
          )}
          {phase === "done"  && <div style={{ fontSize: 10, fontWeight: 600, color: B.green, fontFamily: "monospace" }}>✓ COMPLETE</div>}
          {phase === "idle"  && <div style={{ fontSize: 10, color: B.muted, fontFamily: "monospace" }}>● STANDBY</div>}
          <Link href="/" style={{
            fontSize: 10, padding: "4px 10px", borderRadius: 7,
            background: B.surfaceD, border: `1px solid ${B.border}`,
            color: B.muted, textDecoration: "none",
          }}>← Back</Link>
        </div>
      </div>

      {/* ── Body: 3 columns ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* LEFT: Patient history */}
        <div style={{
          width: 280, flexShrink: 0,
          borderRight: `1px solid ${B.border}`,
          padding: 16, overflow: "hidden",
          display: "flex", flexDirection: "column",
          background: "#fff",
        }}>
          <PatientHistory />
        </div>

        {/* CENTER: Live call + checklist */}
        <div style={{
          flex: 1, overflowY: "auto", padding: 20,
          display: "flex", flexDirection: "column", gap: 18,
          borderRight: `1px solid ${B.border}`,
        }}>
          <CallPanel phase={phase} subtitle={subtitle} onStart={startDemo} />
          <div style={{ height: 1, background: B.border, flexShrink: 0 }} />
          <ChecklistPanel items={items} comprehension={comprehension} />
        </div>

        {/* RIGHT: Agent graph + alerts */}
        <div style={{
          width: 300, flexShrink: 0,
          display: "flex", flexDirection: "column", overflow: "hidden",
          background: "#fff",
        }}>
          <div style={{ flex: 1, borderBottom: `1px solid ${B.border}`, padding: 16, overflow: "hidden" }}>
            <AgentGraph particles={particles} a2aMsgs={a2aMsgs} />
          </div>
          <div style={{ flex: 1, padding: 16, overflow: "hidden" }}>
            <AlertPanel alerts={alerts} phase={phase} onReset={resetDemo} />
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
      `}</style>
    </div>
  );
}
