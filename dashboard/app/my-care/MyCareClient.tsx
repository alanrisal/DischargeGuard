"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import ComprehensionTranscript from "@/components/dashboard/ComprehensionTranscript";
import MedChecklist from "@/components/dashboard/MedChecklist";
import Waveform from "@/components/dashboard/Waveform";
import { MY_CARE_PORTAL_LINKS } from "@/lib/myCareSlugs";
import { getScenario } from "@/lib/scenarioData";
import { usePatientData } from "@/lib/usePatientData";
import type { TranscriptEntry } from "@/lib/useVoiceAgent";

const VoiceAssistantSection = dynamic(() => import("./VoiceAssistantSection"), {
  ssr: false,
  loading: () => <p style={{ color: "var(--text-tertiary)", fontSize: 12, padding: "8px 0" }}>Loading voice…</p>,
});

const LANG_COLORS: Record<string, string> = {
  es: "#C2714F", zh: "#3B6FA0", en: "#4A8C6F", default: "#7A6E68",
};

function parseCareDate(s: string): Date | null {
  const t = s?.trim();
  if (!t) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const d = new Date(`${t}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatMonthYear(y: number, m: number): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(y, m, 1));
}

function calendarKindLabel(kind: "discharge" | "followup" | "visit"): string {
  if (kind === "discharge") return "Discharge";
  if (kind === "followup") return "Follow-up";
  return "Visit";
}

// Simple transcript parsing
function parseTranscriptString(s: string): TranscriptEntry[] {
  return s.split("\n").filter(Boolean).map((line, i) => ({
    id: i,
    role: line.startsWith("ALEX:") ? "agent" : "user",
    text: line.replace(/^(ALEX|PT):\s*/, ""),
  }));
}

type CalendarEventRow = { id: string; d: Date; title: string; detail: string; kind: "discharge" | "followup" | "visit" };
type CareTab = "discharge" | "calendar" | "call" | "transcript" | "record";

type Props = { initialScenarioId: string; patientPortal?: boolean };

export default function MyCareClient({ initialScenarioId, patientPortal = false }: Props) {
  const [tab, setTab] = useState<CareTab>("discharge");
  const scenarioId = initialScenarioId;
  const scenario = useMemo(() => getScenario(scenarioId), [scenarioId]);
  const vd = scenario.voiceData;
  const { prescriptions, visits, calls, source } = usePatientData(scenarioId);
  const [liveTranscript, setLiveTranscript] = useState<TranscriptEntry[]>([]);
  const [callLive, setCallLive] = useState(false);
  const [calYM, setCalYM] = useState<{ y: number; m: number }>(() => {
    const d = parseCareDate(vd.patient.discharge_date) ?? new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  useEffect(() => {
    setLiveTranscript([]);
    setCallLive(false);
    setTab("discharge");
    const d = parseCareDate(vd.patient.discharge_date);
    if (d) setCalYM({ y: d.getFullYear(), m: d.getMonth() });
  }, [scenarioId, vd.patient.discharge_date]);

  const onCallStart = useCallback(() => { setCallLive(true); setLiveTranscript([]); }, []);
  const onCallEnd = useCallback((data: { completedSteps: string[]; flaggedWarnings: { sign: string; severity: string }[]; transcript: string }) => {
    setCallLive(false);
    if (data.transcript?.trim()) setLiveTranscript(parseTranscriptString(data.transcript));
  }, []);

  const displayTranscript = useMemo(() => {
    if (callLive) return liveTranscript;
    const db = (calls[0] as any)?.transcript;
    if (db?.trim()) return parseTranscriptString(db);
    if (liveTranscript.length > 0) return liveTranscript;
    return [];
  }, [callLive, liveTranscript, calls]);

  const initials = scenario.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const avatarColor = LANG_COLORS[scenario.language_code] ?? LANG_COLORS.default;

  const sectionTitle: CSSProperties = { fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300, fontSize: 12, color: "var(--text-primary)", marginBottom: 8 };
  const bodyText: CSSProperties = { fontSize: 12, lineHeight: 1.5, color: "var(--text-secondary)" };
  const panelStyle: CSSProperties = { background: "var(--surface-raised)", boxShadow: "6px 6px 14px var(--shadow-dark), -6px -6px 14px var(--shadow-light)", borderRadius: 14, padding: "16px 18px", minHeight: 320 };

  const calendarEvents = useMemo((): CalendarEventRow[] => {
    const out: Omit<CalendarEventRow, "id">[] = [];
    const dis = parseCareDate(vd.patient.discharge_date);
    if (dis) out.push({ d: dis, title: "Hospital discharge", detail: vd.hospital.name, kind: "discharge" });
    vd.follow_ups.forEach((f) => {
      const d = parseCareDate(f.date);
      if (d) out.push({ d, title: f.provider, detail: `${f.time} · ${f.purpose}`, kind: "followup" });
    });
    visits.forEach((v) => {
      const d = parseCareDate(v.date);
      if (d) out.push({ d, title: v.type, detail: [v.provider, v.department, v.notes].filter(Boolean).join(" · "), kind: "visit" });
    });
    return out.sort((a, b) => a.d.getTime() - b.d.getTime()).map((e, i) => ({ ...e, id: `evt-${i}` }));
  }, [vd, visits]);

  const monthEvents = useMemo(() => calendarEvents.filter((e) => e.d.getFullYear() === calYM.y && e.d.getMonth() === calYM.m), [calendarEvents, calYM]);

  const tabs: { id: CareTab; label: string }[] = [
    { id: "discharge", label: "Discharge" },
    { id: "calendar", label: "Calendar" },
    { id: "call", label: "Call" },
    { id: "transcript", label: "Transcript" },
    { id: "record", label: "My record" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", fontFamily: "var(--font-body)", overflowX: "hidden", overflowY: "auto" }}>
      <main style={{ display: "flex", flexDirection: "column", minWidth: 0, maxWidth: "100%", overflow: "visible" }}>

        {/* Header */}
        <div style={{ background: "var(--surface-raised)", boxShadow: "0 2px 12px var(--shadow-dark)", borderBottom: "1px solid var(--shadow-dark)", padding: "10px 18px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", flexShrink: 0 }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ width: 28, height: 28, background: "var(--surface-inset)", border: "1px solid var(--shadow-dark)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 12, color: "var(--accent-warm)", fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 600 }}>C</span>
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300, fontSize: 13, color: "var(--text-primary)" }}>
              Care<span style={{ fontStyle: "normal", color: "var(--accent-warm)" }}>Call</span>
            </span>
          </Link>

          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: patientPortal ? "var(--accent-success)" : "var(--text-tertiary)", textTransform: "uppercase" }}>
            {patientPortal ? "Patient" : "My care"}
          </span>

          <div style={{ width: 1, height: 28, background: "var(--shadow-dark)", opacity: 0.7 }} />

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--surface-inset)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 11, color: avatarColor }}>{initials}</span>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{scenario.name}</div>
              <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>MRN {scenario.mrn} · {scenario.language_code.toUpperCase()}</div>
            </div>
          </div>

          {!patientPortal && (
            <nav style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
              {MY_CARE_PORTAL_LINKS.map(({ href, label, scenario: sid }) => {
                const active = sid === scenarioId;
                return (
                  <Link key={href} href={href} style={{ fontSize: 10, fontWeight: 600, padding: "5px 10px", borderRadius: 999, border: active ? "1px solid var(--accent-clinical)" : "1px solid var(--shadow-dark)", background: active ? "var(--accent-clinical-light)" : "transparent", textDecoration: "none", color: "var(--text-primary)" }}>
                    {label.split(" ")[0]}
                  </Link>
                );
              })}
            </nav>
          )}

          <div style={{ flex: 1, minWidth: 8 }} />

          <div style={{ width: 140, height: 32, background: "var(--surface-inset)", borderRadius: 8, padding: "2px 6px", display: "flex", alignItems: "center" }}>
            <Waveform isActive={callLive} height={24} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface-inset)", borderRadius: 999, padding: "6px 12px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: callLive ? "var(--accent-success)" : "var(--text-tertiary)", animation: callLive ? "pulse-dot 1.5s ease-in-out infinite" : undefined }} />
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", color: callLive ? "var(--accent-success)" : "var(--text-tertiary)" }}>
              {callLive ? "CALL LIVE" : "STANDBY"}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "12px 16px 32px", maxWidth: 720, margin: "0 auto", width: "100%" }}>
          {/* Tab bar */}
          <div role="tablist" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14, padding: 6, background: "var(--surface-inset)", borderRadius: 14, boxShadow: "inset 2px 2px 6px var(--shadow-dark), inset -2px -2px 6px var(--shadow-light)" }}>
            {tabs.map(({ id, label }) => {
              const active = tab === id;
              return (
                <button key={id} type="button" role="tab" aria-selected={active} onClick={() => setTab(id)} style={{ flex: "1 1 auto", minWidth: 72, padding: "10px 12px", borderRadius: 10, border: active ? "1px solid var(--accent-clinical)" : "1px solid transparent", background: active ? "var(--surface-raised)" : "transparent", boxShadow: active ? "2px 2px 8px var(--shadow-dark)" : "none", fontFamily: "var(--font-body)", fontSize: 12, fontWeight: active ? 600 : 500, color: active ? "var(--text-primary)" : "var(--text-tertiary)", cursor: "pointer" }}>
                  {label}
                </button>
              );
            })}
          </div>

          {/* Discharge tab */}
          {tab === "discharge" && (
            <div style={{ ...panelStyle, display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div style={{ ...sectionTitle, marginBottom: 10 }}>💊 Medications</div>
                <ul style={{ ...bodyText, listStyle: "none", padding: 0, margin: 0 }}>
                  {vd.medications.map((m, i) => (
                    <li key={i} style={{ padding: "10px 0", borderBottom: i < vd.medications.length - 1 ? "1px solid var(--shadow-dark)" : undefined }}>
                      <strong style={{ color: "var(--text-primary)" }}>{m.name}</strong>
                      <div style={{ fontSize: 11, marginTop: 4, color: "var(--text-tertiary)" }}>{m.dose} · {m.frequency}</div>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div style={{ ...sectionTitle, marginBottom: 10 }}>🩺 Activity & wound care</div>
                <div style={bodyText}>
                  {vd.activity_restrictions.map((t, i) => <div key={i} style={{ marginBottom: 8 }}>• {t}</div>)}
                  {vd.wound_care.map((t, i) => <div key={`w${i}`} style={{ marginBottom: 8 }}>• {t}</div>)}
                </div>
              </div>
              <div style={{ borderLeft: "3px solid var(--warning-red)", paddingLeft: 12 }}>
                <div style={{ ...sectionTitle, color: "var(--warning-red)", marginBottom: 10 }}>⚠️ When to get help</div>
                <ul style={{ ...bodyText, margin: 0, paddingLeft: 16 }}>
                  {vd.warning_signs.map((t, i) => <li key={i} style={{ marginBottom: 6 }}>{t}</li>)}
                </ul>
              </div>
            </div>
          )}

          {/* Calendar tab */}
          {tab === "calendar" && (
            <div style={{ ...panelStyle, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <button type="button" onClick={() => setCalYM(({ y, m }) => { const nm = m - 1; return nm < 0 ? { y: y - 1, m: 11 } : { y, m: nm }; })} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--shadow-dark)", background: "var(--surface-inset)", cursor: "pointer", color: "var(--text-primary)", fontSize: 16 }}>‹</button>
                <div style={{ ...sectionTitle, marginBottom: 0, textAlign: "center", flex: 1 }}>📅 {formatMonthYear(calYM.y, calYM.m)}</div>
                <button type="button" onClick={() => setCalYM(({ y, m }) => { const nm = m + 1; return nm > 11 ? { y: y + 1, m: 0 } : { y, m: nm }; })} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--shadow-dark)", background: "var(--surface-inset)", cursor: "pointer", color: "var(--text-primary)", fontSize: 16 }}>›</button>
              </div>
              <div>
                <div style={{ ...sectionTitle, marginBottom: 8 }}>This month</div>
                {monthEvents.length === 0 ? (
                  <p style={{ ...bodyText, fontStyle: "italic", color: "var(--text-tertiary)", margin: 0 }}>No events this month.</p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, ...bodyText }}>
                    {monthEvents.map((e, i) => (
                      <li key={e.id} style={{ padding: "10px 0", borderBottom: i < monthEvents.length - 1 ? "1px solid var(--shadow-dark)" : undefined }}>
                        <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginBottom: 4 }}>{e.d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {calendarKindLabel(e.kind)}</div>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{e.title}</div>
                        <div style={{ fontSize: 11, marginTop: 2, color: "var(--text-secondary)" }}>{e.detail}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Call tab */}
          {tab === "call" && (
            <div style={panelStyle}>
              <div style={{ ...sectionTitle, marginBottom: 10 }}>🎙️ Care assistant</div>
              <p style={{ fontSize: 12, color: "var(--text-tertiary)", lineHeight: 1.45, marginBottom: 12 }}>
                Not for emergencies — call 911 for severe symptoms.
              </p>
              <VoiceAssistantSection scenarioId={scenarioId} vd={vd} onTranscriptChange={setLiveTranscript} onCallStart={onCallStart} onCallEnd={onCallEnd} />
            </div>
          )}

          {/* Transcript tab */}
          {tab === "transcript" && (
            <div style={{ ...panelStyle, display: "flex", flexDirection: "column", minHeight: 420 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: 10 }}>
                {callLive ? "Live" : displayTranscript.length > 0 ? "Last session" : "No transcript yet"}
              </div>
              <div style={{ flex: 1, minHeight: 360, display: "flex", flexDirection: "column" }}>
                <ComprehensionTranscript transcript={displayTranscript} isConnected={callLive} isPhoneMode={false} />
              </div>
            </div>
          )}

          {/* Record tab */}
          {tab === "record" && (
            <div style={{ ...panelStyle, display: "flex", flexDirection: "column", gap: 22 }}>
              <div>
                <div style={{ ...sectionTitle, marginBottom: 10 }}>Call history</div>
                <div style={bodyText}>
                  {calls.length === 0 ? (
                    <span style={{ fontStyle: "italic", color: "var(--text-tertiary)" }}>No calls logged yet.</span>
                  ) : (
                    calls.map((c: any, i: number) => (
                      <div key={i} style={{ padding: "10px 0", borderBottom: i < calls.length - 1 ? "1px solid var(--shadow-dark)" : undefined }}>
                        <div style={{ fontWeight: 600 }}>{c.date} · {c.time}</div>
                        <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{c.duration} · {c.comprehension_score}%</div>
                        <div style={{ fontSize: 11, marginTop: 4 }}>{c.summary}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <div style={{ ...sectionTitle, marginBottom: 10 }}>Prescriptions</div>
                <div style={bodyText}>
                  {prescriptions.length === 0 ? (
                    <span style={{ fontStyle: "italic", color: "var(--text-tertiary)" }}>No prescriptions on file.</span>
                  ) : (
                    prescriptions.map((rx: any, i: number) => (
                      <div key={i} style={{ padding: "8px 0", borderBottom: i < prescriptions.length - 1 ? "1px solid var(--shadow-dark)" : undefined }}>
                        <strong>{rx.name}</strong>
                        <span style={{ fontSize: 11, color: "var(--text-tertiary)", marginLeft: 8 }}>· {rx.status}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <MedChecklist voiceData={vd} completedSteps={[]} transcript={displayTranscript} />
            </div>
          )}
        </div>
      </main>
      <style>{`@keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}
