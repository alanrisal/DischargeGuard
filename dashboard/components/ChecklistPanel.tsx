"use client";
import { CHECKLIST } from "@/lib/demoData";
import type { ItemState } from "@/lib/types";

const STATUS_COLOR: Record<string, string> = {
  green:  "#5aab8a",
  yellow: "#c4a35a",
  red:    "#c46a6a",
  active: "#e07b54",
  idle:   "#d4b8a8",
};

const STATUS_BG: Record<string, string> = {
  green:  "#5aab8a10",
  yellow: "#c4a35a10",
  red:    "#c46a6a10",
  active: "#e07b5410",
  idle:   "transparent",
};

const STATUS_BORDER: Record<string, string> = {
  green:  "#5aab8a30",
  yellow: "#c4a35a30",
  red:    "#c46a6a30",
  active: "#e07b5430",
  idle:   "#e8d5c4",
};

function getIcon(status: string) {
  if (status === "green")  return "✓";
  if (status === "yellow") return "~";
  if (status === "red")    return "✕";
  if (status === "active") return "◉";
  return "○";
}

interface Props {
  items: Record<string, ItemState>;
  comprehension: number;
}

export default function ChecklistPanel({ items, comprehension }: Props) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const ringColor = comprehension > 80 ? "#5aab8a" : comprehension > 50 ? "#c4a35a" : "#c46a6a";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#a08070", marginBottom: 16, fontFamily: "monospace" }}>
        Comprehension Checklist
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1, overflowY: "auto" }}>
        {CHECKLIST.map((item) => {
          const st = items[item.id];
          const color = STATUS_COLOR[st.status];
          return (
            <div key={item.id} style={{
              background: STATUS_BG[st.status],
              border: `1px solid ${STATUS_BORDER[st.status]}`,
              borderRadius: 10, padding: "10px 14px",
              borderLeft: `3px solid ${color}`,
              transition: "all 0.4s ease",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, flexShrink: 0,
                  background: st.status !== "idle" ? `${color}20` : "#f5ede6",
                  border: `1px solid ${color}`,
                  color,
                }}>
                  {getIcon(st.status)}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, flex: 1, color: "#3a2a1e" }}>{item.name}</div>
                {st.score && (
                  <div style={{
                    fontSize: 10, fontFamily: "monospace", fontWeight: 600,
                    padding: "2px 8px", borderRadius: 20,
                    color, background: `${color}18`,
                  }}>
                    {st.score}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 11, color: "#a08070", fontFamily: "monospace", marginBottom: 6 }}>{item.detail}</div>
              <div style={{ height: 4, background: "#f0e4d8", borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 2,
                  width: `${st.fill}%`,
                  background: color,
                  transition: "width 0.8s cubic-bezier(0.25,1,0.5,1), background 0.4s ease",
                }} />
              </div>
              {st.note && (
                <div style={{ fontSize: 10, color: "#c46a6a", marginTop: 4, fontFamily: "monospace" }}>
                  ⚡ {st.note}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Overall ring */}
      <div style={{
        background: "#fdf6f0", border: "1px solid #e8d5c4",
        borderRadius: 10, padding: "12px 16px",
        display: "flex", alignItems: "center", gap: 14, marginTop: 12, flexShrink: 0,
      }}>
        <div style={{ position: "relative", width: 52, height: 52, flexShrink: 0 }}>
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r={r} fill="none" stroke="#e8d5c4" strokeWidth="4" />
            <circle cx="26" cy="26" r={r} fill="none"
              stroke={ringColor} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={`${circ * (comprehension / 100)} ${circ}`}
              style={{ transform: "rotate(-90deg)", transformOrigin: "26px 26px", transition: "stroke-dasharray 0.8s ease" }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: ringColor,
          }}>
            {comprehension}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "#a08070", fontFamily: "monospace", marginBottom: 4 }}>OVERALL COMPREHENSION</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#3a2a1e" }}>
            {comprehension === 0 ? "Waiting for call…" :
             comprehension < 50 ? "Low — intervention needed" :
             comprehension < 80 ? "Partial — continue reviewing" :
             "Strong — patient engaged"}
          </div>
        </div>
      </div>
    </div>
  );
}
