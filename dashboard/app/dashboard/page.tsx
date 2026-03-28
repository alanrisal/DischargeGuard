"use client";
import { useCallStream } from "@/lib/useCallStream";
import CallPanel from "@/components/CallPanel";
import ChecklistPanel from "@/components/ChecklistPanel";
import AgentGraph from "@/components/AgentGraph";
import AlertPanel from "@/components/AlertPanel";
import SummaryCard from "@/components/SummaryCard";
import Link from "next/link";

export default function DashboardPage() {
  const {
    phase, items, subtitle, alerts, a2aMsgs, particles,
    callTime, comprehension,
    startDemo, resetDemo,
  } = useCallStream();

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "#fffaf7",
      color: "#3a2a1e",
      fontFamily: "'Outfit', system-ui, sans-serif",
    }}>
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 24px",
        borderBottom: "1px solid #e8d5c4",
        background: "#fff8f3",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 20, fontWeight: 700 }}>
          <div style={{
            width: 32, height: 32,
            background: "linear-gradient(135deg, #e07b54, #c4a35a)",
            borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
          }}>
            {"🏥"}
          </div>
          {"Discharge"}
          <span style={{ color: "#e07b54" }}>{"Guard"}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: "#3a2a1e" }}>{"Maria Garcia"}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <span style={{ background: "#f5ede6", border: "1px solid #e8d5c4", borderRadius: 20, padding: "3px 10px", fontSize: 11, color: "#a08070", fontFamily: "monospace" }}>{"MRN 847291"}</span>
              <span style={{ background: "#f5ede6", border: "1px solid #e8d5c4", borderRadius: 20, padding: "3px 10px", fontSize: 11, color: "#a08070", fontFamily: "monospace" }}>{"Post-cholecystectomy"}</span>
              <span style={{ background: "#5aab8a18", border: "1px solid #5aab8a40", borderRadius: 20, padding: "3px 10px", fontSize: 11, color: "#5aab8a", fontFamily: "monospace" }}>{"ES"}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {phase === "running" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#5aab8a", fontFamily: "monospace" }}>
              <div style={{ width: 8, height: 8, background: "#5aab8a", borderRadius: "50%", animation: "pulse 1.2s ease-in-out infinite" }} />
              {"CALL LIVE · "}{callTime}
            </div>
          )}
          {phase === "done" && (
            <div style={{ fontSize: 12, fontWeight: 600, color: "#5aab8a", fontFamily: "monospace" }}>{"✓ CALL COMPLETE · 1:05"}</div>
          )}
          {phase === "idle" && (
            <div style={{ fontSize: 12, color: "#c4a88a", fontFamily: "monospace" }}>{"● STANDBY"}</div>
          )}
          <Link href="/" style={{ fontSize: 12, padding: "6px 14px", borderRadius: 8, background: "#f5ede6", border: "1px solid #e8d5c4", color: "#7a6050", textDecoration: "none" }}>
            {"← Back"}
          </Link>
        </div>
      </header>

      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "1fr 1fr 320px",
        gridTemplateRows: "1fr 1fr",
        height: "calc(100vh - 62px)",
      }}>
        <div style={{ borderRight: "1px solid #e8d5c4", borderBottom: "1px solid #e8d5c4", padding: 20, overflow: "hidden", position: "relative" }}>
          <CallPanel phase={phase} subtitle={subtitle} items={items} alerts={alerts} callTime={callTime} onStart={startDemo} />
        </div>

        <div style={{ gridColumn: 2, gridRow: "1 / 3", borderRight: "1px solid #e8d5c4", padding: 20, overflow: "hidden" }}>
          <ChecklistPanel items={items} comprehension={comprehension} />
        </div>

        <div style={{ gridColumn: 3, gridRow: 1, borderBottom: "1px solid #e8d5c4", padding: 20, overflow: "hidden" }}>
          <AgentGraph particles={particles} a2aMsgs={a2aMsgs} />
        </div>

        <div style={{ gridColumn: 1, gridRow: 2, borderRight: "1px solid #e8d5c4", padding: 20, overflow: "hidden" }}>
          <SummaryCard phase={phase} items={items} callTime={callTime} alerts={alerts} />
        </div>

        <div style={{ gridColumn: 3, gridRow: 2, padding: 20, overflow: "hidden" }}>
          <AlertPanel alerts={alerts} phase={phase} onReset={resetDemo} />
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
      `}</style>
    </div>
  );
}
