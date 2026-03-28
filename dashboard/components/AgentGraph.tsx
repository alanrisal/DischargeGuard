"use client";
import { GRAPH_NODES, GRAPH_EDGES } from "@/lib/demoData";
import type { Particle, A2AMessage } from "@/lib/types";

interface Props {
  particles: Particle[];
  a2aMsgs: A2AMessage[];
}

export default function AgentGraph({ particles, a2aMsgs }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#6b7a9e", marginBottom: 12, fontFamily: "monospace" }}>
        Agent Network · A2A
      </div>

      <div style={{ width: "100%", height: 220, position: "relative", flexShrink: 0 }}>
        <svg viewBox="0 0 300 210" style={{ width: "100%", height: "100%" }}>
          {/* Edges */}
          {GRAPH_EDGES.map(([a, b], i) => {
            const na = GRAPH_NODES.find((n) => n.id === a)!;
            const nb = GRAPH_NODES.find((n) => n.id === b)!;
            return <line key={i} x1={na.cx} y1={na.cy} x2={nb.cx} y2={nb.cy} stroke="#dde3f5" strokeWidth="1" />;
          })}

          {/* Particles */}
          {particles.map((p) => {
            const na = GRAPH_NODES.find((n) => n.id === p.from);
            const nb = GRAPH_NODES.find((n) => n.id === p.to);
            if (!na || !nb) return null;
            const x = na.cx + (nb.cx - na.cx) * p.progress;
            const y = na.cy + (nb.cy - na.cy) * p.progress;
            return (
              <circle key={p.id} cx={x} cy={y} r={4}
                fill={na.color} opacity={0.9}
                style={{ filter: `drop-shadow(0 0 4px ${na.color})` }}
              />
            );
          })}

          {/* Nodes */}
          {GRAPH_NODES.map((n) => (
            <g key={n.id}>
              <circle cx={n.cx} cy={n.cy} r={n.r}
                fill={`${n.color}20`} stroke={n.color} strokeWidth="1.5" />
              {n.label.map((line, li) => (
                <text key={li}
                  x={n.cx}
                  y={n.cy + (li - (n.label.length - 1) / 2) * 11}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={n.id === "CareCoord" ? 8 : 7}
                  fontWeight={n.id === "CareCoord" ? "600" : "400"}
                  fill={n.color}
                  style={{ fontFamily: "monospace", pointerEvents: "none" }}
                >
                  {line}
                </text>
              ))}
            </g>
          ))}
        </svg>
      </div>

      {/* A2A log */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, overflow: "hidden" }}>
        {a2aMsgs.length === 0 ? (
          <div style={{
            fontSize: 10, fontFamily: "monospace", color: "#c7d2e8",
            background: "#f8faff", border: "1px solid #dde3f5",
            borderRadius: 5, padding: "4px 8px", opacity: 0.6,
          }}>
            — A2A messages will appear here
          </div>
        ) : (
          a2aMsgs.map((m, i) => (
            <div key={i} style={{
              fontSize: 10, fontFamily: "monospace",
              background: "#f8faff", border: "1px solid #dde3f5",
              borderRadius: 5, padding: "4px 8px",
              display: "flex", gap: 6, alignItems: "flex-start",
            }}>
              <span style={{ color: "#2563eb", flexShrink: 0 }}>{m.from}</span>
              <span style={{ color: "#c7d2e8", flexShrink: 0 }}>→</span>
              <span style={{ color: "#7c3aed", flexShrink: 0 }}>{m.to}</span>
              <span style={{ color: "#6b7a9e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{m.msg}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
