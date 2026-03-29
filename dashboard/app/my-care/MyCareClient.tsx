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
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  History,
  Mic,
  Pill,
  Stethoscope,
} from "lucide-react";

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

type CalendarEventRow = {
  id: string;
  d: Date;
  title: string;
  detail: string;
  kind: "discharge" | "followup" | "visit";
};

type CalSelection =
  | { mode: "day"; y: number; m: number; day: number }
  | { mode: "event"; id: string };

type Props = {
  initialScenarioId: string;
  /** Simplified header for the patient path (/my-care/m) — no provider navigation. */
  patientPortal?: boolean;
};

type CareTab = "discharge" | "calendar" | "call" | "transcript" | "record";

export default function MyCareClient({ initialScenarioId, patientPortal = false }: Props) {
  const [tab, setTab] = useState<CareTab>("discharge");
  const scenarioId = initialScenarioId;
  const scenario = useMemo(() => getScenario(scenarioId), [scenarioId]);
  const vd = scenario.voiceData;
  const { prescriptions, visits, calls, source, refetch } = usePatientData(scenarioId);

  const [liveTranscript, setLiveTranscript] = useState<TranscriptEntry[]>([]);
  const [callLive, setCallLive] = useState(false);
  const [fetchedElevenLabsTranscript, setFetchedElevenLabsTranscript] = useState<string | null>(null);

  const [calYM, setCalYM] = useState<{ y: number; m: number }>(() => {
    const d = parseCareDate(vd.patient.discharge_date) ?? new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [calSelection, setCalSelection] = useState<CalSelection | null>(null);

  useEffect(() => {
    setLiveTranscript([]);
    setCallLive(false);
    setFetchedElevenLabsTranscript(null);
    setTab("discharge");
    const d = parseCareDate(vd.patient.discharge_date);
    if (d) setCalYM({ y: d.getFullYear(), m: d.getMonth() });
  }, [scenarioId, vd.patient.discharge_date]);

  useEffect(() => {
    setCalSelection(null);
  }, [scenarioId, calYM.y, calYM.m]);

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

  const bodyText: CSSProperties = {
    fontSize: 12,
    lineHeight: 1.5,
    color: "var(--text-secondary)",
  };

  const sortedVisitsDesc = useMemo(() => {
    return [...visits].sort((a, b) => {
      const da = parseCareDate(a.date)?.getTime() ?? 0;
      const db = parseCareDate(b.date)?.getTime() ?? 0;
      return db - da;
    });
  }, [visits]);

  const calendarEvents = useMemo((): CalendarEventRow[] => {
    const out: Omit<CalendarEventRow, "id">[] = [];
    const dis = parseCareDate(vd.patient.discharge_date);
    if (dis) {
      out.push({
        d: dis,
        title: "Hospital discharge",
        detail: vd.hospital.name,
        kind: "discharge",
      });
    }
    vd.follow_ups.forEach((f) => {
      const d = parseCareDate(f.date);
      if (d) out.push({ d, title: f.provider, detail: `${f.time} · ${f.purpose}`, kind: "followup" });
    });
    visits.forEach((v) => {
      const d = parseCareDate(v.date);
      if (d)
        out.push({
          d,
          title: v.type,
          detail: [v.provider, v.department, v.notes].filter(Boolean).join(" · "),
          kind: "visit",
        });
    });
    return out
      .sort((a, b) => a.d.getTime() - b.d.getTime())
      .map((e, i) => ({ ...e, id: `evt-${i}` }));
  }, [vd.patient.discharge_date, vd.hospital.name, vd.follow_ups, visits]);

  const monthEvents = useMemo(
    () =>
      calendarEvents.filter(
        (e) => e.d.getFullYear() === calYM.y && e.d.getMonth() === calYM.m
      ),
    [calendarEvents, calYM.y, calYM.m]
  );

  const selectedCalDetailEvents = useMemo(() => {
    if (!calSelection) return null;
    if (calSelection.mode === "event") {
      const e = calendarEvents.find((x) => x.id === calSelection.id);
      return e ? [e] : [];
    }
    return calendarEvents.filter(
      (e) =>
        e.d.getFullYear() === calSelection.y &&
        e.d.getMonth() === calSelection.m &&
        e.d.getDate() === calSelection.day
    );
  }, [calSelection, calendarEvents]);

  const tabs: { id: CareTab; label: string }[] = [
    { id: "discharge", label: "Discharge" },
    { id: "calendar", label: "Calendar" },
    { id: "call", label: "Call" },
    { id: "transcript", label: "Transcript" },
    { id: "record", label: "My record" },
  ];

  const panelStyle: CSSProperties = {
    background: "var(--surface-raised)",
    boxShadow: "6px 6px 14px var(--shadow-dark), -6px -6px 14px var(--shadow-light)",
    borderRadius: 14,
    padding: "16px 18px",
    minHeight: 320,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        fontFamily: "var(--font-body)",
        overflowX: "hidden",
        overflowY: "auto",
      }}
    >
      <main
        style={{
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
            gap: 14,
            flexWrap: "wrap",
            flexShrink: 0,
          }}
        >
          <Link
            href="/"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                background: "var(--surface-inset)",
                border: "1px solid var(--shadow-dark)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light)",
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
                color: "var(--text-primary)",
              }}
            >
              Care<span style={{ fontStyle: "normal", color: "var(--accent-warm)" }}>Call</span>
            </span>
          </Link>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: patientPortal ? "var(--accent-success)" : "var(--text-tertiary)",
              textTransform: "uppercase",
            }}
          >
            {patientPortal ? "Patient" : "My care"}
          </span>
          <div style={{ width: 1, height: 28, background: "var(--shadow-dark)", opacity: 0.7 }} />
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
              <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>
                MRN {scenario.mrn} · {scenario.language_code.toUpperCase()} · {vd.hospital.name}
              </div>
            </div>
          </div>
          {!patientPortal ? (
            <nav style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
              {MY_CARE_PORTAL_LINKS.map(({ href, label, scenario: sid }) => {
                const active = sid === scenarioId;
                return (
                  <Link
                    key={href}
                    href={href}
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "5px 10px",
                      borderRadius: 999,
                      border: active ? "1px solid var(--accent-clinical)" : "1px solid var(--shadow-dark)",
                      background: active ? "var(--accent-clinical-light)" : "transparent",
                      textDecoration: "none",
                      color: "var(--text-primary)",
                    }}
                  >
                    {label.split(" ")[0]}
                  </Link>
                );
              })}
            </nav>
          ) : null}
          {!patientPortal ? <div style={{ width: 1, height: 28, background: "var(--shadow-dark)", opacity: 0.7 }} /> : null}
          {!patientPortal ? (
            <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>
              Records: <strong style={{ color: "var(--text-secondary)" }}>{source === "supabase" ? "Hospital" : "Demo"}</strong>
            </div>
          ) : null}
          {!patientPortal ? (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 12,
                fontSize: 10,
              }}
            >
              <Link href="/provider/patients" style={{ color: "var(--text-tertiary)", textDecoration: "none" }}>
                Provider
              </Link>
              <Link
                href={`/dashboard?scenario=${encodeURIComponent(scenarioId)}`}
                style={{ color: "var(--text-tertiary)", textDecoration: "none" }}
              >
                Clinical dashboard
              </Link>
            </div>
          ) : null}
          <div style={{ flex: 1, minWidth: 8 }} />
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

        {/* Tabs — one panel at a time */}
        <div style={{ padding: "12px 16px 32px", maxWidth: 720, margin: "0 auto", width: "100%" }}>
          {patientPortal ? (
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "0 0 12px", textAlign: "center" }}>
              {source === "supabase" ? "Hospital records" : "Demo preview"}
            </p>
          ) : null}
          <div
            role="tablist"
            aria-label="Care sections"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 14,
              padding: 6,
              background: "var(--surface-inset)",
              borderRadius: 14,
              boxShadow: "inset 2px 2px 6px var(--shadow-dark), inset -2px -2px 6px var(--shadow-light)",
            }}
          >
            {tabs.map(({ id, label }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(id)}
                  style={{
                    flex: "1 1 auto",
                    minWidth: 72,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: active ? "1px solid var(--accent-clinical)" : "1px solid transparent",
                    background: active ? "var(--surface-raised)" : "transparent",
                    boxShadow: active ? "2px 2px 8px var(--shadow-dark), -1px -1px 6px var(--shadow-light)" : "none",
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    fontWeight: active ? 600 : 500,
                    color: active ? "var(--text-primary)" : "var(--text-tertiary)",
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {tab === "discharge" && (
            <div style={{ ...panelStyle, display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div style={{ ...sectionTitle, display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <Pill size={14} color="var(--accent-clinical)" /> Medications
                </div>
                <ul style={{ ...bodyText, listStyle: "none", padding: 0, margin: 0 }}>
                  {vd.medications.map((m, i) => (
                    <li
                      key={i}
                      style={{
                        padding: "10px 0",
                        borderBottom: i < vd.medications.length - 1 ? "1px solid var(--shadow-dark)" : undefined,
                      }}
                    >
                      <strong style={{ color: "var(--text-primary)" }}>{m.name}</strong>
                      <div style={{ fontSize: 11, marginTop: 4, color: "var(--text-tertiary)" }}>
                        {m.dose} · {m.frequency}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div style={{ ...sectionTitle, display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <Stethoscope size={14} color="var(--accent-clinical)" /> Activity & wound
                </div>
                <div style={bodyText}>
                  {vd.activity_restrictions.map((t, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                      • {t}
                    </div>
                  ))}
                  {vd.wound_care.map((t, i) => (
                    <div key={`w${i}`} style={{ marginBottom: 8 }}>
                      • {t}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ borderLeft: "3px solid var(--warning-red)", paddingLeft: 12 }}>
                <div style={{ ...sectionTitle, display: "flex", alignItems: "center", gap: 6, color: "var(--warning-red)", marginBottom: 10 }}>
                  <AlertTriangle size={14} /> When to get help
                </div>
                <ul style={{ ...bodyText, margin: 0, paddingLeft: 16 }}>
                  {vd.warning_signs.map((t, i) => (
                    <li key={i} style={{ marginBottom: 6 }}>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div style={{ ...sectionTitle, display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <History size={14} color="var(--accent-clinical)" /> Previous history
                </div>
                {sortedVisitsDesc.length === 0 ? (
                  <p style={{ ...bodyText, fontStyle: "italic", color: "var(--text-tertiary)", margin: 0 }}>
                    No prior visits on file.
                  </p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, ...bodyText }}>
                    {sortedVisitsDesc.map((v, i) => (
                      <li
                        key={`${v.date}-${i}`}
                        style={{
                          padding: "10px 0",
                          borderBottom: i < sortedVisitsDesc.length - 1 ? "1px solid var(--shadow-dark)" : undefined,
                        }}
                      >
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{v.date}</div>
                        <div style={{ fontSize: 11, marginTop: 2 }}>{v.type}</div>
                        <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>
                          {v.provider}
                          {v.department ? ` · ${v.department}` : ""}
                        </div>
                        {v.notes ? (
                          <div style={{ fontSize: 11, marginTop: 4, lineHeight: 1.4 }}>{v.notes}</div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {tab === "calendar" && (
            <div style={{ ...panelStyle, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() =>
                    setCalYM(({ y, m }) => {
                      const nm = m - 1;
                      return nm < 0 ? { y: y - 1, m: 11 } : { y, m: nm };
                    })
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: "1px solid var(--shadow-dark)",
                    background: "var(--surface-inset)",
                    cursor: "pointer",
                    color: "var(--text-primary)",
                  }}
                >
                  <ChevronLeft size={18} />
                </button>
                <div style={{ ...sectionTitle, marginBottom: 0, textAlign: "center", flex: 1 }}>
                  <Calendar size={14} color="var(--accent-clinical)" style={{ verticalAlign: "middle", marginRight: 6 }} />
                  {formatMonthYear(calYM.y, calYM.m)}
                </div>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() =>
                    setCalYM(({ y, m }) => {
                      const nm = m + 1;
                      return nm > 11 ? { y: y + 1, m: 0 } : { y, m: nm };
                    })
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: "1px solid var(--shadow-dark)",
                    background: "var(--surface-inset)",
                    cursor: "pointer",
                    color: "var(--text-primary)",
                  }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
                  textAlign: "center",
                  marginBottom: 4,
                }}
              >
                {["S", "M", "T", "W", "T", "F", "S"].map((w, i) => (
                  <div key={`${w}-${i}`}>{w}</div>
                ))}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 4,
                }}
              >
                {(() => {
                  const first = new Date(calYM.y, calYM.m, 1);
                  const pad = first.getDay();
                  const dim = new Date(calYM.y, calYM.m + 1, 0).getDate();
                  const cells: (number | null)[] = [];
                  for (let i = 0; i < pad; i++) cells.push(null);
                  for (let d = 1; d <= dim; d++) cells.push(d);
                  return cells.map((day, idx) => {
                    if (day === null) {
                      return <div key={`e-${idx}`} style={{ minHeight: 52 }} />;
                    }
                    const dayEvents = calendarEvents.filter(
                      (e) =>
                        e.d.getFullYear() === calYM.y &&
                        e.d.getMonth() === calYM.m &&
                        e.d.getDate() === day
                    );
                    const dot = (kind: string) =>
                      kind === "discharge"
                        ? "var(--accent-clinical)"
                        : kind === "followup"
                          ? "var(--accent-success)"
                          : "var(--text-tertiary)";
                    const daySelected =
                      calSelection?.mode === "day" &&
                      calSelection.y === calYM.y &&
                      calSelection.m === calYM.m &&
                      calSelection.day === day;
                    const hasEvents = dayEvents.length > 0;
                    const cellInner = (
                      <>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{day}</span>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 2,
                            justifyContent: "center",
                            maxWidth: "100%",
                          }}
                        >
                          {dayEvents.slice(0, 3).map((e, j) => (
                            <button
                              key={e.id}
                              type="button"
                              title={e.title}
                              aria-label={`${calendarKindLabel(e.kind)}: ${e.title}`}
                              onClick={(ev) => {
                                ev.stopPropagation();
                                setCalSelection((prev) =>
                                  prev?.mode === "event" && prev.id === e.id
                                    ? null
                                    : { mode: "event", id: e.id }
                                );
                              }}
                              style={{
                                width: 10,
                                height: 10,
                                padding: 0,
                                border: "none",
                                borderRadius: "50%",
                                background: dot(e.kind),
                                flexShrink: 0,
                                cursor: "pointer",
                                boxShadow:
                                  calSelection?.mode === "event" && calSelection.id === e.id
                                    ? "0 0 0 2px var(--surface-raised), 0 0 0 4px var(--accent-clinical)"
                                    : undefined,
                              }}
                            />
                          ))}
                          {dayEvents.length > 3 ? (
                            <span style={{ fontSize: 8, color: "var(--text-tertiary)" }}>+</span>
                          ) : null}
                        </div>
                      </>
                    );
                    if (!hasEvents) {
                      return (
                        <div
                          key={`${calYM.y}-${calYM.m}-${day}`}
                          style={{
                            minHeight: 52,
                            padding: "4px 2px",
                            borderRadius: 8,
                            background: "var(--surface-inset)",
                            boxShadow: "inset 1px 1px 3px var(--shadow-dark)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 2,
                          }}
                        >
                          {cellInner}
                        </div>
                      );
                    }
                    return (
                      <button
                        key={`${calYM.y}-${calYM.m}-${day}`}
                        type="button"
                        aria-pressed={daySelected}
                        onClick={() =>
                          setCalSelection((prev) =>
                            prev?.mode === "day" &&
                            prev.y === calYM.y &&
                            prev.m === calYM.m &&
                            prev.day === day
                              ? null
                              : { mode: "day", y: calYM.y, m: calYM.m, day }
                          )
                        }
                        style={{
                          minHeight: 52,
                          padding: "4px 2px",
                          borderRadius: 8,
                          border: daySelected ? "2px solid var(--accent-clinical)" : "2px solid transparent",
                          background: daySelected ? "var(--surface-raised)" : "var(--surface-inset)",
                          boxShadow: daySelected
                            ? "4px 4px 12px var(--shadow-dark)"
                            : "inset 1px 1px 3px var(--shadow-dark)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 2,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        {cellInner}
                      </button>
                    );
                  });
                })()}
              </div>
              {selectedCalDetailEvents && selectedCalDetailEvents.length > 0 ? (
                <div
                  role="region"
                  aria-label="Selected event details"
                  style={{
                    padding: "18px 16px",
                    borderRadius: 14,
                    border: "2px solid var(--accent-clinical)",
                    background: "var(--surface-raised)",
                    boxShadow: "6px 6px 16px var(--shadow-dark), -2px -2px 10px var(--shadow-light)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 12,
                      marginBottom: 14,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontStyle: "italic",
                        fontWeight: 300,
                        fontSize: 13,
                        color: "var(--text-primary)",
                      }}
                    >
                      {calSelection?.mode === "day" && selectedCalDetailEvents.length > 1
                        ? `${selectedCalDetailEvents.length} events this day`
                        : "Event details"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCalSelection(null)}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "1px solid var(--shadow-dark)",
                        background: "var(--surface-inset)",
                        cursor: "pointer",
                        color: "var(--text-secondary)",
                        fontFamily: "inherit",
                        flexShrink: 0,
                      }}
                    >
                      Close
                    </button>
                  </div>
                  {selectedCalDetailEvents.map((e, i) => (
                    <div
                      key={e.id}
                      style={{
                        paddingTop: i === 0 ? 0 : 14,
                        paddingBottom: 14,
                        borderTop: i === 0 ? "none" : "1px solid var(--shadow-dark)",
                      }}
                    >
                      <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 6, letterSpacing: "0.02em" }}>
                        {e.d.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                        <span
                          style={{
                            marginLeft: 10,
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: "var(--surface-inset)",
                            fontWeight: 600,
                            color: "var(--accent-clinical)",
                          }}
                        >
                          {calendarKindLabel(e.kind)}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 17,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          lineHeight: 1.35,
                          marginBottom: 8,
                        }}
                      >
                        {e.title}
                      </div>
                      <div style={{ fontSize: 14, lineHeight: 1.55, color: "var(--text-secondary)" }}>{e.detail}</div>
                    </div>
                  ))}
                </div>
              ) : null}
              <div>
                <div style={{ ...sectionTitle, marginBottom: 8 }}>This month</div>
                {monthEvents.length === 0 ? (
                  <p style={{ ...bodyText, fontStyle: "italic", color: "var(--text-tertiary)", margin: 0 }}>
                    No discharge, visits, or follow-ups in this month.
                  </p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, ...bodyText }}>
                    {monthEvents.map((e, i) => {
                      const kindLabel = calendarKindLabel(e.kind);
                      const rowSelected =
                        calSelection?.mode === "event"
                          ? calSelection.id === e.id
                          : calSelection?.mode === "day"
                            ? e.d.getFullYear() === calSelection.y &&
                              e.d.getMonth() === calSelection.m &&
                              e.d.getDate() === calSelection.day
                            : false;
                      return (
                        <li key={e.id} style={{ marginBottom: i < monthEvents.length - 1 ? 0 : undefined }}>
                          <button
                            type="button"
                            onClick={() =>
                              setCalSelection((prev) =>
                                prev?.mode === "event" && prev.id === e.id ? null : { mode: "event", id: e.id }
                              )
                            }
                            style={{
                              width: "100%",
                              textAlign: "left",
                              padding: rowSelected ? "14px 12px" : "10px 12px",
                              marginBottom: i < monthEvents.length - 1 ? 8 : 0,
                              borderRadius: 12,
                              border: rowSelected ? "2px solid var(--accent-clinical)" : "1px solid var(--shadow-dark)",
                              background: rowSelected ? "var(--surface-raised)" : "var(--surface-inset)",
                              boxShadow: rowSelected ? "4px 4px 12px var(--shadow-dark)" : "inset 1px 1px 4px var(--shadow-dark)",
                              cursor: "pointer",
                              fontFamily: "inherit",
                              transition: "padding 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
                            }}
                          >
                            <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginBottom: 4 }}>
                              {e.d.toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                              <span style={{ marginLeft: 8 }}>{kindLabel}</span>
                            </div>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: rowSelected ? 14 : 12,
                                color: "var(--text-primary)",
                                lineHeight: 1.35,
                              }}
                            >
                              {e.title}
                            </div>
                            <div
                              style={{
                                fontSize: rowSelected ? 12 : 11,
                                marginTop: 4,
                                lineHeight: 1.45,
                                color: "var(--text-secondary)",
                              }}
                            >
                              {e.detail}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}

          {tab === "call" && (
            <div style={panelStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Mic size={16} color="var(--accent-clinical)" />
                <span style={{ ...sectionTitle, marginBottom: 0 }}>Care assistant</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-tertiary)", lineHeight: 1.45, marginBottom: 12 }}>
                Not for emergencies — call 911 for severe symptoms. Open the Transcript tab to read the conversation.
              </p>
              <VoiceAssistantSection
                scenarioId={scenarioId}
                vd={vd}
                onTranscriptChange={setLiveTranscript}
                onCallStart={onCallStart}
                onCallEnd={onCallEnd}
              />
            </div>
          )}

          {tab === "transcript" && (
            <div style={{ ...panelStyle, display: "flex", flexDirection: "column", minHeight: 420 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                {transcriptSourceLabel}
              </div>
              <div style={{ flex: 1, minHeight: 360, display: "flex", flexDirection: "column" }}>
                <ComprehensionTranscript
                  transcript={displayTranscript}
                  isConnected={callLive}
                  isPhoneMode={false}
                  callTimeLabel={transcriptCallTimeLabel}
                />
              </div>
            </div>
          )}

          {tab === "record" && (
            <div style={{ ...panelStyle, display: "flex", flexDirection: "column", gap: 22, minHeight: 0 }}>
              <div>
                <div style={{ ...sectionTitle, marginBottom: 10 }}>Call history</div>
                <div style={bodyText}>
                  {calls.length === 0 ? (
                    <span style={{ fontStyle: "italic", color: "var(--text-tertiary)" }}>No calls logged yet.</span>
                  ) : (
                    calls.map((c, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "10px 0",
                          borderBottom: i < calls.length - 1 ? "1px solid var(--shadow-dark)" : undefined,
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{c.date} · {c.time}</div>
                        <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                          {c.duration} · {c.comprehension_score}%
                        </div>
                        <div style={{ fontSize: 11, marginTop: 4 }}>{c.summary}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <div style={{ ...sectionTitle, marginBottom: 10 }}>Pharmacy</div>
                <div style={bodyText}>
                  {prescriptions.length === 0 ? (
                    <span style={{ fontStyle: "italic", color: "var(--text-tertiary)" }}>No prescriptions on file.</span>
                  ) : (
                    prescriptions.map((rx, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "8px 0",
                          borderBottom: i < prescriptions.length - 1 ? "1px solid var(--shadow-dark)" : undefined,
                        }}
                      >
                        <strong>{rx.name}</strong>
                        <span style={{ fontSize: 11, color: "var(--text-tertiary)", marginLeft: 8 }}>· {rx.status}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <MedChecklist voiceData={vd} completedSteps={[]} transcript={displayTranscript} />
              </div>
            </div>
          )}
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
