"use client";
import { useEffect, useRef, useState } from "react";
import { ConversationProvider } from "@elevenlabs/react";
import { useVoiceAgent, WORKFLOW_STEPS } from "@/lib/useVoiceAgent";
import type { TranscriptEntry, WorkflowStepId, FlaggedWarning } from "@/lib/useVoiceAgent";
import type { PatientVoiceData } from "@/lib/scenarioData";

// Legacy palette — only used for StatusDot and pulseRing keyframe
const C = {
  accent: "#3B6FA0", green: "#4A8C6F", amber: "#D4813A",
  red: "#B84040", muted: "#A89E98", border: "var(--shadow-dark)", text: "#2C2420",
};

// ── Step inference from transcript text (phone mode only) ─────────────────────
// Ordered from latest to earliest so the first match wins the most-advanced step.
const STEP_PATTERNS: [WorkflowStepId, string[]][] = [
  ["closing",               ["take care", "feel better", "goodbye", "good bye", "bye", "call us if", "reach out", "here for you", "well done", "you're all set"]],
  ["open_questions",        ["any question", "any concern", "anything else", "anything you'd like", "is there anything", "what else"]],
  ["warning_signs",         ["warning sign", "go to the er", "call 911", "call emergency", "danger sign", "emergency room", "fever above", "chest pain", "shortness of breath", "unusual bleeding", "seek immediate"]],
  ["follow_ups",            ["follow-up appointment", "follow up appointment", "follow up with", "appointment on", "april", "lab test", "blood test", "clinic visit", "see the doctor"]],
  ["wound_care",            ["wound", "incision", "bandage", "dressing", "steri-strip", "surgical site", "stitches", "suture"]],
  ["activity_restrictions", ["no lifting", "no driving", "avoid lifting", "avoid driving", "activity restriction", "no swimming", "no bathing", "when you can exercise", "physical activity"]],
  ["medications",           ["medication", "medicine", "metformin", "lisinopril", "warfarin", "omeprazole", "pill", "tablet", "dose", "dosage", "prescription", "twice a day", "once a day", "take your"]],
  ["symptoms",              ["how are you feeling", "any pain", "pain level", "rate your pain", "nausea", "dizziness", "any discomfort", "side effect", "how do you feel"]],
  ["opening",               ["calling from", "follow-up call", "follow up call", "check in on you", "how are you today", "how are you doing", "hospital"]],
];

// Patient responses that signal a potential warning
const WARNING_PATTERNS: [string, "urgent" | "warning"][] = [
  ["chest pain",            "urgent"],
  ["can't breathe",         "urgent"],
  ["cannot breathe",        "urgent"],
  ["difficulty breathing",  "urgent"],
  ["shortness of breath",   "urgent"],
  ["hard to breathe",       "urgent"],
  ["severe pain",           "urgent"],
  ["bleeding",              "warning"],
  ["fever",                 "warning"],
  ["throwing up",           "warning"],
  ["vomiting",              "warning"],
  ["vomit",                 "warning"],
  ["yellow",                "warning"],
  ["jaundice",              "warning"],
  ["swelling",              "warning"],
  ["confused",              "warning"],
  ["not taking",            "warning"],
  ["didn't take",           "warning"],
  ["forgot",                "warning"],
];

function inferStepFromText(text: string): WorkflowStepId | null {
  const lower = text.toLowerCase();
  for (const [step, keywords] of STEP_PATTERNS) {
    if (keywords.some((kw) => lower.includes(kw))) return step;
  }
  return null;
}

function inferWarningsFromText(text: string): { sign: string; severity: "urgent" | "warning" }[] {
  const lower = text.toLowerCase();
  return WARNING_PATTERNS
    .filter(([kw]) => lower.includes(kw))
    .map(([kw, sev]) => ({ sign: kw, severity: sev }));
}

