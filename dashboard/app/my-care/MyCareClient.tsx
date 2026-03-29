"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import ComprehensionTranscript from "@/components/dashboard/ComprehensionTranscript";
import MedChecklist from "@/components/dashboard/MedChecklist";
import Waveform from "@/components/dashboard/Waveform";
import { MY_CARE_PORTAL_LINKS } from "@/lib/myCareSlugs";
import { parseTranscriptString, subtitlesToTranscriptEntries } from "@/lib/parseCallTranscript";
import { getScenario } from "@/lib/scenarioData";
import { usePatientData } from "@/lib/usePatientData";
import type { TranscriptEntry } from "@/lib/useVoiceAgent";
import { AlertTriangle, Calendar, ExternalLink, Mic, Pill, Stethoscope } from "lucide-react";

const VoiceAssistantSection = dynamic(() => import("./VoiceAssistantSection"), {
  ssr: false,
  loading: () => (
    <p style={{ color: "var(--text-tertiary)", fontSize: 12, padding: "8px 0" }}>Loading voice…</p>
  ),
});

const LANG_COLORS: Record<string, string> = {
  es: "#C2714F",
  zh: "#3B6FA0",
  en: "#4A8C6F",
  default: "#7A6E68",
};

type Props = {
  initialScenarioId: string;
};

