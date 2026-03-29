"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ClinicalDashboardLink from "./ClinicalDashboardLink";

export default function ProviderShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const onPatients = pathname === "/provider/patients";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "flex-start",
        background: "var(--bg-base)",
        fontFamily: "var(--font-body)",
      }}
    >
      <aside
        style={{
          width: 240,
          flexShrink: 0,
          minHeight: "100vh",
          background: "#1F1A16",
          display: "flex",
          flexDirection: "column",
          padding: "20px 14px",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Link
          href="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 9,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: 13,
                color: "var(--accent-warm)",
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 600,
              }}
            >
              C
            </span>
          </div>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: 14,
              color: "rgba(240,235,227,0.9)",
            }}
          >
            Care<span style={{ fontStyle: "normal", color: "var(--accent-warm)" }}>Call</span>
          </span>
        </Link>

        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "rgba(240,235,227,0.35)",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          Provider workspace
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Link
            href="/provider/patients"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              borderRadius: 12,
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
              color: onPatients ? "rgba(240,235,227,0.95)" : "rgba(240,235,227,0.55)",
              background: onPatients ? "rgba(255,255,255,0.08)" : "transparent",
              border: onPatients ? "1px solid rgba(194,113,79,0.4)" : "1px solid transparent",
            }}
          >
            <span style={{ fontSize: 16 }} aria-hidden>
              👥
            </span>
            All patients
          </Link>

          <ClinicalDashboardLink />
        </nav>

        <div style={{ flex: 1, minHeight: 24 }} />

        <Link
          href="/my-care/m"
          style={{
            fontSize: 11,
            color: "rgba(240,235,227,0.32)",
            textDecoration: "none",
            padding: "8px 4px",
          }}
        >
          Open patient view (demo)
        </Link>
      </aside>

      <div style={{ flex: 1, minWidth: 0, overflow: "auto" }}>{children}</div>
    </div>
  );
}
