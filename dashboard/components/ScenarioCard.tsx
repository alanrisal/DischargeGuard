"use client";
import Link from "next/link";
import { useState } from "react";

const ACCENT = "#2563eb";

interface Props { id: string; name: string; lang: string; note: string; emoji: string; voiceScenario?: string; }

export default function ScenarioCard({ id, name, lang, note, emoji, voiceScenario }: Props) {
  const [hovered, setHovered] = useState(false);
  // If voiceScenario differs from id (Supabase patient with real MRN),
  // pass both: ?scenario=<voice_key>&mrn=<actual_mrn>
  const href = voiceScenario && voiceScenario !== id
    ? `/dashboard?scenario=${voiceScenario}&mrn=${id}`
    : `/dashboard?scenario=${id}`;
  return (
    <Link href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 14, padding: 20, display: "block",
        background: hovered ? "#eff6ff" : "#fff",
        border: `1px solid ${hovered ? "#bfdbfe" : "#dde3f5"}`,
        textDecoration: "none",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? `0 6px 20px ${ACCENT}18` : "0 1px 4px rgba(0,0,0,0.04)",
        transition: "all 0.18s ease",
      }}>
      <span style={{ fontSize: 24, display: "block", marginBottom: 8 }}>{emoji}</span>
      <span style={{ display: "block", fontWeight: 600, fontSize: 14, color: "#1a2340" }}>{name}</span>
      <span style={{ display: "block", fontSize: 12, marginTop: 4, color: ACCENT }}>{lang}</span>
      <span style={{ display: "block", fontSize: 12, marginTop: 6, color: "#6b7a9e" }}>{note}</span>
    </Link>
  );
}
