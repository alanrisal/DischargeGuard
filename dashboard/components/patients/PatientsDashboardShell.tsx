"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Waveform from "@/components/dashboard/Waveform";
import RadialSpoke from "@/components/dashboard/RadialSpoke";
import MedChecklist from "@/components/dashboard/MedChecklist";
import { getScenario } from "@/lib/scenarioData";

export type PatientPickerRow = {
  id: string;
  name: string;
  lang: string;
  langCode: string;
  note: string;
  initials: string;
  status: "scheduled";
  voiceScenario: string;
  emoji?: string;
};

const LANG_COLORS: Record<string, string> = {
  es: "#C2714F", zh: "#3B6FA0", en: "#4A8C6F", default: "#7A6E68",
};

function dashboardHref(p: PatientPickerRow): string {
  const { id, voiceScenario } = p;
  return voiceScenario && voiceScenario !== id
    ? `/dashboard?scenario=${encodeURIComponent(voiceScenario)}&mrn=${encodeURIComponent(id)}`
    : `/dashboard?scenario=${encodeURIComponent(id)}`;
}

function myCareHref(p: PatientPickerRow): string {
  if (/^\d+$/.test(p.id)) return `/my-care?mrn=${encodeURIComponent(p.id)}`;
  return `/my-care?scenario=${encodeURIComponent(p.voiceScenario)}`;
}

