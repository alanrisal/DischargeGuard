"use client";
import { useEffect, useRef, useState } from "react";
import { WORKFLOW_STEPS } from "@/lib/useVoiceAgent";
import type { WorkflowStepId } from "@/lib/useVoiceAgent";

interface Props {
  completedSteps: string[];
  currentStep: string | null;
  totalSteps?: number;
}

const SPOKE_LABELS: Record<string, string> = {
  opening:               "Opening",
  symptoms:              "Symptoms",
  medications:           "Meds",
  activity_restrictions: "Activity",
  wound_care:            "Wound",
  follow_ups:            "Follow-Up",
  warning_signs:         "Warnings",
  open_questions:        "Questions",
  closing:               "Closing",
};

export default function RadialSpoke({ completedSteps, currentStep }: Props) {
  const SIZE      = 260;
  const CX        = SIZE / 2;
  const CY        = SIZE / 2;
  const INNER_R   = 30;
  const OUTER_R   = 96;
  const LABEL_R   = 112;
  const steps     = WORKFLOW_STEPS;
  const N         = steps.length;
  const angleStep = (2 * Math.PI) / N;
  const START_ANGLE = -Math.PI / 2; // start from top

  const [animatedFill, setAnimatedFill] = useState<Record<string, number>>({});
  const prevRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const target: Record<string, number> = {};
    steps.forEach(({ id }) => {
      if (completedSteps.includes(id)) target[id] = 1;
      else if (currentStep === id)      target[id] = 0.45;
      else                              target[id] = 0;
    });

    // Animate toward target values
    const interval = setInterval(() => {
      setAnimatedFill((prev) => {
        const next = { ...prev };
        let changed = false;
        steps.forEach(({ id }) => {
          const cur = prev[id] ?? 0;
          const tar = target[id] ?? 0;
          if (Math.abs(cur - tar) > 0.01) {
            next[id] = cur + (tar - cur) * 0.06;
            changed = true;
          } else {
            next[id] = tar;
          }
        });
        if (!changed) clearInterval(interval);
        return next;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [completedSteps, currentStep]);

  const doneCount  = completedSteps.length;
  const pct        = Math.round((doneCount / N) * 100);

  function spokePoints(i: number): { x1: number; y1: number; x2: number; y2: number; lx: number; ly: number; angle: number } {
    const angle = START_ANGLE + i * angleStep;
    return {
      x1: CX + Math.cos(angle) * INNER_R,
      y1: CY + Math.sin(angle) * INNER_R,
      x2: CX + Math.cos(angle) * OUTER_R,
      y2: CY + Math.sin(angle) * OUTER_R,
      lx: CX + Math.cos(angle) * LABEL_R,
      ly: CY + Math.sin(angle) * LABEL_R,
      angle,
    };
  }

  function strokeDashParams(fill: number): { dasharray: string; dashoffset: string } {
    const totalLen = OUTER_R - INNER_R;
    const filledLen = fill * totalLen;
    return {
      dasharray: `${totalLen}`,
      dashoffset: `${totalLen - filledLen}`,
    };
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Background spoke tracks */}
        {steps.map(({ id }, i) => {
          const { x1, y1, x2, y2 } = spokePoints(i);
          return (
            <line
              key={`track-${id}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="var(--shadow-dark)"
              strokeWidth={3}
              strokeLinecap="round"
              opacity={0.7}
            />
          );
        })}

        {/* Filled spoke segments */}
        {steps.map(({ id }, i) => {
          const { x1, y1, x2, y2 } = spokePoints(i);
          const fill     = animatedFill[id] ?? 0;
          const isActive = currentStep === id && !completedSteps.includes(id);
          const { dasharray, dashoffset } = strokeDashParams(fill);

          const color = completedSteps.includes(id)
            ? "var(--accent-success)"
            : isActive
            ? "var(--accent-clinical)"
            : "var(--accent-clinical)";

          if (fill < 0.01) return null;

          return (
            <line
              key={`fill-${id}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={color}
              strokeWidth={isActive ? 3.5 : 3}
              strokeLinecap="round"
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              opacity={isActive ? 0.8 : 1}
            />
          );
        })}

        {/* Spoke endpoint dots */}
        {steps.map(({ id }, i) => {
          const { x2, y2 } = spokePoints(i);
          const isDone   = completedSteps.includes(id);
          const isActive = currentStep === id && !isDone;
          return (
            <circle
              key={`dot-${id}`}
              cx={x2} cy={y2} r={isDone ? 4 : isActive ? 4 : 2.5}
              fill={isDone ? "var(--accent-success)" : isActive ? "var(--accent-clinical)" : "var(--shadow-dark)"}
              opacity={isDone || isActive ? 1 : 0.6}
            />
          );
        })}

        {/* Labels */}
        {steps.map(({ id }, i) => {
          const { lx, ly, angle } = spokePoints(i);
          const isDone   = completedSteps.includes(id);
          const isActive = currentStep === id && !isDone;

          // Adjust text anchor based on angle
          const deg = (angle * 180) / Math.PI;
          const anchor = deg > 80 && deg < 100 ? "middle" : deg > -100 && deg < -80 ? "middle" : lx > CX ? "start" : "end";
          const dy = deg > 60 && deg < 120 ? 14 : deg > -120 && deg < -60 ? -6 : 4;

          return (
            <text
              key={`label-${id}`}
              x={lx} y={ly + dy}
              textAnchor={anchor as "start" | "middle" | "end"}
              fontSize={9}
              fontFamily="var(--font-body)"
              fontWeight={isActive ? 600 : 400}
              fill={isDone ? "var(--accent-success)" : isActive ? "var(--accent-clinical)" : "var(--text-tertiary)"}
            >
              {isDone ? "✓ " : ""}{SPOKE_LABELS[id] ?? id}
            </text>
          );
        })}

        {/* Active step glow pulse */}
        {currentStep && !completedSteps.includes(currentStep) && (() => {
          const idx = steps.findIndex(s => s.id === currentStep);
          if (idx < 0) return null;
          const { x2, y2 } = spokePoints(idx);
          return (
            <circle cx={x2} cy={y2} r={8} fill="var(--accent-clinical)" opacity={0.2}>
              <animate attributeName="r" from="4" to="10" dur="1.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.3" to="0" dur="1.4s" repeatCount="indefinite" />
            </circle>
          );
        })()}

        {/* Center inset circle */}
        <circle cx={CX} cy={CY} r={INNER_R - 2}
          fill="var(--surface-inset)"
          filter="url(#neu-inset)"
        />

        {/* Center percentage text */}
        <text x={CX} y={CY - 5}
          textAnchor="middle"
          fontSize={14}
          fontWeight={600}
          fontFamily="var(--font-display)"
          fill="var(--text-primary)"
        >
          {doneCount}/{N}
        </text>
        <text x={CX} y={CY + 9}
          textAnchor="middle"
          fontSize={8}
          fontFamily="var(--font-body)"
          fill="var(--text-tertiary)"
          fontWeight={500}
          letterSpacing="0.04em"
        >
          DONE
        </text>

        {/* SVG filter for center inset */}
        <defs>
          <filter id="neu-inset" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="2" floodColor="var(--shadow-dark)" floodOpacity={0.7} />
          </filter>
        </defs>
      </svg>

      {/* Progress pct below */}
      <div style={{
        fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 500,
        color: pct === 100 ? "var(--accent-success)" : "var(--text-tertiary)",
        letterSpacing: "0.08em",
      }}>
        {pct}% COVERED
      </div>
    </div>
  );
}
