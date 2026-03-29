"use client";
import { UserCircle2 } from "lucide-react";

interface Props {
  compScore?: number;
}

export default function PatientCard({ compScore = 70 }: Props) {
  const dash = 2 * Math.PI * 20; // radius is 20
  const offset = dash - (dash * compScore) / 100;

  return (
    <div style={{
      background: "rgba(255,255,255,0.75)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderRadius: 20,
      border: "none",
      boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Photo Area */}
      <div style={{
        width: "100%", height: 180,
        borderRadius: "16px 16px 0 0",
        background: "linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 8,
      }}>
        <UserCircle2 size={72} color="#0d9488" opacity={0.4} strokeWidth={1.5} />
        <span style={{ fontSize: 12, color: "#9ca3af", fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
          No Photo
        </span>
      </div>

      {/* Info Area */}
      <div style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e", fontFamily: "'Inter', sans-serif" }}>
          Maria Garcia
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b7280", fontFamily: "'Inter', sans-serif", marginTop: 4 }}>
          <span>MRN 847291</span>
          <span>·</span>
          <span>Post-cholecystectomy</span>
        </div>

        {/* Info Chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          <span style={{
            background: "#f3f4f6", borderRadius: 999, padding: "3px 10px",
            fontSize: 11, color: "#374151", fontFamily: "'Inter', sans-serif", fontWeight: 500
          }}>
            DOB 03/15/1955
          </span>
          <span style={{
            background: "#fef9c3", borderRadius: 999, padding: "3px 10px",
            fontSize: 11, color: "#854d0e", fontFamily: "'Inter', sans-serif", fontWeight: 600
          }}>
            ES · Spanish
          </span>
        </div>
      </div>

      {/* Progress Ring */}
      <div style={{ position: "absolute", bottom: 14, right: 14, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="44" height="44" viewBox="0 0 44 44" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
          <circle cx="22" cy="22" r="20" fill="none" stroke="#e5e7eb" strokeWidth="4" />
          {compScore > 0 && (
            <circle cx="22" cy="22" r="20" fill="none" stroke="#0d9488" strokeWidth="4" strokeLinecap="round"
              strokeDasharray={dash} strokeDashoffset={offset}
            />
          )}
        </svg>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#0d9488", fontFamily: "'Inter', sans-serif", position: "relative", zIndex: 1 }}>
          {compScore}%
        </span>
      </div>
    </div>
  );
}