export default function PatientsDashboardShell({ patients }: { patients: PatientPickerRow[] }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(patients[0]?.id ?? "");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.note.toLowerCase().includes(q) ||
        p.lang.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
    );
  }, [patients, query]);

  const selected = patients.find((p) => p.id === selectedId) ?? patients[0];
  const scenario = selected ? getScenario(selected.voiceScenario) : getScenario("maria");
  const voiceData = scenario.voiceData;
  const displayName = selected?.name ?? "—";
  const displayMrn = selected?.id ?? "—";
  const displayDiagnosis = selected?.note ?? "—";
  const displayLang = selected?.lang ?? "—";
  const displayLangCode = selected?.langCode ?? "en";
  const initials = selected?.initials ?? "?";
  const avatarColor = LANG_COLORS[displayLangCode] ?? LANG_COLORS.default;

  const comp = 0;

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        background: "var(--bg-base)",
        fontFamily: "var(--font-body)",
        overflow: "hidden",
      }}
    >
      {/* Sidebar — same as dashboard */}
      <aside
        style={{
          width: 256,
          flexShrink: 0,
          background: "#1F1A16",
          display: "flex",
          flexDirection: "column",
          padding: "24px 18px",
          overflow: "hidden",
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
            flexShrink: 0,
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
            Care
            <span
              style={{
                fontStyle: "normal",
                fontFamily: "var(--font-body)",
                fontWeight: 300,
                color: "var(--accent-warm)",
              }}
            >
              Call
            </span>
          </span>
        </Link>

        <div
          style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.1em",
            color: "rgba(240,235,227,0.35)",
            textTransform: "uppercase",
            marginBottom: 10,
            flexShrink: 0,
          }}
        >
          All patients
        </div>

        <div style={{ flex: 1, overflowY: "auto", marginBottom: 12, marginRight: -6, paddingRight: 6 }}>
          {filtered.map((p) => {
            const active = p.id === selectedId;
            const ac = LANG_COLORS[p.langCode] ?? LANG_COLORS.default;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 10px",
                  marginBottom: 6,
                  borderRadius: 12,
                  border: active ? `1px solid ${ac}55` : "1px solid rgba(255,255,255,0.08)",
                  background: active ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                  cursor: "pointer",
                  textAlign: "left",
                  color: "inherit",
                  font: "inherit",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.06)",
                    border: `2px solid ${ac}40`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 600,
                      fontSize: 12,
                      color: ac,
                    }}
                  >
                    {p.initials}
                  </span>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 13,
                      fontWeight: 400,
                      color: "rgba(240,235,227,0.95)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: "rgba(240,235,227,0.35)",
                      marginTop: 2,
                    }}
                  >
                    {p.emoji ? `${p.emoji} ` : ""}
                    {p.lang}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Status card — picker idle */}
        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: "14px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: 12,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.1em",
                color: "rgba(240,235,227,0.35)",
                textTransform: "uppercase",
              }}
            >
              Queue
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.07em",
                color: "rgba(240,235,227,0.4)",
              }}
            >
              {patients.length} READY
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.1em",
                color: "rgba(240,235,227,0.35)",
                textTransform: "uppercase",
              }}
            >
              Filtered
            </span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 18,
                fontWeight: 300,
                color: "rgba(240,235,227,0.9)",
              }}
            >
              {filtered.length}
            </span>
          </div>
        </div>

        <div style={{ flexShrink: 0 }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontFamily: "var(--font-body)",
              fontSize: 11,
              fontWeight: 400,
              color: "rgba(240,235,227,0.3)",
              textDecoration: "none",
              padding: "8px 0",
            }}
          >
            ← Home
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Clinical header — matches dashboard */}
        <div
          style={{
            background: "var(--surface-raised)",
            boxShadow: "0 2px 12px var(--shadow-dark)",
            borderBottom: "1px solid var(--shadow-dark)",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            gap: 20,
            flexShrink: 0,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "var(--surface-inset)",
                boxShadow:
                  "inset 3px 3px 7px var(--shadow-dark), inset -3px -3px 7px var(--shadow-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: 12,
                  color: avatarColor,
                }}
              >
                {initials}
              </span>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: 13,
                  color: "var(--text-primary)",
                }}
              >
                {displayName}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 300,
                  fontSize: 10,
                  color: "var(--text-tertiary)",
                }}
              >
                {displayDiagnosis}
              </div>
            </div>
          </div>

          <div style={{ width: 1, height: 32, background: "var(--shadow-dark)", opacity: 0.7 }} />

          {[
            { label: "Language", value: displayLang },
            { label: "MRN", value: displayMrn },
            { label: "Preview", value: "Picker" },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.09em",
                  textTransform: "uppercase",
                  color: "var(--text-tertiary)",
                }}
              >
                {label}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                }}
              >
                {value}
              </span>
            </div>
          ))}

          <div style={{ flex: 1, minWidth: 120 }} />

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients…"
            aria-label="Search patients"
            style={{
              width: 200,
              maxWidth: "100%",
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid var(--shadow-dark)",
              background: "var(--surface-inset)",
              boxShadow:
                "inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light)",
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "var(--text-primary)",
              outline: "none",
            }}
          />

          <div
            style={{
              width: 160,
              height: 36,
              background: "var(--surface-inset)",
              boxShadow:
                "inset 2px 2px 6px var(--shadow-dark), inset -2px -2px 6px var(--shadow-light)",
              borderRadius: 8,
              overflow: "hidden",
              padding: "4px 8px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Waveform isActive={false} height={28} />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: "var(--surface-inset)",
              boxShadow:
                "inset 3px 3px 7px var(--shadow-dark), inset -3px -3px 7px var(--shadow-light)",
              borderRadius: 999,
              padding: "7px 14px",
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--text-tertiary)",
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "var(--text-tertiary)",
              }}
            >
              STANDBY
            </span>
          </div>
        </div>

        <div
          style={{
            padding: "12px 20px 10px",
            flexShrink: 0,
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 10,
          }}
          className="patients-dash-metrics"
        >
          {(
            [
              ["Selected patient", displayName, displayDiagnosis.slice(0, 36)],
              ["MRN", displayMrn, "Medical record"],
              ["Language", displayLang, displayLangCode.toUpperCase()],
              ["Queue", String(patients.length), "patients ready"],
              ["Filtered", String(filtered.length), "search results"],
              ["Voice scenario", selected?.voiceScenario ?? "—", "dashboard routing"],
            ] as const
          ).map(([label, value, sub]) => (
            <div
              key={label}
              style={{
                background: "var(--surface-raised)",
                boxShadow: "4px 4px 10px var(--shadow-dark), -4px -4px 10px var(--shadow-light)",
                borderRadius: 12,
                padding: "10px 12px",
                minHeight: 62,
              }}
            >
              <div
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: "0.09em",
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginTop: 4,
                  lineHeight: 1.25,
                  wordBreak: "break-word",
                }}
              >
                {value}
              </div>
              <div style={{ fontSize: 9, color: "var(--text-tertiary)", marginTop: 3 }}>{sub}</div>
            </div>
          ))}
          <style>{`
            @media (max-width: 900px) {
              .patients-dash-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
            }
          `}</style>
        </div>

        {/* Workspace grid — same proportions as dashboard */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px 20px 24px",
            display: "grid",
            gridTemplateColumns: "2fr 4fr 2fr",
            gap: 16,
            alignItems: "start",
          }}
          className="patients-dash-grid"
        >
          <style>{`
            @media (max-width: 1100px) {
              .patients-dash-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>

          {/* Left — Call coverage + flags (idle) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <section
              style={{
                background: "var(--surface-raised)",
                boxShadow: "6px 6px 14px var(--shadow-dark), -6px -6px 14px var(--shadow-light)",
                borderRadius: 16,
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: 300,
                  fontSize: 14,
                  color: "var(--text-primary)",
                  alignSelf: "flex-start",
                }}
              >
                Call Coverage
              </h2>
              <RadialSpoke completedSteps={[]} currentStep={null} />
              <div style={{ width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      color: "var(--text-tertiary)",
                      textTransform: "uppercase",
                    }}
                  >
                    Comprehension
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "var(--text-tertiary)",
                    }}
                  >
                    {comp}%
                  </span>
                </div>
                <div
                  style={{
                    background: "var(--surface-inset)",
                    boxShadow:
                      "inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light)",
                    borderRadius: 999,
                    height: 6,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 999,
                      width: `${comp}%`,
                      background: "var(--text-tertiary)",
                      transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
                    }}
                  />
                </div>
              </div>
              <p
                style={{
                  fontSize: 10,
                  color: "var(--text-tertiary)",
                  textAlign: "center",
                  marginTop: 4,
                  fontStyle: "italic",
                }}
              >
                Open the live dashboard to run a call and fill this view.
              </p>
            </section>

            <section
              style={{
                background: "var(--surface-raised)",
                boxShadow: "6px 6px 14px var(--shadow-dark), -6px -6px 14px var(--shadow-light)",
                borderRadius: 16,
                padding: "16px",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: 300,
                  fontSize: 14,
                  color: "var(--text-primary)",
                  marginBottom: 12,
                }}
              >
                Clinical Flags
              </h2>
              <div
                style={{
                  background: "var(--surface-inset)",
                  boxShadow:
                    "inset 3px 3px 7px var(--shadow-dark), inset -3px -3px 7px var(--shadow-light)",
                  borderRadius: 12,
                  padding: "20px",
                  textAlign: "center",
                  fontSize: 11,
                  color: "var(--text-tertiary)",
                  fontStyle: "italic",
                }}
              >
                No concerns flagged
              </div>
            </section>
          </div>

          {/* Center — CTAs */}
          <section
            style={{
              background: "var(--surface-raised)",
              boxShadow: "6px 6px 14px var(--shadow-dark), -6px -6px 14px var(--shadow-light)",
              borderRadius: 16,
              padding: "24px 28px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 300,
                fontSize: 18,
                color: "var(--text-primary)",
              }}
            >
              Open live session
            </h2>
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.55,
                color: "var(--text-secondary)",
                fontWeight: 300,
              }}
            >
              This layout matches the monitoring dashboard for{" "}
              <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>{displayName}</strong>.
              Start the voice agent, transcript, and checklist on the full dashboard.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {selected ? (
                <>
                  <Link
                    href={dashboardHref(selected)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "12px 22px",
                      borderRadius: 999,
                      background: "var(--clinical-blue)",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: "none",
                      boxShadow: "0 2px 8px rgba(0, 94, 184, 0.25)",
                    }}
                  >
                    Open dashboard →
                  </Link>
                  <Link
                    href={myCareHref(selected)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "12px 22px",
                      borderRadius: 999,
                      background: "var(--surface-inset)",
                      boxShadow:
                        "inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light)",
                      color: "var(--text-primary)",
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: "none",
                      border: "1px solid var(--shadow-dark)",
                    }}
                  >
                    Patient portal
                  </Link>
                </>
              ) : null}
            </div>
          </section>

          {/* Right — Med checklist preview for selected scenario */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <section
              style={{
                background: "var(--surface-raised)",
                boxShadow: "6px 6px 14px var(--shadow-dark), -6px -6px 14px var(--shadow-light)",
                borderRadius: 16,
                padding: "16px",
              }}
            >
              <MedChecklist voiceData={voiceData} completedSteps={[]} transcript={[]} />
            </section>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
