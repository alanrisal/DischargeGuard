"use client";
import { useState, useRef, useEffect } from "react";
import VoiceAgentPanel from "@/components/VoiceAgentPanel";
import SummaryCard from "@/components/SummaryCard";
import AgentGraph from "@/components/AgentGraph";
import AlertPanel from "@/components/AlertPanel";
import PatientHistory from "@/components/PatientHistory";
import Link from "next/link";

const B = {
  accent: "#2563eb", surface: "#f8faff", surfaceD: "#f0f4ff",
  border: "#dde3f5", text: "#1a2340", muted: "#6b7a9e",
  green: "#16a34a", red: "#dc2626",
};

type CallStatus = "idle" | "live" | "done";

export default function DashboardPage() {
  const [callStatus, setCallStatus]   = useState<CallStatus>("idle");
  const [callTime, setCallTime]       = useState("0:00");
  const [completedSteps, setCompletedSteps] = useState(0);
  const [warnings, setWarnings]       = useState(0);
  const [sessionData, setSessionData] = useState<{
    completedSteps: string[];
    flaggedWarnings: { sign: string; severity: string }[];
    transcript: string;
    callDuration: string;
  } | null>(null);

  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef    = useRef<number>(0);
  const sentRef     = useRef(false);

  // Start timer when call goes live
  const handleCallStart = () => {
    sentRef.current = false;
    setCallStatus("live");
    setCallTime("0:00");
    setCompletedSteps(0);
    setWarnings(0);
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const s = Math.floor((Date.now() - startRef.current) / 1000);
      const m = Math.floor(s / 60);
      const sec = s % 60;
      setCallTime(`${m}:${sec.toString().padStart(2, "0")}`);
    }, 500);
  };

  // Called when ElevenLabs session ends
  const handleCallEnd = (data: {
    completedSteps: string[];
    flaggedWarnings: { sign: string; severity: string }[];
    transcript: string;
  }) => {
    if (sentRef.current) return;
    sentRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);

    const s = Math.floor((Date.now() - startRef.current) / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    const duration = `${m}:${sec.toString().padStart(2, "0")}`;

    const enriched = { ...data, callDuration: duration };
    setSessionData(enriched);
    setCallTime(duration);
    setCallStatus("done");

    const comp = Math.round((data.completedSteps.length / 9) * 100);
    fetch("/api/send-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientName:     "Maria Garcia",
        callTime:        duration,
        comprehension:   comp,
        greenCount:      data.completedSteps.length,
        totalItems:      9,
        alerts:          [],
        transcript:      data.transcript,
        completedSteps:  data.completedSteps,
        flaggedWarnings: data.flaggedWarnings,
        items:           {},
      }),
    }).then((r) => r.json())
      .then((d) => { if (d.status === "ok") console.log("[send-summary] ✓ Email sent"); })
      .catch(console.error);
  };

  // Update live metrics from VoiceAgentPanel
  const handleStepUpdate = (steps: number, warns: number) => {
    setCompletedSteps(steps);
    setWarnings(warns);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const comp = Math.round((completedSteps / 9) * 100);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: B.surface, color: B.text, fontFamily: "'Outfit', system-ui, sans-serif", overflow: "hidden" }}>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${B.border}`, padding: "10px 20px", display: "flex", alignItems: "center", gap: 16, flexShrink: 0, boxShadow: "0 1px 4px rgba(37,99,235,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/logo.png" alt="DischargeGuard" style={{ width: 32, height: 32, objectFit: "contain" }} />
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.3px", color: B.text }}>
            Discharge<span style={{ color: B.accent }}>Guard</span>
          </span>
        </div>

        <div style={{ width: 1, height: 28, background: B.border }} />

        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: B.text }}>Maria Garcia</div>
          <div style={{ display: "flex", gap: 5, marginTop: 3 }}>
            {["MRN 847291", "Post-cholecystectomy", "DOB 03/15/1955"].map((t) => (
              <span key={t} style={{ background: B.surfaceD, border: `1px solid ${B.border}`, borderRadius: 20, padding: "1px 8px", fontSize: 9, color: B.muted, fontFamily: "monospace" }}>{t}</span>
            ))}
            <span style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 20, padding: "1px 8px", fontSize: 9, color: "#15803d", fontFamily: "monospace" }}>ES · Spanish</span>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Live metrics */}
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { val: callTime,              label: "Call Time",    color: callStatus === "live" ? B.accent : B.muted },
            { val: `${completedSteps}/9`, label: "Steps Done",   color: B.green },
            { val: warnings,              label: "Warnings",     color: warnings > 0 ? B.red : B.muted },
            { val: `${comp}%`,            label: "Comprehension",color: comp > 80 ? B.green : comp > 50 ? "#d97706" : comp > 0 ? B.red : B.muted },
          ].map(({ val, label, color }) => (
            <div key={label} style={{ background: B.surfaceD, border: `1px solid ${B.border}`, borderRadius: 9, padding: "5px 12px", textAlign: "center", minWidth: 58 }}>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color, lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: 8, color: B.muted, marginTop: 2, fontFamily: "monospace" }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {callStatus === "live" && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 600, color: B.green, fontFamily: "monospace" }}>
              <div style={{ width: 6, height: 6, background: B.green, borderRadius: "50%", animation: "pulse 1.2s ease-in-out infinite" }} />
              LIVE
            </div>
          )}
          {callStatus === "done" && <div style={{ fontSize: 10, fontWeight: 600, color: B.green, fontFamily: "monospace" }}>✓ COMPLETE</div>}
          {callStatus === "idle" && <div style={{ fontSize: 10, color: B.muted, fontFamily: "monospace" }}>● STANDBY</div>}
          <Link href="/" style={{ fontSize: 10, padding: "4px 10px", borderRadius: 7, background: B.surfaceD, border: `1px solid ${B.border}`, color: B.muted, textDecoration: "none" }}>← Back</Link>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* LEFT */}
        <div style={{ width: 280, flexShrink: 0, borderRight: `1px solid ${B.border}`, padding: 16, overflow: "hidden", display: "flex", flexDirection: "column", background: "#fff" }}>
          <PatientHistory />
        </div>

        {/* CENTER */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 18, borderRight: `1px solid ${B.border}` }}>
          <VoiceAgentPanel
            onCallStart={handleCallStart}
            onCallEnd={handleCallEnd}
            onStepUpdate={handleStepUpdate}
          />
          <div style={{ height: 1, background: B.border, flexShrink: 0 }} />
          {callStatus === "done" && sessionData ? (
            <SummaryCard sessionData={sessionData} />
          ) : (
            <div style={{ background: "#f8faff", border: "1px solid #dde3f5", borderRadius: 10, padding: 20, textAlign: "center", color: B.muted, fontSize: 12, fontFamily: "monospace" }}>
              {callStatus === "live" ? "Call in progress — summary will appear here when the call ends" : "Start a call to see the session summary"}
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div style={{ width: 300, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden", background: "#fff" }}>
          <div style={{ flex: 1, borderBottom: `1px solid ${B.border}`, padding: 16, overflow: "hidden" }}>
            <AgentGraph particles={[]} a2aMsgs={[]} />
          </div>
          <div style={{ flex: 1, padding: 16, overflow: "hidden" }}>
            <AlertPanel alerts={[]} phase={callStatus === "done" ? "done" : callStatus === "live" ? "running" : "idle"} onReset={() => { setCallStatus("idle"); setSessionData(null); setCallTime("0:00"); setCompletedSteps(0); setWarnings(0); sentRef.current = false; }} />
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