export default function MyCareClient({ initialScenarioId }: Props) {
  const scenarioId = initialScenarioId;
  const scenario = useMemo(() => getScenario(scenarioId), [scenarioId]);
  const vd = scenario.voiceData;
  const { prescriptions, visits, calls, source, refetch } = usePatientData(scenarioId);

  const [liveTranscript, setLiveTranscript] = useState<TranscriptEntry[]>([]);
  const [callLive, setCallLive] = useState(false);
  const [fetchedElevenLabsTranscript, setFetchedElevenLabsTranscript] = useState<string | null>(null);

  useEffect(() => {
    setLiveTranscript([]);
    setCallLive(false);
    setFetchedElevenLabsTranscript(null);
  }, [scenarioId]);

  const topCall = calls[0];
  const topCallId = topCall?.date && topCall?.time ? `${topCall.date}-${topCall.time}` : "";

  useEffect(() => {
    setFetchedElevenLabsTranscript(null);
  }, [topCallId, scenarioId]);

  useEffect(() => {
    const convId = topCall?.elevenlabs_conversation_id?.trim();
    if (!convId || topCall?.transcript?.trim()) return;

    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/elevenlabs-transcript?id=${encodeURIComponent(convId)}`);
        if (!r.ok || cancelled) return;
        const data = (await r.json()) as { transcript?: string | null };
        if (cancelled || !data.transcript?.trim()) return;
        setFetchedElevenLabsTranscript(data.transcript);
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [topCall?.elevenlabs_conversation_id, topCall?.transcript, topCallId]);

  const onCallStart = useCallback(() => {
    setCallLive(true);
    setLiveTranscript([]);
  }, []);

  const onCallEnd = useCallback(
    (data: { completedSteps: string[]; flaggedWarnings: { sign: string; severity: string }[]; transcript: string }) => {
      setCallLive(false);
      if (data.transcript?.trim()) {
        setLiveTranscript(parseTranscriptString(data.transcript));
      }
      refetch();
    },
    [refetch]
  );

  const transcriptSourceLabel = useMemo(() => {
    if (callLive) return "Live";
    if (topCall?.transcript?.trim()) return "Saved";
    if (fetchedElevenLabsTranscript?.trim()) return "From call (ElevenLabs)";
    if (liveTranscript.length > 0) return "Last session";
    return "Demo preview";
  }, [callLive, topCall?.transcript, fetchedElevenLabsTranscript, liveTranscript.length]);

  /** Shown on the semantic timeline (date/time the call occurred, or live/session). */
  const transcriptCallTimeLabel = useMemo(() => {
    if (callLive) return "In progress";
    if (topCall?.date && topCall?.time) {
      const dur = topCall.duration?.trim();
      const when = `${topCall.date} · ${topCall.time}`;
      if (dur && dur !== "0:00") return `${when} · ${dur}`;
      return when;
    }
    if (liveTranscript.length > 0) return "This session (just now)";
    return null;
  }, [callLive, topCall?.date, topCall?.time, topCall?.duration, liveTranscript.length]);

  const displayTranscript = useMemo(() => {
    if (callLive) return liveTranscript;
    const db = topCall?.transcript;
    if (db?.trim()) return parseTranscriptString(db);
    const el = fetchedElevenLabsTranscript;
    if (el?.trim()) return parseTranscriptString(el);
    if (liveTranscript.length > 0) return liveTranscript;
    return subtitlesToTranscriptEntries(scenarioId);
  }, [callLive, liveTranscript, topCall?.transcript, fetchedElevenLabsTranscript, scenarioId]);

  const initials = scenario.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const avatarColor = LANG_COLORS[scenario.language_code] ?? LANG_COLORS.default;

  const sectionTitle: CSSProperties = {
    fontFamily: "var(--font-display)",
    fontStyle: "italic",
    fontWeight: 300,
    fontSize: 12,
    color: "var(--text-primary)",
    marginBottom: 8,
  };

  const compactScroll: CSSProperties = {
    maxHeight: "min(200px, 28vh)",
    overflowY: "auto",
    fontSize: 11,
    lineHeight: 1.45,
    color: "var(--text-secondary)",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "flex-start",
        background: "var(--bg-base)",
        fontFamily: "var(--font-body)",
        overflowX: "hidden",
        overflowY: "auto",
      }}
    >
      <aside
        style={{
          width: 212,
          flexShrink: 0,
          background: "#1F1A16",
          display: "flex",
          flexDirection: "column",
          padding: "14px 10px 18px 6px",
          overflowY: "auto",
          alignSelf: "stretch",
        }}
      >
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
          <div
            style={{
              width: 28,
              height: 28,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: 12,
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
              fontSize: 13,
              color: "rgba(240,235,227,0.9)",
            }}
          >
            Care<span style={{ fontStyle: "normal", color: "var(--accent-warm)" }}>Call</span>
          </span>
        </Link>

        <div
          style={{
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: "rgba(240,235,227,0.35)",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          My care portal
        </div>

        <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(240,235,227,0.28)", marginBottom: 8 }}>
          Profiles
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
          {MY_CARE_PORTAL_LINKS.map(({ href, label, scenario: sid }) => {
            const active = sid === scenarioId;
            return (
              <Link
                key={href}
                href={href}
                style={{
                  fontSize: 12,
                  fontWeight: active ? 600 : 500,
                  color: active ? "rgba(240,235,227,0.95)" : "rgba(240,235,227,0.45)",
                  textDecoration: "none",
                  padding: "8px 10px",
                  borderRadius: 10,
                  background: active ? "rgba(255,255,255,0.08)" : "transparent",
                  border: active ? "1px solid rgba(194,113,79,0.35)" : "1px solid transparent",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              border: `2px solid ${avatarColor}55`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20, color: avatarColor }}>{initials}</span>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "rgba(240,235,227,0.95)" }}>{scenario.name}</div>
            <div style={{ fontSize: 9, color: "rgba(240,235,227,0.35)", marginTop: 4 }}>MRN {scenario.mrn}</div>
          </div>
        </div>

        {[
          { label: scenario.diagnosis.split(",")[0].trim(), color: "rgba(240,235,227,0.55)" },
          { label: `${scenario.language_code.toUpperCase()} · ${scenario.language}`, color: "var(--accent-success)" },
        ].map((tag, i) => (
          <div
            key={i}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 999,
              padding: "5px 10px",
              fontSize: 9,
              fontWeight: 500,
              color: tag.color,
              textAlign: "center",
              marginBottom: 6,
            }}
          >
            {tag.label}
          </div>
        ))}

        <div style={{ flex: 1 }} />

        <Link
          href="/patients"
          style={{
            fontSize: 11,
            color: "rgba(240,235,227,0.35)",
            textDecoration: "none",
            padding: "6px 0",
          }}
        >
          ← All patients
        </Link>
        <Link
          href={`/dashboard?scenario=${encodeURIComponent(scenarioId)}`}
          style={{
            fontSize: 11,
            color: "rgba(240,235,227,0.35)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 0",
          }}
        >
          Clinical dashboard <ExternalLink size={12} />
        </Link>
      </aside>

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          maxWidth: "100%",
          overflow: "visible",
        }}
      >
        <div
          style={{
            background: "var(--surface-raised)",
            boxShadow: "0 2px 12px var(--shadow-dark)",
            borderBottom: "1px solid var(--shadow-dark)",
            padding: "10px 18px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--surface-inset)",
                boxShadow: "inset 2px 2px 6px var(--shadow-dark), inset -2px -2px 6px var(--shadow-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 11, color: avatarColor }}>{initials}</span>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{scenario.name}</div>
              <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{vd.hospital.name}</div>
            </div>
          </div>
          <div style={{ width: 1, height: 28, background: "var(--shadow-dark)", opacity: 0.7 }} />
          <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>
            Records: <strong style={{ color: "var(--text-secondary)" }}>{source === "supabase" ? "Hospital" : "Demo"}</strong>
          </div>
          <div style={{ flex: 1 }} />
          <div
            style={{
              width: 140,
              height: 32,
              background: "var(--surface-inset)",
              boxShadow: "inset 2px 2px 6px var(--shadow-dark), inset -2px -2px 6px var(--shadow-light)",
              borderRadius: 8,
              padding: "2px 6px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Waveform isActive={callLive} height={24} />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "var(--surface-inset)",
              boxShadow: "inset 2px 2px 6px var(--shadow-dark), inset -2px -2px 6px var(--shadow-light)",
              borderRadius: 999,
              padding: "6px 12px",
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: callLive ? "var(--accent-success)" : "var(--text-tertiary)",
                animation: callLive ? "pulse-dot 1.5s ease-in-out infinite" : undefined,
              }}
            />
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: callLive ? "var(--accent-success)" : "var(--text-tertiary)",
              }}
            >
              {callLive ? "CALL LIVE" : "STANDBY"}
            </span>
          </div>
        </div>

        {/* Workspace — natural height (no forced fill); page scrolls if needed */}
        <div
          style={{
            padding: "10px 14px 24px",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(260px, 1.1fr) minmax(0, 1fr)",
            gap: 12,
            alignItems: "start",
          }}
          className="my-care-upper"
        >
          <style>{`
            @media (max-width: 1100px) {
              .my-care-upper { grid-template-columns: 1fr !important; }
            }
          `}</style>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <section
              style={{
                background: "var(--surface-raised)",
                boxShadow: "6px 6px 14px var(--shadow-dark), -6px -6px 14px var(--shadow-light)",
                borderRadius: 14,
                padding: "12px",
              }}
            >
              <div style={{ ...sectionTitle, display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Pill size={14} color="var(--accent-clinical)" /> Discharge meds
              </div>
              <ul style={{ ...compactScroll, listStyle: "none", padding: 0, margin: 0 }}>
                {vd.medications.map((m, i) => (
                  <li
                    key={i}
                    style={{
                      padding: "6px 0",
                      borderBottom: i < vd.medications.length - 1 ? "1px solid var(--shadow-dark)" : undefined,
                    }}
                  >
                    <strong style={{ color: "var(--text-primary)" }}>{m.name}</strong>
                    <div style={{ fontSize: 10, marginTop: 2 }}>
                      {m.dose} · {m.frequency}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section
              style={{
                background: "var(--surface-raised)",
                boxShadow: "6px 6px 14px var(--shadow-dark), -6px -6px 14px var(--shadow-light)",
                borderRadius: 14,
                padding: "12px",
              }}
            >
              <div style={{ ...sectionTitle, display: "flex", alignItems: "center", gap: 6 }}>
                <Stethoscope size={14} color="var(--accent-clinical)" /> Activity & wound
              </div>
              <div style={compactScroll}>
                {vd.activity_restrictions.slice(0, 4).map((t, i) => (
                  <div key={i} style={{ marginBottom: 6 }}>
                    • {t}
                  </div>
                ))}
                {vd.wound_care.slice(0, 2).map((t, i) => (
                  <div key={`w${i}`} style={{ marginBottom: 6 }}>
                    • {t}
                  </div>
                ))}
              </div>
            </section>

            <section
              style={{
                background: "var(--surface-raised)",
                boxShadow: "6px 6px 14px var(--shadow-dark), -6px -6px 14px var(--shadow-light)",
                borderRadius: 14,
                padding: "12px",
                borderLeft: "3px solid var(--warning-red)",
              }}
            >
              <div style={{ ...sectionTitle, display: "flex", alignItems: "center", gap: 6, color: "var(--warning-red)" }}>
                <AlertTriangle size={14} /> When to get help
              </div>
              <ul style={{ ...compactScroll, margin: 0, paddingLeft: 14 }}>
                {vd.warning_signs.slice(0, 5).map((t, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>
                    {t}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <section
              style={{
                background: "var(--surface-raised)",
                boxShadow: "6px 6px 14px var(--shadow-dark), -6px -6px 14px var(--shadow-light)",
                borderRadius: 14,
                padding: "12px 14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Mic size={14} color="var(--accent-clinical)" />
                <span style={{ ...sectionTitle, marginBottom: 0 }}>Care assistant</span>
              </div>
              <p style={{ fontSize: 10, color: "var(--text-tertiary)", lineHeight: 1.4, marginBottom: 8 }}>
                Not for emergencies — call 911 for severe symptoms. Your transcript updates live while connected.
              </p>
              <VoiceAssistantSection
                scenarioId={scenarioId}
                vd={vd}
                onTranscriptChange={setLiveTranscript}
                onCallStart={onCallStart}
                onCallEnd={onCallEnd}
              />
            </section>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <section
              style={{
                background: "var(--surface-raised)",
                boxShadow: "6px 6px 14px var(--shadow-dark), -6px -6px 14px var(--shadow-light)",
                borderRadius: 14,
                padding: "12px",
              }}
            >
              <div style={{ ...sectionTitle, marginBottom: 6 }}>Call history</div>
              <div style={{ fontSize: 11, lineHeight: 1.45, color: "var(--text-secondary)" }}>
                {calls.length === 0 ? (
                  <span style={{ fontStyle: "italic", color: "var(--text-tertiary)" }}>No calls logged yet.</span>
                ) : (
                  calls.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "8px 0",
                        borderBottom: i < calls.length - 1 ? "1px solid var(--shadow-dark)" : undefined,
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 600 }}>
                        {c.date} · {c.time}
                      </div>
                      <div style={{ fontSize: 9, color: "var(--text-tertiary)" }}>
                        {c.duration} · {c.comprehension_score}%
                        {c.transcript ? " · transcript" : c.elevenlabs_conversation_id ? " · syncing…" : ""}
                      </div>
                      <div style={{ fontSize: 10, marginTop: 4, lineHeight: 1.45 }}>
                        {c.summary}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section
              style={{
                background: "var(--surface-raised)",
                boxShadow: "6px 6px 14px var(--shadow-dark), -6px -6px 14px var(--shadow-light)",
                borderRadius: 14,
                padding: "12px",
              }}
            >
              <div style={{ ...sectionTitle, marginBottom: 6 }}>Pharmacy</div>
              <div style={{ fontSize: 11, lineHeight: 1.45, color: "var(--text-secondary)" }}>
                {prescriptions.length === 0 ? (
                  <span style={{ fontStyle: "italic", color: "var(--text-tertiary)" }}>No prescriptions on file.</span>
                ) : (
                  prescriptions.map((rx, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "6px 0",
                        borderBottom: i < prescriptions.length - 1 ? "1px solid var(--shadow-dark)" : undefined,
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: 11 }}>{rx.name}</span>
                      <span style={{ fontSize: 9, color: "var(--text-tertiary)", marginLeft: 8 }}>· {rx.status}</span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section
              style={{
                background: "var(--surface-raised)",
                boxShadow: "6px 6px 14px var(--shadow-dark), -6px -6px 14px var(--shadow-light)",
                borderRadius: 14,
                padding: "12px 14px 14px",
                display: "flex",
                flexDirection: "column",
                minHeight: 220,
                maxHeight: "min(360px, 42vh)",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  marginBottom: 8,
                  flexShrink: 0,
                }}
              >
                Call transcript · {transcriptSourceLabel}
              </div>
              <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                <ComprehensionTranscript
                  transcript={displayTranscript}
                  isConnected={callLive}
                  isPhoneMode={false}
                  callTimeLabel={transcriptCallTimeLabel}
                />
              </div>
            </section>

            <section
              style={{
                background: "var(--surface-raised)",
                boxShadow: "6px 6px 14px var(--shadow-dark), -6px -6px 14px var(--shadow-light)",
                borderRadius: 14,
                padding: "12px",
              }}
            >
              <div style={{ ...sectionTitle, display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={14} color="var(--accent-clinical)" /> Follow-ups
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, ...compactScroll }}>
                {vd.follow_ups.map((f, i) => (
                  <li
                    key={i}
                    style={{
                      padding: "6px 0",
                      borderBottom: i < vd.follow_ups.length - 1 ? "1px solid var(--shadow-dark)" : undefined,
                    }}
                  >
                    <strong style={{ fontSize: 11 }}>{f.date}</strong> {f.time}
                    <div style={{ fontSize: 10 }}>{f.provider}</div>
                  </li>
                ))}
              </ul>
            </section>

            <section
              style={{
                background: "var(--surface-raised)",
                boxShadow: "6px 6px 14px var(--shadow-dark), -6px -6px 14px var(--shadow-light)",
                borderRadius: 14,
                padding: "12px",
              }}
            >
              <MedChecklist voiceData={vd} completedSteps={[]} transcript={displayTranscript} />
            </section>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
