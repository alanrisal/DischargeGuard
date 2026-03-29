"use client";
import { useState } from "react";
import { usePatientData } from "@/lib/usePatientData";
import { MoreHorizontal, Clock, ChevronRight, Activity, Calendar, Phone } from "lucide-react";

type Tab = "prescriptions" | "visits" | "calls";

interface Props {
  callTime?: string;
  stepsDone?: number;
  comprehension?: number;
  warnings?: number;
}

const TABS: { id: Tab; label: string; icon: (color: string) => React.ReactNode }[] = [
  { 
    id: "prescriptions", label: "Rx", 
    icon: (color) => (
      <svg width="12" height="12" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: "rotate(-35deg)", display: "block" }}>
        <rect x="6" y="10" width="20" height="12" rx="6" fill={color} fillOpacity={0.2} stroke={color} strokeWidth="2.5" />
        <path d="M6 16C6 12.6863 8.68629 10 12 10H16V22H12C8.68629 22 6 19.3137 6 16Z" fill={color}/>
        <line x1="16" y1="10" x2="16" y2="22" stroke={color} strokeWidth="2.5"/>
      </svg>
    ) 
  },
  { id: "visits", label: "Visits", icon: (color) => <Calendar size={12} color={color} /> },
  { id: "calls", label: "Calls", icon: (color) => <Phone size={12} color={color} /> },
];

const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  active:       { bg: "rgba(13,148,136,0.3)", color: "#5eead4" },
  new:          { bg: "rgba(59,130,246,0.3)", color: "#93c5fd" },
  discontinued: { bg: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" },
};

export default function PatientHistory({ callTime = "0:00", stepsDone = 0, comprehension = 0, warnings = 0 }: Props) {
  const [tab, setTab] = useState<Tab>("prescriptions");
  const { prescriptions, loading, source } = usePatientData();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "'Inter', sans-serif" }}>

      {/* ── TOP SECTION — CALL STATS ── */}
      <div style={{ background: "#1a1a2e", borderRadius: "20px 20px 0 0", padding: "18px 16px", color: "white", flexShrink: 0 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "white" }}>Call Session</div>
          <MoreHorizontal size={16} color="rgba(255,255,255,0.5)" />
        </div>

        {/* Call Time */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Call Time</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={12} color="rgba(255,255,255,0.5)" />
              <span style={{ fontSize: 14, fontWeight: 600, color: "white" }}>{callTime}</span>
            </div>
          </div>
          <span style={{ background: "#0d9488", color: "white", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>
            COMPLETE
          </span>
        </div>

        {/* Warnings */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Warnings</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Activity size={12} color="rgba(255,255,255,0.5)" />
              <span style={{ fontSize: 14, fontWeight: 600, color: "white" }}>{warnings} Urgent</span>
            </div>
          </div>
          <span style={{ background: warnings > 0 ? "#991b1b" : "rgba(255,255,255,0.1)", color: "white", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>
            {warnings > 0 ? `${warnings} Detected` : "Clear"}
          </span>
        </div>

        {/* Comprehension */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Comprehension</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "white" }}>{comprehension}% Validated</span>
            </div>
          </div>
          <span style={{ background: "rgba(255,255,255,0.1)", color: "white", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>
            {stepsDone} Steps
          </span>
        </div>
      </div>

      {/* ── BOTTOM SECTION — MEDICATIONS LIST ── */}
      <div style={{ background: "#1f2937", borderRadius: "0 0 20px 20px", flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        
        {/* Header row */}
        <div style={{ padding: "14px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          {/* Tab Switcher */}
          <div style={{ display: "flex", gap: 0, background: "rgba(255,255,255,0.08)", borderRadius: 999, padding: 3 }}>
            {TABS.map((t) => {
              const isActive = tab === t.id;
              const color = isActive ? "white" : "rgba(255,255,255,0.4)";
              return (
                <button
                  key={t.id} onClick={() => setTab(t.id)}
                  style={{
                    borderRadius: 999, padding: "5px 14px", fontSize: 12, fontWeight: 600,
                    border: "none", cursor: "pointer", display: "flex", gap: 6, alignItems: "center",
                    background: isActive ? "#0d9488" : "transparent", color, transition: "0.2s ease",
                  }}
                >
                  {t.icon(color)}
                  {t.label}
                </button>
              );
            })}
          </div>
          <MoreHorizontal size={16} color="rgba(255,255,255,0.4)" style={{ cursor: "pointer" }} />
        </div>

        {/* Scrollable list */}
        <div className="dark-scroll" style={{ flex: 1, overflowY: "auto", padding: "0 10px 10px", display: "flex", flexDirection: "column" }}>
          <style>{`
            .dark-scroll::-webkit-scrollbar { width: 4px; }
            .dark-scroll::-webkit-scrollbar-track { background: transparent; }
            .dark-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 999px; }
            .med-card-hover:hover { background: rgba(255,255,255,0.10) !important; }
          `}</style>
          
          {loading ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
              Loading data…
            </div>
          ) : (
            tab === "prescriptions" && prescriptions.map((rx, i) => {
              const bStyle = BADGE_STYLES[rx.status] || BADGE_STYLES.active;
              return (
                <div key={i} className="med-card-hover" style={{
                  background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: "12px 14px", marginBottom: 8,
                  display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "background 0.2s ease"
                }}>
                  {/* Left Icon */}
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: "rgba(13,148,136,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {TABS[0].icon("#0d9488")}
                  </div>

                  {/* Center Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {rx.name}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {rx.purpose}
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                      {rx.prescribed_by} · {rx.prescribed_date}
                    </div>
                    {rx.refills > 0 && (
                      <div style={{ fontSize: 10, color: "#0d9488", marginTop: 2, fontWeight: 600 }}>
                        {rx.refills} refills
                      </div>
                    )}
                  </div>

                  {/* Right side Badge + Chevron */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                    <span style={{
                      background: bStyle.bg, color: bStyle.color,
                      fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
                      textTransform: "uppercase", letterSpacing: "0.2px"
                    }}>
                      {rx.status}
                    </span>
                    <ChevronRight size={14} color="rgba(255,255,255,0.3)" />
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* Bottom bar */}
        <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%", background: "#0d9488", color: "white",
            fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            KF
          </div>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>
            {source === "supabase" ? "Live data · Supabase" : "Demo data · connect Supabase to go live"}
          </span>
        </div>
      </div>
    </div>
  );
}
