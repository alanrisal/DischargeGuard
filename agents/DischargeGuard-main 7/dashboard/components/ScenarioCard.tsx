"use client";
import Link from "next/link";
import { useState } from "react";

const ACCENT = "#2563eb";

interface Props { id: string; name: string; lang: string; note: string; emoji: string; voiceScenario?: string; }

export default function ScenarioCard({ id, name, lang, note, emoji, voiceScenario }: Props) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [ext, setExt] = useState<"jpg" | "png">("jpg");

  const href = voiceScenario && voiceScenario !== id
    ? `/dashboard?scenario=${voiceScenario}&mrn=${id}`
    : `/dashboard?scenario=${id}`;

  const photoSrc = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/patient-photos/${id}.${ext}`;

  const handleImgError = () => {
    if (ext === "jpg") {
      setExt("png"); // retry with png
    } else {
      setImgError(true); // both failed, show emoji
    }
  };

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

      {/* Patient photo or emoji fallback */}
      {!imgError ? (
        <img
          src={photoSrc}
          alt={name}
          onError={() => handleImgError()}
          style={{
            width: 56, height: 56, borderRadius: "50%",
            objectFit: "cover", marginBottom: 12,
            border: `2px solid ${hovered ? "#bfdbfe" : "#dde3f5"}`,
            display: "block",
          }}
        />
      ) : (
        <div style={{
          width: 56, height: 56, borderRadius: "50%", marginBottom: 12,
          background: "#eff6ff", border: `2px solid #dde3f5`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26,
        }}>
          {emoji}
        </div>
      )}

      <span style={{ display: "block", fontWeight: 600, fontSize: 14, color: "#1a2340" }}>{name}</span>
      <span style={{ display: "block", fontSize: 12, marginTop: 4, color: ACCENT }}>{lang}</span>
      <span style={{ display: "block", fontSize: 12, marginTop: 6, color: "#6b7a9e" }}>{note}</span>
    </Link>
  );
}
