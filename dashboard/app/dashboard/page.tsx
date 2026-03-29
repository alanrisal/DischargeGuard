"use client";
import { useState, useRef, useEffect } from "react";
import VoiceAgentPanel from "@/components/VoiceAgentPanel";
import PatientCard from "@/components/PatientCard";
import CalendarCard from "@/components/CalendarCard";
import PatientHistory from "@/components/PatientHistory";
import { Settings, Bell } from "lucide-react";

type CallStatus = "idle" | "live" | "done";

function ShieldLogo({ width = 38, height = 38 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M28 75 Q14 75 14 60 Q14 48 24 48" stroke="#0f4c54" strokeWidth="6" strokeLinecap="round" fill="none"/>
      <path d="M92 75 Q106 75 106 60 Q106 48 96 48" stroke="#0f4c54" strokeWidth="6" strokeLinecap="round" fill="none"/>
      <path d="M24 48 Q24 85 60 85 Q96 85 96 48" stroke="#0f4c54" strokeWidth="6" strokeLinecap="round" fill="none"/>
      <circle cx="28" cy="75" r="5" fill="#0f4c54"/>
      <circle cx="92" cy="75" r="5" fill="#0f4c54"/>
      <path d="M60 8 L88 20 L88 52 Q88 78 60 92 Q32 78 32 52 L32 20 Z" fill="white" stroke="#0f4c54" strokeWidth="6" strokeLinejoin="round"/>
      <path d="M60 8 L60 92 Q32 78 32 52 L32 20 Z" fill="#1a8a2e"/>
      <line x1="60" y1="9" x2="60" y2="91" stroke="white" strokeWidth="3"/>
      <path d="M60 8 L88 20 L88 52 Q88 78 60 92 Q32 78 32 52 L32 20 Z" fill="none" stroke="#0f4c54" strokeWidth="6" strokeLinejoin="round"/>
    </svg>
  );
}

export default function DashboardPage() {
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [callTime, setCallTime] = useState("0:00");
  const [completedSteps, setCompletedSteps] = useState(0);
  const [warnings, setWarnings] = useState(0);
  const [sessionData, setSessionData] = useState<{
    completedSteps: string[];
    flaggedWarnings: { sign: string; severity: string }[];
    transcript: string;
    callDuration: string;
  } | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);
  const sentRef = useRef(false);

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
        patientName: "Maria Garcia",
        callTime: duration,
        comprehension: comp,
        greenCount: data.completedSteps.length,
        totalItems: 9,
        alerts: [],
        transcript: data.transcript,
        completedSteps: data.completedSteps,
        flaggedWarnings: data.flaggedWarnings,
        items: {},
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.status === "ok") console.log("[send-summary] ✓ Email sent");
      })
      .catch(console.error);
  };

  const handleStepUpdate = (steps: number, warns: number) => {
    setCompletedSteps(steps);
    setWarnings(warns);
  };

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const comp = Math.round((completedSteps / 9) * 100);
  const [navSelected, setNavSelected] = useState<"dashboard" | "patients" | "settings">("dashboard");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        html, body {
          background: #e8eaf0 !important;
          margin: 0;
          padding: 0;
          font-family: 'Inter', sans-serif !important;
        }
        * {
          box-sizing: border-box;
          font-family: 'Inter', sans-serif;
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>
      
      <div style={{
        background: "linear-gradient(145deg, #eef1f8 0%, #e8edf8 40%, #dde4f5 100%)",
        borderRadius: 24, padding: 0,
        width: "calc(100vw - 48px)", height: "calc(100vh - 48px)",
        margin: "24px auto", overflow: "hidden",
        display: "flex", flexDirection: "column",
        boxShadow: "0 20px 60px rgba(0,0,0,0.12)"
      }}>
        
        {/* Top Navbar */}
        <div style={{ height: 64, padding: "0 28px", display: "flex", alignItems: "center", gap: 16, background: "transparent", flexShrink: 0 }}>
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
            <ShieldLogo width={38} height={38} />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 10 }}>
            <button onClick={() => setNavSelected("dashboard")} style={{
              background: navSelected === "dashboard" ? "#1a1a2e" : "transparent",
              color: navSelected === "dashboard" ? "#ffffff" : "#4b5563",
              borderRadius: 999, padding: "8px 20px", fontSize: 14,
              fontWeight: navSelected === "dashboard" ? 600 : 500,
              border: "none", cursor: "pointer", transition: "all 0.2s ease"
            }}>Dashboard</button>
            <button onClick={() => setNavSelected("patients")} style={{
              background: navSelected === "patients" ? "#1a1a2e" : "transparent",
              color: navSelected === "patients" ? "#ffffff" : "#4b5563",
              borderRadius: 999, padding: "8px 20px", fontSize: 14,
              fontWeight: navSelected === "patients" ? 600 : 500,
              border: "none", cursor: "pointer", transition: "all 0.2s ease"
            }}>Patients</button>
            <button onClick={() => setNavSelected("settings")} style={{
              background: navSelected === "settings" ? "#1a1a2e" : "transparent",
              color: navSelected === "settings" ? "#ffffff" : "#4b5563",
              borderRadius: 999, padding: "8px 20px", fontSize: 14,
              fontWeight: navSelected === "settings" ? 600 : 500,
              border: "none", cursor: "pointer", transition: "all 0.2s ease"
            }}>Settings</button>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <button style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,0.7)", borderRadius: 999,
              padding: "8px 16px", border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 500, color: "#374151",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)", transition: "all 0.2s ease"
            }}>
              <Settings size={16} color="#374151" />
              Settings
            </button>
            
            <button style={{
              width: 38, height: 38, borderRadius: 999,
              background: "rgba(255,255,255,0.7)", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)", transition: "all 0.2s ease"
            }}>
              <Bell size={18} color="#374151" />
            </button>
            
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: "#0d9488", color: "white",
              fontSize: 14, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "2px solid white", boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
            }}>
              MG
            </div>
          </div>
        </div>

        {/* Page Title */}
        <div style={{ padding: "16px 28px 12px", flexShrink: 0 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1a1a2e", margin: 0 }}>
            Welcome back, <span style={{ color: "#0d9488" }}>Maria Garcia</span>
          </h1>
        </div>

        {/* Main Grid Content */}
        <div style={{
          display: "grid", gridTemplateColumns: "280px 1fr 1fr 300px", gridTemplateRows: "minmax(0, 1fr)",
          gap: 16, padding: "0 28px 28px", flex: 1, overflow: "hidden"
        }}>
          
          {/* Column 1: Patient Profile */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <PatientCard compScore={comp} />
            <CalendarCard />
          </div>

          {/* Columns 2-3: Voice Agent Panel */}
          <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: 16, overflow: "hidden" }}>
            <VoiceAgentPanel
              onCallStart={handleCallStart}
              onCallEnd={handleCallEnd}
              onStepUpdate={handleStepUpdate}
            />
          </div>

          {/* Column 4: Medications Panel */}
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <PatientHistory
              callTime={callTime}
              stepsDone={completedSteps}
              comprehension={comp}
              warnings={warnings}
            />
          </div>
          
        </div>
      </div>
    </>
  );
}
