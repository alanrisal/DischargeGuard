import Link from "next/link";
import { SCENARIOS } from "@/lib/scenarioData";

const RING: Record<string, string> = {
  es: "#C2714F",
  zh: "#3B6FA0",
  en: "#4A8C6F",
};

const FLAG: Record<string, string> = {
  es: "🇪🇸",
  zh: "🇨🇳",
  en: "🇺🇸",
};

export default function ProviderPatientsPage() {
  const patients = Object.values(SCENARIOS);

  return (
    <div style={{ padding: "28px 32px 48px", maxWidth: 900 }}>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: 28,
          color: "var(--text-primary)",
          margin: "0 0 8px",
        }}
      >
        Select a patient
      </h1>
      <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: "0 0 28px", maxWidth: 520 }}>
        Choose who you are monitoring. You will open the full clinical dashboard for live calls, transcript, and
        checklist.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 18,
        }}
      >
        {patients.map((p) => {
          const ring = RING[p.language_code] ?? "#7A6E68";
          const flag = FLAG[p.language_code] ?? "🏥";
          const initials = p.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return (
            <Link
              key={p.id}
              href={`/dashboard?scenario=${encodeURIComponent(p.id)}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                style={{
                  background: "var(--surface-raised)",
                  boxShadow: "8px 8px 18px var(--shadow-dark), -6px -6px 16px var(--shadow-light)",
                  borderRadius: 18,
                  padding: "22px 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                  transition: "transform 0.15s ease",
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    border: `3px solid ${ring}`,
                    background: "var(--surface-inset)",
                    boxShadow: "inset 3px 3px 8px var(--shadow-dark), inset -2px -2px 8px var(--shadow-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18, color: ring }}>
                    {initials}
                  </span>
                </div>
                <span style={{ fontSize: 28, lineHeight: 1 }} aria-hidden>
                  {flag}
                </span>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>
                    MRN {p.mrn} · {p.language}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 6, lineHeight: 1.4 }}>
                    {p.diagnosis.split(",")[0].trim()}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: "var(--accent-clinical)",
                    textTransform: "uppercase",
                    marginTop: 4,
                  }}
                >
                  Open dashboard →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
