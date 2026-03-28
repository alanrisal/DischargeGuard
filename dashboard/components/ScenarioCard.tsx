"use client";
import Link from "next/link";
import { useState } from "react";

interface Props {
  id: string;
  name: string;
  lang: string;
  note: string;
  emoji: string;
}

export default function ScenarioCard({ id, name, lang, note, emoji }: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/dashboard?scenario=${id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 14,
        padding: 20,
        display: "block",
        background: hovered ? "#fff3ec" : "#fff8f3",
        border: `1px solid ${hovered ? "#e8c4a8" : "#e8d5c4"}`,
        textDecoration: "none",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? "0 6px 20px rgba(224,123,84,0.12)" : "0 1px 4px rgba(0,0,0,0.04)",
        transition: "all 0.18s ease",
      }}
    >
      <span style={{ fontSize: 24, display: "block", marginBottom: 8 }}>{emoji}</span>
      <span style={{ display: "block", fontWeight: 600, fontSize: 14, color: "#3a2a1e" }}>{name}</span>
      <span style={{ display: "block", fontSize: 12, marginTop: 4, color: "#e07b54" }}>{lang}</span>
      <span style={{ display: "block", fontSize: 12, marginTop: 6, color: "#a08070" }}>{note}</span>
    </Link>
  );
}
