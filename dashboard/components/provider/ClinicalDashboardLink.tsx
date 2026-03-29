"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CLINICAL_SCENARIO_STORAGE_KEY, isClinicalScenarioId } from "@/lib/clinicalSession";

type Props = {
  style?: React.CSSProperties;
};

export default function ClinicalDashboardLink({ style }: Props) {
  const [scenario, setScenario] = useState<string>("maria");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CLINICAL_SCENARIO_STORAGE_KEY);
      if (raw && isClinicalScenarioId(raw)) setScenario(raw);
    } catch {
      /* ignore */
    }
  }, []);

  const href = `/dashboard?scenario=${encodeURIComponent(scenario)}`;

  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 14px",
        borderRadius: 12,
        textDecoration: "none",
        fontSize: 13,
        fontWeight: 600,
        color: "rgba(240,235,227,0.55)",
        background: "transparent",
        border: "1px solid transparent",
        transition: "background 0.15s ease, color 0.15s ease",
        ...style,
      }}
    >
      <span style={{ fontSize: 16, opacity: 0.9 }} aria-hidden>
        📟
      </span>
      Clinical dashboard
    </Link>
  );
}
