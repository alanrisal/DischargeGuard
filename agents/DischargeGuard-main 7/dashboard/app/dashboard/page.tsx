"use client";
import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import VoiceAgentPanel from "@/components/VoiceAgentPanel";
import SummaryCard from "@/components/SummaryCard";
import Waveform from "@/components/dashboard/Waveform";
import RadialSpoke from "@/components/dashboard/RadialSpoke";
import ComprehensionTranscript from "@/components/dashboard/ComprehensionTranscript";
import MedChecklist from "@/components/dashboard/MedChecklist";
import { getScenario } from "@/lib/scenarioData";
import type { TranscriptEntry } from "@/lib/useVoiceAgent";

type CallStatus = "idle" | "live" | "done";

type FlagEntry = {
  id: number;
  text: string;
  severity: "urgent" | "warning";
  time: string;
};

function DashboardPage() {
  const searchParams  = useSearchParams();
  const scenarioParam = searchParams.get("scenario") ?? "maria";
  const mrnParam      = searchParams.get("mrn");

  const scenarioFallback = getScenario(scenarioParam);
  const lookupMrn        = mrnParam ?? scenarioFallback.mrn;

  const [patient, setPatient] = useState<{
    name: string; mrn: string; diagnosis: string; language: string; language_code: string;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/patient?mrn=${lookupMrn}`)
      .then((r) => r.json())
      .then((d) => { if (d.patient) setPatient(d.patient); })
      .catch(() => {});
  }, [lookupMrn]);

  const [callStatus,      setCallStatus]      = useState<CallStatus>("idle");
  const [callTime,        setCallTime]        = useState("0:00");
  const [completedSteps,  setCompletedSteps]  = useState<string[]>([]);
  const [currentStep,     setCurrentStep]     = useState<string | null>(null);
  const [flags,           setFlags]           = useState<FlagEntry[]>([]);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [liveTranscript,  setLiveTranscript]  = useState<TranscriptEntry[]>([]);
  const [sessionData,     setSessionData]     = useState<{
    completedSteps: string[];
    flaggedWarnings: { sign: string; severity: string }[];
    transcript: string;
    callDuration: string;
  } | null>(null);

  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef  = useRef<number | null>(null);
  const sentRef   = useRef(false);

  const displayName      = patient?.name            ?? scenarioFallback.name;
  const displayMrn       = patient?.mrn             ?? scenarioFallback.mrn;
  const displayDiagnosis = (patient?.diagnosis ?? scenarioFallback.diagnosis).split(",")[0].trim();
  const displayLangCode  = patient?.language_code   ?? scenarioFallback.language_code;
  const displayLang      = patient?.language        ?? scenarioFallback.language;
  const initials         = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const [photoExt,    setPhotoExt]    = useState<"jpg"|"png">("jpg");
  const [photoFailed, setPhotoFailed] = useState(false);
  const photoSrc = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/patient-photos/${displayMrn}.${photoExt}`;
  const handlePhotoError = () => { if (photoExt === "jpg") setPhotoExt("png"); else setPhotoFailed(true); };
  const doneCount        = completedSteps.length;
  const totalSteps       = 9;
  const comp             = Math.round((doneCount / totalSteps) * 100);
  const urgentFlags      = flags.filter(f => f.severity === "urgent").length;

  const handleCallStart = () => {
    // Always clear any stale interval first
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    sentRef.current  = false;
    startRef.current = Date.now();
    setCallStatus("live");
    setCallTime("0:00");
    setCompletedSteps([]);
    setCurrentStep(null);
    setFlags([]);
    setIsAgentSpeaking(false);
    setLiveTranscript([]);
    timerRef.current = setInterval(() => {
      if (startRef.current === null) return;
      const elapsed = Date.now() - startRef.current;
      const s = Math.floor(elapsed / 1000);
      setCallTime(`${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`);
    }, 500);
  };

  const handleCallEnd = (data: {
    completedSteps: string[];
    flaggedWarnings: { sign: string; severity: string }[];
    transcript: string;
  }) => {
    if (sentRef.current) return;
    sentRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    // Only process if call was actually live
    if (callStatus !== "live") return;
    const s = startRef.current !== null ? Math.floor((Date.now() - startRef.current) / 1000) : 0;
    const duration = `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
    setSessionData({ ...data, callDuration: duration });
    setCallTime(duration);
    setCallStatus("done");
    setIsAgentSpeaking(false);

    // Parse raw transcript string into typed entries for ComprehensionTranscript
    const parsed: TranscriptEntry[] = data.transcript
      .split("\n")
      .filter(Boolean)
      .map((line, i) => ({
        id: i,
        role: line.startsWith("ALEX:") ? "agent" : "user",
        text: line.replace(/^(ALEX|PT):\s*/, ""),
      }));
    setLiveTranscript(parsed);

    const c = Math.round((data.completedSteps.length / totalSteps) * 100);
    fetch("/api/send-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientName: displayName, patientMrn: displayMrn,
        languageCode: displayLangCode, callTime: duration,
        comprehension: c, greenCount: data.completedSteps.length,
        totalItems: totalSteps, alerts: [],
        transcript: data.transcript,
        completedSteps: data.completedSteps,
        flaggedWarnings: data.flaggedWarnings, items: {},
      }),
    }).catch(console.error);
  };

  const handleStepUpdate = (_steps: number, _warns: number) => {
    // detailed updates come via onDetailedStepUpdate
  };

  const handleDetailedStepUpdate = (steps: string[], step: string | null) => {
    setCompletedSteps(steps);
    setCurrentStep(step);
  };

  const handleSpeakingChange = (speaking: boolean) => {
    setIsAgentSpeaking(speaking);
  };

  // Sync flagged warnings from call end data
  useEffect(() => {
    if (!sessionData) return;
    const newFlags: FlagEntry[] = sessionData.flaggedWarnings.map((w, i) => ({
      id: Date.now() + i,
      text: w.sign,
      severity: w.severity === "urgent" ? "urgent" : "warning",
      time: callTime,
    }));
    setFlags(newFlags);
  }, [sessionData]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const LANG_COLORS: Record<string, string> = {
    es: "#C2714F", zh: "#3B6FA0", en: "#4A8C6F", default: "#7A6E68",
  };
  const avatarColor = LANG_COLORS[displayLangCode] ?? LANG_COLORS.default;

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      background: "var(--bg-base)",
      fontFamily: "var(--font-body)",
      overflow: "hidden",
    }}>

      {/* ═══════════════════════════════════════════════════════════════
          SIDEBAR — dark clinical panel
      ══════════════════════════════════════════════════════════════════ */}
      <aside style={{
        width: 256,
        flexShrink: 0,
        background: "#1F1A16",
        display: "flex",
        flexDirection: "column",
        padding: "24px 18px",
        overflowY: "auto",
      }}>

        {/* Logo */}
        <Link href="/patients" style={{
          textDecoration: "none", display: "flex", alignItems: "center",
          gap: 8, marginBottom: 28,
        }}>
          <div style={{
            width: 30, height: 30,
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 9,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{
              fontSize: 13, color: "var(--accent-warm)",
              fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 600,
            }}>C</span>
          </div>
          <span style={{
            fontFamily: "var(--font-display)", fontStyle: "italic",
            fontWeight: 300, fontSize: 14,
            color: "rgba(240,235,227,0.9)",
          }}>
            Care<span style={{
              fontStyle: "normal", fontFamily: "var(--font-body)",
              fontWeight: 300, color: "var(--accent-warm)",
            }}>Call</span>
          </span>
        </Link>

        {/* Patient avatar + name */}
        <div style={{
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: 12, marginBottom: 22,
        }}>
          {/* Avatar circle */}
          <div style={{
            width: 68, height: 68, borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            border: `2px solid ${avatarColor}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", overflow: "hidden",
          }}>
            {!photoFailed ? (
              <img src={photoSrc} alt={displayName} onError={handlePhotoError}
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            ) : (
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 22, color: avatarColor, letterSpacing: "-0.5px" }}>
                {initials}
              </span>
            )}
            {callStatus === "live" && (
              <div style={{
                position: "absolute", inset: -4, borderRadius: "50%",
                border: `2px solid var(--accent-success)`,
                animation: "pulse-ring 2s ease-out infinite",
                pointerEvents: "none",
              }} />
            )}
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{
              fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 15,
              color: "rgba(240,235,227,0.95)", letterSpacing: "-0.2px",
            }}>
              {displayName}
            </div>
            <div style={{
              fontFamily: "var(--font-body)", fontWeight: 300, fontSize: 10,
              color: "rgba(240,235,227,0.4)", marginTop: 3, letterSpacing: "0.04em",
            }}>
              MRN {displayMrn}
            </div>
          </div>
        </div>

        {/* Condition + language tags */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 22 }}>
          {[
            { label: displayDiagnosis, color: "rgba(240,235,227,0.55)" },
            { label: `${displayLangCode.toUpperCase()} · ${displayLang}`, color: "var(--accent-success)" },
          ].map((tag, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 999,
              padding: "5px 12px",
              fontSize: 10, fontWeight: 500,
              color: tag.color,
              textAlign: "center",
              letterSpacing: "0.04em",
            }}>
              {tag.label}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.08)", marginBottom: 18 }} />

        {/* Call status card */}
        <div style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12,
          padding: "14px 14px",
          display: "flex", flexDirection: "column", gap: 12,
          marginBottom: 18,
        }}>
          {/* Status row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{
              fontSize: 9, fontWeight: 600, letterSpacing: "0.1em",
              color: "rgba(240,235,227,0.35)", textTransform: "uppercase",
            }}>
              Status
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: callStatus === "live"
                  ? "var(--accent-success)"
                  : callStatus === "done"
                  ? "var(--accent-clinical)"
                  : "rgba(240,235,227,0.3)",
                animation: callStatus === "live" ? "pulse-dot 1.5s ease-in-out infinite" : undefined,
              }} />
              <span style={{
                fontSize: 10, fontWeight: 600, letterSpacing: "0.07em",
                color: callStatus === "live"
                  ? "var(--accent-success)"
                  : callStatus === "done"
                  ? "var(--accent-clinical)"
                  : "rgba(240,235,227,0.4)",
              }}>
                {callStatus === "live" ? "AGENT ACTIVE" : callStatus === "done" ? "COMPLETE" : "STANDBY"}
              </span>
            </div>
          </div>

          {/* Timer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{
              fontSize: 9, fontWeight: 600, letterSpacing: "0.1em",
              color: "rgba(240,235,227,0.35)", textTransform: "uppercase",
            }}>
              Duration
            </span>
            <span style={{
              fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 300,
              color: "rgba(240,235,227,0.9)", letterSpacing: "0.5px",
            }}>
              {callTime}
            </span>
          </div>

          {/* Steps progress */}
          <div>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 6,
            }}>
              <span style={{
                fontSize: 9, fontWeight: 600, letterSpacing: "0.1em",
                color: "rgba(240,235,227,0.35)", textTransform: "uppercase",
              }}>
                Coverage
              </span>
              <span style={{
                fontSize: 10, fontWeight: 600,
                color: comp > 80 ? "var(--accent-success)" : comp > 50 ? "var(--warning-amber)" : "rgba(240,235,227,0.5)",
              }}>
                {doneCount}/{totalSteps}
              </span>
            </div>
            <div style={{
              background: "rgba(255,255,255,0.08)",
              borderRadius: 999, height: 4, overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: 999,
                width: `${comp}%`,
                background: comp > 80
                  ? "var(--accent-success)"
                  : comp > 50
                  ? "var(--warning-amber)"
                  : "var(--accent-clinical)",
                transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
              }} />
            </div>
          </div>
        </div>

        {/* Urgent flags count */}
        {urgentFlags > 0 && (
          <div style={{
            background: "rgba(184,64,64,0.15)",
            border: "1px solid rgba(184,64,64,0.35)",
            borderRadius: 10, padding: "10px 14px",
            display: "flex", alignItems: "center", gap: 8,
            marginBottom: 18,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--warning-red)" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <div style={{
                fontSize: 9, fontWeight: 700, color: "var(--warning-red)",
                letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2,
              }}>
                Urgent
              </div>
              <div style={{ fontSize: 10, color: "rgba(240,235,227,0.6)" }}>
                {urgentFlags} concern{urgentFlags !== 1 ? "s" : ""} flagged
              </div>
            </div>
          </div>
        )}

        {/* Spacer + back link */}
        <div style={{ flex: 1 }} />
        <Link href="/patients" style={{
          display: "flex", alignItems: "center", gap: 7,
          fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 400,
          color: "rgba(240,235,227,0.3)", textDecoration: "none",
          padding: "8px 0",
          transition: "color 200ms ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-warm)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(240,235,227,0.3)")}
        >
          ← All patients
        </Link>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════════════════════ */}
      <main style={{
        flex: 1,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}>

        {/* ── Clinical Header Bar ── */}
        <div style={{
          background: "var(--surface-raised)",
          boxShadow: "0 2px 12px var(--shadow-dark)",
          borderBottom: "1px solid var(--shadow-dark)",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: 24,
          flexShrink: 0,
        }}>
          {/* Patient identifier */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div>
              <div style={{
                fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13,
                color: "var(--text-primary)",
              }}>
                {displayName}
              </div>
              <div style={{
                fontFamily: "var(--font-body)", fontWeight: 300, fontSize: 10,
                color: "var(--text-tertiary)",
              }}>
                {displayDiagnosis}
              </div>
            </div>
          </div>

          {/* Vertical divider */}
          <div style={{ width: 1, height: 32, background: "var(--shadow-dark)", opacity: 0.7 }} />

          {/* Call metrics */}
          {[
            { label: "Language", value: displayLang },
            { label: "MRN", value: displayMrn },
            { label: "Duration", value: callTime },
            { label: "Coverage", value: `${comp}%` },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.09em",
                textTransform: "uppercase", color: "var(--text-tertiary)",
              }}>
                {label}
              </span>
              <span style={{
                fontFamily: label === "Duration" || label === "Coverage" ? "var(--font-display)" : "var(--font-body)",
                fontSize: 13, fontWeight: 500,
                color: label === "Coverage" && comp > 80
                  ? "var(--accent-success)"
                  : label === "Coverage" && comp > 0
                  ? "var(--warning-amber)"
                  : "var(--text-primary)",
              }}>
                {value}
              </span>
            </div>
          ))}

          <div style={{ flex: 1 }} />

          {/* Inline waveform */}
          <div style={{
            width: 160, height: 36,
            background: "var(--surface-inset)",
            boxShadow: "inset 2px 2px 6px var(--shadow-dark), inset -2px -2px 6px var(--shadow-light)",
            borderRadius: 8, overflow: "hidden", padding: "4px 8px",
            display: "flex", alignItems: "center",
          }}>
            <Waveform isActive={callStatus === "live"} height={28} />
          </div>

          {/* Status badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "var(--surface-inset)",
            boxShadow: "inset 3px 3px 7px var(--shadow-dark), inset -3px -3px 7px var(--shadow-light)",
            borderRadius: 999, padding: "7px 14px",
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: callStatus === "live"
                ? "var(--accent-success)"
                : callStatus === "done"
                ? "var(--accent-clinical)"
                : "var(--text-tertiary)",
              animation: callStatus === "live" ? "pulse-dot 1.5s ease-in-out infinite" : undefined,
            }} />
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
              color: callStatus === "live"
                ? "var(--accent-success)"
                : callStatus === "done"
                ? "var(--accent-clinical)"
                : "var(--text-tertiary)",
            }}>
              {callStatus === "live" ? "AGENT ACTIVE" : callStatus === "done" ? "CALL COMPLETE" : "STANDBY"}
            </span>
          </div>
        </div>

        {/* ── Main workspace — scrollable, 3-pane grid ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 32px", display: "grid", gridTemplateColumns: "2fr 4fr 2fr", gap: 16, alignItems: "start" }}>

          {/* LEFT PANE — Coverage + Clinical Flags */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Call Coverage */}
            <section style={{
              background: "var(--surface-raised)",
              boxShadow: "6px 6px 14px var(--shadow-dark), -6px -6px 14px var(--shadow-light)",
              borderRadius: 16, padding: "16px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              flexShrink: 0,
            }}>
              <h2 style={{
                fontFamily: "var(--font-display)", fontStyle: "italic",
                fontWeight: 300, fontSize: 14, color: "var(--text-primary)",
                alignSelf: "flex-start",
              }}>
                Call Coverage
              </h2>
              <RadialSpoke completedSteps={completedSteps} currentStep={currentStep} />
              <div style={{ width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-tertiary)", textTransform: "uppercase" }}>Comprehension</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: comp > 80 ? "var(--accent-success)" : comp > 50 ? "var(--warning-amber)" : comp > 0 ? "var(--warning-red)" : "var(--text-tertiary)" }}>{comp}%</span>
                </div>
                <div style={{ background: "var(--surface-inset)", boxShadow: "inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light)", borderRadius: 999, height: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 999, width: `${comp}%`, background: comp > 80 ? "var(--accent-success)" : comp > 50 ? "var(--warning-amber)" : "var(--warning-red)", transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
                </div>
              </div>
            </section>

            {/* Clinical Flags */}
            <section style={{
              background: "var(--surface-raised)",
              boxShadow: "6px 6px 14px var(--shadow-dark), -6px -6px 14px var(--shadow-light)",
              borderRadius: 16, padding: "16px",
              display: "flex", flexDirection: "column",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexShrink: 0 }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300, fontSize: 14, color: "var(--text-primary)" }}>
                  Clinical Flags
                </h2>
                {flags.length > 0 && (
                  <div style={{ background: "var(--surface-inset)", boxShadow: "inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light)", borderRadius: 999, padding: "2px 8px", fontSize: 9, fontWeight: 700, color: urgentFlags > 0 ? "var(--warning-red)" : "var(--warning-amber)" }}>
                    {flags.length} FLAG{flags.length !== 1 ? "S" : ""}
                  </div>
                )}
              </div>
              <div style={{ marginTop: 4 }}>
                {flags.length === 0 ? (
                  <div style={{ background: "var(--surface-inset)", boxShadow: "inset 3px 3px 7px var(--shadow-dark), inset -3px -3px 7px var(--shadow-light)", borderRadius: 12, padding: "20px", textAlign: "center", fontSize: 11, color: "var(--text-tertiary)", fontStyle: "italic" }}>
                    No concerns flagged
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {flags.map((flag) => (
                      <div key={flag.id} style={{ background: flag.severity === "urgent" ? "var(--warning-red-bg)" : "var(--warning-amber-bg)", borderLeft: `3px solid ${flag.severity === "urgent" ? "var(--warning-red)" : "var(--warning-amber)"}`, borderRadius: "0 10px 10px 0", padding: "8px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: flag.severity === "urgent" ? "var(--warning-red)" : "var(--warning-amber)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{flag.severity}</span>
                          <span style={{ fontSize: 9, color: "var(--text-tertiary)" }}>{flag.time}</span>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-primary)", textDecoration: "underline", textDecorationColor: flag.severity === "urgent" ? "var(--warning-red)" : "var(--warning-amber)", textUnderlineOffset: 3 }}>{flag.text}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* CENTER PANE — Voice controls + Comprehension transcript */}
          <section style={{
            background: "var(--surface-raised)",
            boxShadow: "6px 6px 14px var(--shadow-dark), -6px -6px 14px var(--shadow-light)",
            borderRadius: 16, padding: "16px 20px",
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            {/* Voice agent controls — compact, fixed height */}
            <div style={{ flexShrink: 0 }}>
              <VoiceAgentPanel
                onCallStart={handleCallStart}
                onCallEnd={handleCallEnd}
                onStepUpdate={handleStepUpdate}
                onDetailedStepUpdate={handleDetailedStepUpdate}
                onSpeakingChange={handleSpeakingChange}
                onTranscriptUpdate={setLiveTranscript}
                patientData={scenarioFallback.voiceData}
                scenarioId={scenarioParam}
              />
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "var(--shadow-dark)", flexShrink: 0 }} />

            {/* Comprehension transcript — fixed height, always visible, scrolls internally */}
            <div style={{ minHeight: 420 }}>
              <ComprehensionTranscript
                transcript={liveTranscript}
                isConnected={callStatus === "live"}
                isPhoneMode={false}
              />
            </div>
          </section>

          {/* RIGHT PANE — Medication checklist + post-call summary */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <section style={{
              background: "var(--surface-raised)",
              boxShadow: "6px 6px 14px var(--shadow-dark), -6px -6px 14px var(--shadow-light)",
              borderRadius: 16, padding: "16px",
              display: "flex", flexDirection: "column",
            }}>
              <MedChecklist
                voiceData={scenarioFallback.voiceData}
                completedSteps={completedSteps}
                transcript={liveTranscript}
              />
            </section>

            {callStatus === "done" && sessionData && (
              <section style={{
                background: "var(--surface-raised)",
                boxShadow: "6px 6px 14px var(--shadow-dark), -6px -6px 14px var(--shadow-light)",
                borderRadius: 16, padding: "16px",
              }}>
                <SummaryCard sessionData={sessionData} />
              </section>
            )}
          </div>

        </div>
      </main>

      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.5; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <DashboardPage />
    </Suspense>
  );
}
