"use client";
import type { ChecklistItem, ItemState } from "@/lib/types";

const STATUS_COLOR: Record<string, string> = {
  green:  "#16a34a",
  yellow: "#d97706",
  red:    "#dc2626",
  active: "#2563eb",
  idle:   "#c7d2e8",
};
const STATUS_BG: Record<string, string> = {
  green: "#f0fdf4", yellow: "#fffbeb", red: "#fef2f2", active: "#eff6ff", idle: "transparent",
};
const STATUS_BORDER: Record<string, string> = {
  green: "#86efac", yellow: "#fcd34d", red: "#fca5a5", active: "#bfdbfe", idle: "#dde3f5",
};

function getIcon(s: string) {
  if (s === "green")  return "✓";
  if (s === "yellow") return "~";
  if (s === "red")    return "✕";
  if (s === "active") return "◉";
  return "○";
}

interface Props { checklist: ChecklistItem[]; items: Record<string, ItemState>; comprehension: number; }

export default function ChecklistPanel({ checklist, items, comprehension }: Props) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const ringColor = comprehension > 80 ? "#16a34a" : comprehension > 50 ? "#d97706" : "#dc2626";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#6b7a9e", fontFamily: "monospace" }}>
          Comprehension Checklist
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative", width: 40, height: 40 }}>
            <svg width="40" height="40" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r={r} fill="none" stroke="#dde3f5" strokeWidth="3" />
              <circle cx="20" cy="20" r={r} fill="none"
                stroke={ringColor} strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${circ * (comprehension / 100)} ${circ}`}
                style={{ transform: "rotate(-90deg)", transformOrigin: "20px 20px", transition: "stroke-dasharray 0.8s ease" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, fontFamily: "monospace", color: ringColor }}>
              {comprehension}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: "#6b7a9e", fontFamily: "monospace" }}>COMPREHENSION</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#1a2340" }}>
              {comprehension === 0 ? "Waiting…" : comprehension < 50 ? "Low" : comprehension < 80 ? "Partial" : "Strong"}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {checklist.map((item) => {
          const st = items[item.id] ?? { status: "idle", score: "", fill: 0, note: "" };
          const color = STATUS_COLOR[st.status];
          return (
            <div key={item.id} style={{
              background: STATUS_BG[st.status],
              border: `1px solid ${STATUS_BORDER[st.status]}`,
              borderTop: `3px solid ${color}`,
              borderRadius: 10, padding: "10px 12px",
              transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
              boxShadow: st.status === "active" ? `0 0 0 3px #bfdbfe` : "0 1px 3px rgba(0,0,0,0.04)",
              display: "flex", flexDirection: "column", gap: 5,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, background: `${color}20`,
                  border: `1px solid ${color}`, color,
                }}>{getIcon(st.status)}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#1a2340", lineHeight: 1.2, flex: 1 }}>{item.name}</div>
                {st.score && (
                  <div style={{ fontSize: 8, fontFamily: "monospace", fontWeight: 700, padding: "1px 5px", borderRadius: 20, color, background: `${color}18`, flexShrink: 0 }}>
                    {st.score}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 9, color: "#6b7a9e", fontFamily: "monospace", lineHeight: 1.3 }}>{item.detail}</div>
              <div style={{ height: 3, background: "#e8eeff", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 2, width: `${st.fill}%`, background: color, transition: "width 0.8s cubic-bezier(0.25,1,0.5,1), background 0.4s ease" }} />
              </div>
              {st.note && <div style={{ fontSize: 8, color: "#dc2626", fontFamily: "monospace" }}>⚡ {st.note}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
