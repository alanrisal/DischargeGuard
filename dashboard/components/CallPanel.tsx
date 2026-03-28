"use client";
import { useEffect, useRef, useState } from "react";
import type { Phase, Subtitle, ItemState, Alert } from "@/lib/types";

function Waveform({ active }: { active: boolean }) {
  const bars = 48;
  const [heights, setHeights] = useState(() => Array.from({ length: bars }, () => 8));
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setHeights(Array.from({ length: bars }, () => 8));
      return;
    }
    let frame = 0;
    const animate = () => {
      frame++;
      setHeights(
        Array.from({ length: bars }, (_, i) => {
          const wave = Math.sin(frame * 0.08 + i * 0.4) * 20;
          const noise = (Math.random() - 0.5) * 12;
          const center = Math.max(0, 1 - Math.abs(i - bars / 2) / (bars / 2)) * 15;
          return Math.max(4, Math.min(54, 20 + wave + noise + center));
        })
      );
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [active]);

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 3, height: 80, background: "#fdf6f0",
      border: "1px solid #e8d5c4", borderRadius: 10,
      padding: "0 16px", marginBottom: 16, overflow: "hidden", position: "relative",
    }}>
      {heights.map((h, i) => (
        <div key={i} style={{
          width: 3, borderRadius: 2, flexShrink: 0,
          height: h,
          background: active ? "#e07b54" : "#d4b8a8",
          opacity: active ? 0.85 : 0.4,
          transition: "height 0.1s ease",
        }} />
      ))}
    </div>
  );
}

interface Props {
  phase: Phase;
  subtitle: Subtitle;
  items: Record<string, ItemState>;
  alerts: Alert[];
  callTime: string;
  onStart: () => void;
}

export default function CallPanel({ phase, subtitle, items, alerts, callTime, onStart }: Props) {
  const greenCount = Object.values(items).filter((v) => v.status === "green").length;
  const redCount = Object.values(items).filter((v) => v.status === "red").length;

  return (
    <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#a08070", marginBottom: 16, fontFamily: "monospace" }}>
        Live Call
      </div>

      {phase === "idle" && (
        <div style={{
          position: "absolute", inset: 0, background: "#fffaf7",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 8, zIndex: 10, borderRadius: 4,
        }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>📞</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#4a3728", marginBottom: 4 }}>Scenario: Maria Garcia</div>
          <div style={{ fontSize: 12, color: "#a08070", fontFamily: "monospace" }}>Post-discharge follow-up · Spanish</div>
          <button onClick={onStart} style={{
            marginTop: 12, padding: "12px 32px",
            background: "linear-gradient(135deg, #e07b54, #c4a35a)",
            color: "white", fontFamily: "inherit", fontSize: 15, fontWeight: 600,
            border: "none", borderRadius: 10, cursor: "pointer", letterSpacing: "0.3px",
          }}>
            ▶ Run Demo Call
          </button>
        </div>
      )}

      <Waveform active={phase === "running"} />

      {/* Subtitles */}
      <div style={{
        background: "#fdf6f0", border: "1px solid #e8d5c4",
        borderRadius: 10, padding: "14px 16px", minHeight: 90,
        position: "relative", marginBottom: 14,
      }}>
        <span style={{
          position: "absolute", top: 10, right: 12, fontSize: 10,
          fontFamily: "monospace", color: "#5aab8a",
          background: "#5aab8a18", border: "1px solid #5aab8a30",
          borderRadius: 4, padding: "2px 6px",
        }}>ES → EN</span>
        <div style={{ fontSize: 16, fontWeight: 500, color: "#3a2a1e", marginBottom: 6, lineHeight: 1.4, minHeight: 24 }}>
          {subtitle.es || (phase !== "idle" ? "…" : "")}
        </div>
        <div style={{ fontSize: 12, color: "#a08070", fontStyle: "italic", lineHeight: 1.4, minHeight: 18 }}>
          {subtitle.en}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12 }}>
        {[
          { val: greenCount, label: "UNDERSTOOD", color: "#5aab8a" },
          { val: redCount,   label: "NEEDS REVIEW", color: "#c46a6a" },
          { val: alerts.length, label: "ALERTS",   color: "#c4a35a" },
        ].map(({ val, label, color }) => (
          <div key={label} style={{
            flex: 1, background: "#fdf6f0", border: "1px solid #e8d5c4",
            borderRadius: 8, padding: "10px 12px", textAlign: "center",
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "monospace", color, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: 10, color: "#a08070", marginTop: 4, fontFamily: "monospace" }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
