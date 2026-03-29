"use client";
import { useState } from "react";
import Link from "next/link";

const STATUS_STYLES = {
  scheduled:   { label: "Call Scheduled",  bg: "var(--accent-clinical-light)", color: "var(--accent-clinical)" },
  in_progress: { label: "In Progress",      bg: "var(--accent-warm-light)",     color: "var(--accent-warm)" },
  completed:   { label: "Completed",        bg: "var(--accent-success-light)",  color: "var(--accent-success)" },
};

const LANG_COLORS: Record<string, string> = {
  es: "#C2714F", zh: "#3B6FA0", en: "#4A8C6F",
  ko: "#7B5EA7", fr: "#5E8A5A", de: "#7A6E68",
  default: "#7A6E68",
};

interface Props {
  id: string;
  name: string;
  lang: string;
  langCode: string;
  note: string;
  initials: string;
  status: keyof typeof STATUS_STYLES;
  voiceScenario: string;
  animDelay?: number;
}

export default function PatientCard({
  id, name, lang, langCode, note, initials, status, voiceScenario, animDelay = 0,
}: Props) {
  const [hovered, setHovered] = useState(false);

  const href = voiceScenario && voiceScenario !== id
    ? `/dashboard?scenario=${voiceScenario}&mrn=${id}`
    : `/dashboard?scenario=${id}`;

  const st = STATUS_STYLES[status] ?? STATUS_STYLES.scheduled;
  const avatarColor = LANG_COLORS[langCode] ?? LANG_COLORS.default;

  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: "var(--surface-raised)",
          boxShadow: hovered
            ? "8px 8px 18px var(--shadow-dark), -8px -8px 18px var(--shadow-light)"
            : "6px 6px 14px var(--shadow-dark), -6px -6px 14px var(--shadow-light)",
          borderRadius: 16,
          padding: "22px 22px 20px",
          cursor: "pointer",
          transform: hovered ? "translateY(-3px)" : "translateY(0)",
          transition: "box-shadow 200ms ease, transform 200ms ease",
          animation: `slide-up 0.45s ${animDelay}ms ease both`,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Top row: avatar + status */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>

          {/* Avatar inset circle */}
          <div style={{
            width: 52, height: 52,
            borderRadius: "50%",
            background: "var(--surface-inset)",
            boxShadow: "inset 3px 3px 7px var(--shadow-dark), inset -3px -3px 7px var(--shadow-light)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 17,
              color: avatarColor,
              letterSpacing: "-0.5px",
            }}>
              {initials}
            </span>
          </div>

          {/* Status pill */}
          <div style={{
            background: "var(--surface-inset)",
            boxShadow: "inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light)",
            borderRadius: 999,
            padding: "4px 11px",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.06em",
            color: st.color,
            whiteSpace: "nowrap",
          }}>
            {st.label}
          </div>
        </div>

        {/* Patient name */}
        <div>
          <div style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: 18,
            color: "var(--text-primary)",
            lineHeight: 1.2,
            marginBottom: 5,
          }}>
            {name}
          </div>
          <div style={{
            fontFamily: "var(--font-body)",
            fontWeight: 300,
            fontSize: 12,
            color: "var(--text-secondary)",
          }}>
            {note}
          </div>
        </div>

        {/* Footer: language tag + arrow */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingTop: 12,
          borderTop: "1px solid var(--shadow-dark)",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: avatarColor,
              flexShrink: 0,
            }} />
            <span style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--text-secondary)",
            }}>
              {lang}
            </span>
          </div>

          <div style={{
            fontFamily: "var(--font-body)",
            fontSize: 12,
            color: hovered ? "var(--accent-clinical)" : "var(--text-tertiary)",
            transition: "color 200ms ease, transform 200ms ease",
            transform: hovered ? "translateX(3px)" : "translateX(0)",
          }}>
            Open →
          </div>
        </div>
      </div>
    </Link>
  );
}