// ── Inner panel (must live inside ConversationProvider) ───────────────────────
function VoiceAgentInner({
  phoneNumber,
  patientData,
  scenarioId,
  onCallStart,
  onCallEnd,
  onStepUpdate,
  onDetailedStepUpdate,
  onSpeakingChange,
  onTranscriptUpdate,
}: {
  phoneNumber: string;
  patientData?: PatientVoiceData;
  scenarioId?: string;
  onCallStart?: () => void;
  onCallEnd?: (data: {
    completedSteps: string[];
    flaggedWarnings: { sign: string; severity: string }[];
    transcript: string;
  }) => void;
  onStepUpdate?: (steps: number, warnings: number) => void;
  onDetailedStepUpdate?: (completedSteps: string[], currentStep: string | null) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
  onTranscriptUpdate?: (transcript: TranscriptEntry[]) => void;
}) {
  // ── Browser-WebSocket mode ───────────────────────────────────────────────────
  const {
    status: wsStatus, isSpeaking,
    transcript: wsTranscript,
    currentStep: wsCurrentStep,
    completedSteps: wsCompletedSteps,
    flaggedWarnings: wsFlaggedWarnings,
    startCall: wsStartCall, endCall: wsEndCall,
  } = useVoiceAgent({ patientData });

  // ── Phone mode state ─────────────────────────────────────────────────────────
  type PhoneStatus = "idle" | "calling" | "connected" | "done" | "error";
  const [phoneStatus,        setPhoneStatus]        = useState<PhoneStatus>("idle");
  const [phoneTranscript,    setPhoneTranscript]    = useState<TranscriptEntry[]>([]);
  const [phoneError,         setPhoneError]         = useState<string | null>(null);
  const [convStatus,         setConvStatus]         = useState<string>("");
  const [phoneCurrentStep,   setPhoneCurrentStep]   = useState<WorkflowStepId | null>(null);
  const [phoneCompletedSteps,setPhoneCompletedSteps]= useState<WorkflowStepId[]>([]);
  const [phoneFlaggedWarnings,setPhoneFlaggedWarnings]=useState<FlaggedWarning[]>([]);

  // Refs to read latest values inside event callbacks without setState-in-render issues
  const esRef               = useRef<EventSource | null>(null);
  const phoneTxRef          = useRef<TranscriptEntry[]>([]);
  const phoneCompletedRef   = useRef<WorkflowStepId[]>([]);
  const phoneFlaggedRef     = useRef<FlaggedWarning[]>([]);
  const phoneCurrentStepRef = useRef<WorkflowStepId | null>(null);
  const sessionPollRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Shared refs ──────────────────────────────────────────────────────────────
  const transcriptRef = useRef<HTMLDivElement>(null);
  const firedRef      = useRef(false);

  const isPhoneMode  = phoneNumber.trim().length > 0;

  // Unified display values — phone mode overrides browser mode
  const displayTranscript     = isPhoneMode ? phoneTranscript    : wsTranscript;
  const displayCurrentStep    = isPhoneMode ? phoneCurrentStep   : wsCurrentStep;
  const displayCompletedSteps = isPhoneMode ? phoneCompletedSteps: wsCompletedSteps;
  const displayWarnings       = isPhoneMode ? phoneFlaggedWarnings: wsFlaggedWarnings;
  const displayStatus = isPhoneMode
    ? (phoneStatus === "calling" ? "connecting" : phoneStatus === "connected" ? "connected" : "disconnected")
    : wsStatus;
  const isConnected  = isPhoneMode ? phoneStatus === "connected" : wsStatus === "connected";
  const isConnecting = isPhoneMode ? phoneStatus === "calling"   : wsStatus === "connecting";

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current)
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [displayTranscript]);

  // Bubble live transcript to parent for ComprehensionTranscript
  useEffect(() => {
    onTranscriptUpdate?.(displayTranscript);
  }, [displayTranscript]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup SSE + session polling on unmount
  useEffect(() => () => {
    esRef.current?.close();
    if (sessionPollRef.current) clearInterval(sessionPollRef.current);
  }, []);

  // ── Browser mode: fire onCallEnd on disconnect ───────────────────────────────
  useEffect(() => {
    if (isPhoneMode) return;
    if (wsStatus === "disconnected" && !firedRef.current) {
      firedRef.current = true;
      onCallEnd?.({
        completedSteps: wsCompletedSteps as unknown as string[],
        flaggedWarnings: wsFlaggedWarnings,
        transcript: wsTranscript.map((e) => `${e.role === "agent" ? "ALEX" : "PT"}: ${e.text}`).join("\n"),
      });
    }
    if (wsStatus === "connected") firedRef.current = false;
  }, [wsStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Live metric updates for parent ──────────────────────────────────────────
  useEffect(() => {
    if (!isPhoneMode) {
      onStepUpdate?.(wsCompletedSteps.length, wsFlaggedWarnings.length);
      onDetailedStepUpdate?.(wsCompletedSteps as unknown as string[], wsCurrentStep);
    }
  }, [wsCompletedSteps.length, wsCurrentStep, wsFlaggedWarnings.length, onStepUpdate, onDetailedStepUpdate, isPhoneMode]);

  useEffect(() => {
    if (isPhoneMode) {
      onStepUpdate?.(phoneCompletedSteps.length, phoneFlaggedWarnings.length);
      onDetailedStepUpdate?.(phoneCompletedSteps as unknown as string[], phoneCurrentStep);
    }
  }, [phoneCompletedSteps.length, phoneCurrentStep, phoneFlaggedWarnings.length, onStepUpdate, onDetailedStepUpdate, isPhoneMode]);

  // ── Speaking state for waveform ───────────────────────────────────────────
  useEffect(() => {
    if (!isPhoneMode) onSpeakingChange?.(isSpeaking);
  }, [isSpeaking, isPhoneMode, onSpeakingChange]);

  // ── Phone mode: infer step + warnings from a new transcript entry ────────────
  function processPhoneEntry(entry: TranscriptEntry) {
    // Step inference — only from agent turns (agent drives the workflow)
    if (entry.role === "agent") {
      const inferred = inferStepFromText(entry.text);
      if (inferred && !phoneCompletedRef.current.includes(inferred)) {
        // Complete the previous step when we advance to a new one
        const prev = phoneCurrentStepRef.current;
        if (prev && prev !== inferred && !phoneCompletedRef.current.includes(prev)) {
          phoneCompletedRef.current = [...phoneCompletedRef.current, prev];
          setPhoneCompletedSteps([...phoneCompletedRef.current]);
        }
        phoneCurrentStepRef.current = inferred;
        setPhoneCurrentStep(inferred);
      }
    }

    // Warning detection — from patient turns (patient reports symptoms)
    if (entry.role === "user") {
      const newWarnings = inferWarningsFromText(entry.text).filter(
        (w) => !phoneFlaggedRef.current.some((existing) => existing.sign === w.sign)
      );
      if (newWarnings.length > 0) {
        const withIds: FlaggedWarning[] = newWarnings.map((w) => ({
          id: Date.now() + Math.random(),
          ...w,
        }));
        phoneFlaggedRef.current = [...phoneFlaggedRef.current, ...withIds];
        setPhoneFlaggedWarnings([...phoneFlaggedRef.current]);
      }
    }
  }

  // ── Session-state polling (reads KV written by agent webhooks) ──────────────
  // Gives us live checkpoint updates during phone calls where ElevenLabs
  // doesn't stream transcript per-turn (Twilio limitation).
  function startSessionPolling(conversationId: string) {
    if (sessionPollRef.current) clearInterval(sessionPollRef.current);
    sessionPollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`/api/session-state?conversation_id=${conversationId}`);
        const d = await r.json();
        if (!d.found) return;

        // Webhook-reported step takes priority over transcript inference
        if (d.currentStep && d.currentStep !== phoneCurrentStepRef.current) {
          const incoming = d.currentStep as WorkflowStepId;
          // Complete the previous step if we've moved on
          const prev = phoneCurrentStepRef.current;
          if (prev && !phoneCompletedRef.current.includes(prev)) {
            phoneCompletedRef.current = [...phoneCompletedRef.current, prev];
            setPhoneCompletedSteps([...phoneCompletedRef.current]);
          }
          phoneCurrentStepRef.current = incoming;
          setPhoneCurrentStep(incoming);
        }

        // Merge KV warnings (agent called flag_warning_sign webhook)
        if (Array.isArray(d.flaggedWarnings) && d.flaggedWarnings.length > 0) {
          const newW = (d.flaggedWarnings as { sign: string; severity: string }[]).filter(
            (w) => !phoneFlaggedRef.current.some((e) => e.sign === w.sign)
          );
          if (newW.length > 0) {
            const withIds: FlaggedWarning[] = newW.map((w) => ({
              id: Date.now() + Math.random(),
              sign: w.sign,
              severity: (w.severity === "urgent" ? "urgent" : "warning") as "urgent" | "warning",
            }));
            phoneFlaggedRef.current = [...phoneFlaggedRef.current, ...withIds];
            setPhoneFlaggedWarnings([...phoneFlaggedRef.current]);
          }
        }
      } catch { /* silent — network blip, keep polling */ }
    }, 2000);
  }

  function stopSessionPolling() {
    if (sessionPollRef.current) { clearInterval(sessionPollRef.current); sessionPollRef.current = null; }
  }

  // ── Phone call start ─────────────────────────────────────────────────────────
  async function startPhoneCall() {
    // Reset all phone-mode state
    phoneTxRef.current          = [];
    phoneCompletedRef.current   = [];
    phoneFlaggedRef.current     = [];
    phoneCurrentStepRef.current = null;
    setPhoneStatus("calling");
    setPhoneTranscript([]);
    setPhoneError(null);
    setConvStatus("");
    setPhoneCurrentStep(null);
    setPhoneCompletedSteps([]);
    setPhoneFlaggedWarnings([]);
    firedRef.current = false;
    onCallStart?.();

    try {
      const res = await fetch("/api/outbound-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phoneNumber.trim(), scenarioId: scenarioId ?? "maria" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start call");

      // Robustly extract conversation ID regardless of casing
      const conversationId: string = data.conversation_id ?? data.conversationId ?? "";
      if (!conversationId) throw new Error("ElevenLabs did not return a conversation_id");

      setPhoneStatus("connected");

      // Start polling KV session state so checkpoints update live during the call.
      // (ElevenLabs doesn't stream per-turn transcript for Twilio calls.)
      startSessionPolling(conversationId);

      const es = new EventSource(`/api/conversation-stream?conversationId=${conversationId}`);
      esRef.current = es;

      es.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);

        if (msg.type === "status") {
          setConvStatus(msg.convStatus);

        } else if (msg.type === "transcript") {
          const entry: TranscriptEntry = {
            id: Date.now() + Math.random(),
            role: msg.role === "agent" ? "agent" : "user",
            text: msg.text,
          };
          phoneTxRef.current = [...phoneTxRef.current, entry];
          setPhoneTranscript([...phoneTxRef.current]);
          processPhoneEntry(entry);

        } else if (msg.type === "end") {
          // Full transcript is now in phoneTxRef — stop polling and fire onCallEnd
          stopSessionPolling();
          // Mark the last active step as completed before ending
          const last = phoneCurrentStepRef.current;
          if (last && !phoneCompletedRef.current.includes(last)) {
            phoneCompletedRef.current = [...phoneCompletedRef.current, last];
            setPhoneCompletedSteps([...phoneCompletedRef.current]);
          }
          setPhoneStatus("done");
          es.close();
          if (!firedRef.current) {
            firedRef.current = true;
            onCallEnd?.({
              completedSteps: phoneCompletedRef.current as unknown as string[],
              flaggedWarnings: phoneFlaggedRef.current,
              transcript: phoneTxRef.current
                .map((e) => `${e.role === "agent" ? "ALEX" : "PT"}: ${e.text}`)
                .join("\n"),
            });
          }

        } else if (msg.type === "poll_error") {
          console.warn("[conversation-stream] poll error", msg);
          setConvStatus(`poll error — ${msg.httpStatus ?? msg.message ?? "unknown"}`);
        }
      };

      // onerror fires when: (a) Vercel drops the SSE connection, (b) server closes
      // after sending the "end" event. In case (b) firedRef is already true so
      // onCallEnd won't double-fire. In case (a) we surface whatever we have.
      es.onerror = () => {
        stopSessionPolling();
        setPhoneStatus("done");
        es.close();
        if (!firedRef.current) {
          firedRef.current = true;
          const last = phoneCurrentStepRef.current;
          if (last && !phoneCompletedRef.current.includes(last)) {
            phoneCompletedRef.current = [...phoneCompletedRef.current, last];
            setPhoneCompletedSteps([...phoneCompletedRef.current]);
          }
          onCallEnd?.({
            completedSteps: phoneCompletedRef.current as unknown as string[],
            flaggedWarnings: phoneFlaggedRef.current,
            transcript: phoneTxRef.current
              .map((e) => `${e.role === "agent" ? "ALEX" : "PT"}: ${e.text}`)
              .join("\n"),
          });
        }
      };

    } catch (err: unknown) {
      setPhoneError(err instanceof Error ? err.message : "Unknown error");
      setPhoneStatus("error");
    }
  }

  function endPhoneCall() {
    stopSessionPolling();
    esRef.current?.close();
    const last = phoneCurrentStepRef.current;
    if (last && !phoneCompletedRef.current.includes(last)) {
      phoneCompletedRef.current = [...phoneCompletedRef.current, last];
      setPhoneCompletedSteps([...phoneCompletedRef.current]);
    }
    setPhoneStatus("done");
    if (!firedRef.current) {
      firedRef.current = true;
      onCallEnd?.({
        completedSteps: phoneCompletedRef.current as unknown as string[],
        flaggedWarnings: phoneFlaggedRef.current,
        transcript: phoneTxRef.current
          .map((e) => `${e.role === "agent" ? "ALEX" : "PT"}: ${e.text}`)
          .join("\n"),
      });
    }
  }

  // ── Unified button handlers ──────────────────────────────────────────────────
  function handleStart() {
    if (isPhoneMode) { startPhoneCall(); }
    else { wsStartCall(); onCallStart?.(); }
  }

  function handleEnd() {
    if (isPhoneMode) { endPhoneCall(); }
    else {
      wsEndCall();
      onCallEnd?.({
        completedSteps: wsCompletedSteps as unknown as string[],
        flaggedWarnings: wsFlaggedWarnings,
        transcript: wsTranscript.map((e) => `${e.role === "agent" ? "ALEX" : "PT"}: ${e.text}`).join("\n"),
      });
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", fontFamily: "var(--font-body)" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: "var(--text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            Voice Agent
          </span>
          <StatusDot status={displayStatus} isSpeaking={!isPhoneMode && isSpeaking} />
        </div>
        <button
          onClick={isConnected ? handleEnd : handleStart}
          disabled={isConnecting}
          className={isConnected ? "neu-btn neu-btn-danger" : "neu-btn neu-btn-primary"}
          style={{
            padding: "7px 18px", fontSize: 11, fontWeight: 600,
            cursor: isConnecting ? "not-allowed" : "pointer",
            opacity: isConnecting ? 0.6 : 1,
          }}
        >
          {isConnecting ? (isPhoneMode ? "Dialing…" : "Connecting…") : isConnected ? "End Call" : "Start Call"}
        </button>
      </div>

      {/* ── Phone status hint ── */}
      {isPhoneMode && (
        <div style={{ fontSize: 10, height: 14, letterSpacing: "0.02em" }}>
          {phoneStatus === "calling" && (
            <span style={{ color: "var(--warning-amber)" }}>◌ Dialing {phoneNumber.trim()}…</span>
          )}
          {phoneStatus === "connected" && (
            <span style={{ color: "var(--accent-success)" }}>
              ● Live — ElevenLabs: {convStatus || "waiting…"}
            </span>
          )}
          {phoneStatus === "error" && phoneError && (
            <span style={{ color: "var(--warning-red)" }}>{phoneError}</span>
          )}
        </div>
      )}

      {/* ── Body ── */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 172px", gap: 12, minHeight: 0 }}>

        {/* LEFT: transcript */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5, minHeight: 0 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, color: "var(--text-tertiary)",
            letterSpacing: "0.1em", textTransform: "uppercase",
          }}>
            Live Transcript
            {isPhoneMode && (
              <span style={{ fontWeight: 400, marginLeft: 6, letterSpacing: "0.03em", textTransform: "none" }}>
                (~1–2 s delay)
              </span>
            )}
          </span>
          <div
            ref={transcriptRef}
            style={{
              flex: 1, overflowY: "auto",
              background: "var(--surface-inset)",
              boxShadow: "inset 4px 4px 10px var(--shadow-dark), inset -4px -4px 10px var(--shadow-light)",
              borderRadius: 10, padding: "10px 12px",
              display: "flex", flexDirection: "column", gap: 8,
            }}
          >
            {displayTranscript.length === 0 ? (
              <p style={{
                color: "var(--text-tertiary)", fontSize: 11,
                textAlign: "center", marginTop: 20,
                fontStyle: "italic", fontWeight: 300,
              }}>
                {isConnected
                  ? (isPhoneMode ? "Waiting for first turn…" : "Listening…")
                  : "Start a call to see the live transcript."}
              </p>
            ) : (
              displayTranscript.map((entry) => (
                <div key={entry.id} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, fontFamily: "monospace",
                    color: entry.role === "agent" ? "var(--accent-clinical)" : "var(--accent-success)",
                    paddingTop: 2, flexShrink: 0, width: 26, letterSpacing: "0.04em",
                  }}>
                    {entry.role === "agent" ? "AI" : "PT"}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-primary)", lineHeight: 1.5 }}>
                    {entry.text}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: workflow + warnings */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 0, overflow: "hidden" }}>

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{
              fontSize: 9, fontWeight: 700,
              color: "var(--text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              Workflow
            </span>
            <div style={{
              background: "var(--surface-inset)",
              boxShadow: "inset 4px 4px 10px var(--shadow-dark), inset -4px -4px 10px var(--shadow-light)",
              borderRadius: 10, padding: "8px 10px",
              display: "flex", flexDirection: "column", gap: 4,
            }}>
              {WORKFLOW_STEPS.map((step) => {
                const isDone    = displayCompletedSteps.includes(step.id);
                const isActive  = displayCurrentStep === step.id && !isDone;
                const isPending = !isDone && !isActive && displayCurrentStep !== null;
                return (
                  <div key={step.id} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    opacity: isPending ? 0.35 : 1,
                    transition: "opacity 0.3s ease",
                  }}>
                    <div style={{
                      width: 13, height: 13, borderRadius: "50%", flexShrink: 0,
                      background: isDone ? "var(--accent-success)" : isActive ? "var(--accent-clinical)" : "var(--shadow-dark)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 7, color: "#fff", fontWeight: 700,
                      ...(isActive ? { animation: "pulseRing 1.4s ease-in-out infinite" } : {}),
                    }}>
                      {isDone ? "✓" : ""}
                    </div>
                    <span style={{
                      fontSize: 10, lineHeight: 1.3,
                      color: isDone ? "var(--accent-success)" : isActive ? "var(--accent-clinical)" : "var(--text-secondary)",
                      fontWeight: isActive ? 600 : 400,
                    }}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {displayWarnings.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{
                fontSize: 9, fontWeight: 700,
                color: "var(--warning-red)", letterSpacing: "0.1em", textTransform: "uppercase",
              }}>
                ⚠ Warnings
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" }}>
                {displayWarnings.map((w) => (
                  <div key={w.id} style={{
                    background: w.severity === "urgent" ? "var(--warning-red-bg)" : "var(--warning-amber-bg)",
                    borderLeft: `2px solid ${w.severity === "urgent" ? "var(--warning-red)" : "var(--warning-amber)"}`,
                    borderRadius: "0 8px 8px 0",
                    padding: "6px 8px",
                  }}>
                    <div style={{
                      fontSize: 8, fontWeight: 700, letterSpacing: "0.08em",
                      color: w.severity === "urgent" ? "var(--warning-red)" : "var(--warning-amber)",
                      marginBottom: 2, textTransform: "uppercase",
                    }}>
                      {w.severity}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-primary)" }}>{w.sign}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulseRing { 0%,100%{box-shadow:0 0 0 2px rgba(59,111,160,0.26)} 50%{box-shadow:0 0 0 5px rgba(59,111,160,0.07)} }
        @keyframes pulse     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
      `}</style>
    </div>
  );
}

// ── Status dot ────────────────────────────────────────────────────────────────
function StatusDot({ status, isSpeaking }: { status: string; isSpeaking: boolean }) {
  const color = status === "connected" ? (isSpeaking ? C.accent : C.green) : status === "connecting" ? C.amber : C.muted;
  const label = status === "connected" ? (isSpeaking ? "Speaking" : "Listening") : status === "connecting" ? "Connecting" : "Idle";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, ...(status === "connected" ? { animation: "pulse 1.5s ease-in-out infinite" } : {}) }} />
      <span style={{ fontSize: 10, color, fontFamily: "monospace", fontWeight: 600 }}>{label}</span>
    </div>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────
export default function VoiceAgentPanel({
  onCallStart, onCallEnd, onStepUpdate, onDetailedStepUpdate, onSpeakingChange,
  onTranscriptUpdate, patientData, scenarioId,
}: {
  onCallStart?: () => void;
  onCallEnd?: (data: { completedSteps: string[]; flaggedWarnings: { sign: string; severity: string }[]; transcript: string }) => void;
  onStepUpdate?: (steps: number, warnings: number) => void;
  onDetailedStepUpdate?: (completedSteps: string[], currentStep: string | null) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
  onTranscriptUpdate?: (transcript: TranscriptEntry[]) => void;
  patientData?: PatientVoiceData;
  scenarioId?: string;
}) {
  const [phoneNumber, setPhoneNumber] = useState("");

  return (
    <ConversationProvider>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 4 }}>
        <label style={{
          fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
          textTransform: "uppercase", color: "var(--text-tertiary)",
          fontFamily: "var(--font-body)",
        }}>
          Outbound Phone Number
          <span style={{ fontWeight: 400, fontSize: 9, marginLeft: 6, color: "var(--text-tertiary)", opacity: 0.7 }}>
            (leave blank for browser mic)
          </span>
        </label>
        <div style={{
          background: "var(--surface-inset)",
          boxShadow: "inset 4px 4px 10px var(--shadow-dark), inset -4px -4px 10px var(--shadow-light)",
          borderRadius: 12,
          display: "flex", alignItems: "center", gap: 8,
          padding: "9px 14px",
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.7A2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.16 6.16l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
          </svg>
          <input
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            style={{
              border: "none", outline: "none", background: "transparent",
              fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 400,
              color: "var(--text-primary)", width: "100%",
            }}
          />
        </div>
      </div>
      <VoiceAgentInner
        phoneNumber={phoneNumber}
        patientData={patientData}
        scenarioId={scenarioId}
        onCallStart={onCallStart}
        onCallEnd={onCallEnd}
        onStepUpdate={onStepUpdate}
        onDetailedStepUpdate={onDetailedStepUpdate}
        onSpeakingChange={onSpeakingChange}
        onTranscriptUpdate={onTranscriptUpdate}
      />
    </ConversationProvider>
  );
}
