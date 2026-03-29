"use client";
import { useEffect, useRef, useState } from "react";
import type { Phase, Subtitle } from "@/lib/types";

const ACCENT = "#2563eb";

function Waveform({ active }: { active: boolean }) {
  const bars = 52;
  const [heights, setHeights] = useState(() => Array.from({ length: bars }, () => 6));
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) { setHeights(Array.from({ length: bars }, () => 6)); return; }
    let frame = 0;
    const animate = () => {
      frame++;
      setHeights(Array.from({ length: bars }, (_, i) => {
        const wave = Math.sin(frame * 0.08 + i * 0.4) * 18;
        const noise = (Math.random() - 0.5) * 10;
        const center = Math.max(0, 1 - Math.abs(i - bars / 2) / (bars / 2)) * 14;
        return Math.max(3, Math.min(48, 18 + wave + noise + center));
      }));
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [active]);

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 2, height: 64,
      background: active ? "#eff6ff" : "#f8faff",
      border: `1px solid ${active ? "#bfdbfe" : "#dde3f5"}`,
      borderRadius: 10, padding: "0 16px", overflow: "hidden",
      transition: "background 0.3s ease, border-color 0.3s ease",
    }}>
      {heights.map((h, i) => (
        <div key={i} style={{
          width: 2.5, borderRadius: 2, flexShrink: 0, height: h,
          background: active ? ACCENT : "#c7d2e8",
          opacity: active ? 0.75 : 0.3,
          transition: "height 0.08s ease",
        }} />
      ))}
    </div>
  );
}

interface Props { phase: Phase; subtitle: Subtitle; onStart: () => void; }

export default function CallPanel({ phase, subtitle, onStart }: Props) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#6b7a9e", marginBottom: 12, fontFamily: "monospace" }}>
        Live Call
      </div>

      {phase === "idle" ? (
        <div style={{
          background: "#f8faff", border: "1px solid #dde3f5", borderRadius: 12,
          padding: "28px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
        }}>
          <div style={{ fontSize: 28 }}>📞</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2340" }}>Ready to call Maria Garcia</div>
          <div style={{ fontSize: 11, color: "#6b7a9e", fontFamily: "monospace" }}>Post-discharge follow-up · Spanish</div>
          <button onClick={onStart} className="button-3" style={{ marginTop: 6 }}>
            ▶ Run Demo Call
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Waveform active={phase === "running"} />
          <div style={{
            background: "#f8faff", border: "1px solid #dde3f5",
            borderRadius: 10, padding: "14px 16px", position: "relative",
          }}>
            <span style={{
              position: "absolute", top: 10, right: 12, fontSize: 9,
              fontFamily: "monospace", color: "#16a34a",
              background: "#dcfce7", border: "1px solid #86efac",
              borderRadius: 4, padding: "2px 6px",
            }}>ES → EN</span>
            <div style={{ fontSize: 15, fontWeight: 500, color: "#1a2340", lineHeight: 1.45, marginBottom: 6, paddingRight: 52 }}>
              {subtitle.es || "…"}
            </div>
            <div style={{ fontSize: 11, color: "#6b7a9e", fontStyle: "italic", lineHeight: 1.4 }}>
              {subtitle.en}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
