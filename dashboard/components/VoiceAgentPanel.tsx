"use client";
import { useEffect, useRef, useState } from "react";
import { ConversationProvider } from "@elevenlabs/react";
import { useVoiceAgent, WORKFLOW_STEPS } from "@/lib/useVoiceAgent";
import type { TranscriptEntry, WorkflowStepId, FlaggedWarning } from "@/lib/useVoiceAgent";

const C = {
  accent: "#2563eb", green: "#16a34a", amber: "#d97706",
  red: "#dc2626", muted: "#6b7a9e", border: "#dde3f5", text: "#1a2340",
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
  onCallStart,
  onCallEnd,
  onStepUpdate,
}: {
  phoneNumber: string;
  onCallStart?: () => void;
  onCallEnd?: (data: {
    completedSteps: string[];
    flaggedWarnings: { sign: string; severity: string }[];
    transcript: string;
  }) => void;
  onStepUpdate?: (steps: number, warnings: number) => void;
  patientName?: string;
  languageCode?: string;
}) {
  // ── Browser-WebSocket mode ───────────────────────────────────────────────────
  const {
    status: wsStatus, isSpeaking,
    transcript: wsTranscript,
    currentStep: wsCurrentStep,
    completedSteps: wsCompletedSteps,
    flaggedWarnings: wsFlaggedWarnings,
    startCall: wsStartCall, endCall: wsEndCall,
  } = useVoiceAgent();

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

  // Cleanup SSE on unmount
  useEffect(() => () => { esRef.current?.close(); }, []);

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
    if (!isPhoneMode)
      onStepUpdate?.(wsCompletedSteps.length, wsFlaggedWarnings.length);
  }, [wsCompletedSteps.length, wsFlaggedWarnings.length, onStepUpdate, isPhoneMode]);

  useEffect(() => {
    if (isPhoneMode)
      onStepUpdate?.(phoneCompletedSteps.length, phoneFlaggedWarnings.length);
  }, [phoneCompletedSteps.length, phoneFlaggedWarnings.length, onStepUpdate, isPhoneMode]);

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
        body: JSON.stringify({ phoneNumber: phoneNumber.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start call");

      // Robustly extract conversation ID regardless of casing
      const conversationId: string = data.conversation_id ?? data.conversationId ?? "";
      if (!conversationId) throw new Error("ElevenLabs did not return a conversation_id");

      setPhoneStatus("connected");

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

      es.onerror = () => { setPhoneStatus("done"); es.close(); };

    } catch (err: unknown) {
      setPhoneError(err instanceof Error ? err.message : "Unknown error");
      setPhoneStatus("error");
    }
  }

  function endPhoneCall() {
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
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%", fontFamily: "'Outfit', system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Voice Agent</span>
          <StatusDot status={displayStatus} isSpeaking={!isPhoneMode && isSpeaking} />
        </div>
        <button
          onClick={isConnected ? handleEnd : handleStart}
          disabled={isConnecting}
          style={{
            padding: "6px 16px", borderRadius: 8, border: "none",
            cursor: isConnecting ? "not-allowed" : "pointer",
            fontFamily: "inherit", fontSize: 12, fontWeight: 600,
            background: isConnected ? C.red : C.accent, color: "#fff",
            opacity: isConnecting ? 0.6 : 1, transition: "background 0.2s",
          }}
        >
          {isConnecting ? (isPhoneMode ? "Dialing…" : "Connecting…") : isConnected ? "End Call" : "Start Call"}
        </button>
      </div>

      {/* ── Phone status hint ── */}
      {isPhoneMode && (
        <div style={{ fontSize: 10, height: 16 }}>
          {phoneStatus === "calling" && <span style={{ color: C.amber }}>◌ Dialing {phoneNumber.trim()}…</span>}
          {phoneStatus === "connected" && (
            <span style={{ color: C.green }}>
              ● Live — ElevenLabs: {convStatus || "waiting…"}
            </span>
          )}
          {phoneStatus === "error" && phoneError && <span style={{ color: C.red }}>{phoneError}</span>}
        </div>
      )}

      {/* ── Body ── */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 180px", gap: 14, minHeight: 0 }}>

        {/* LEFT: transcript */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: C.muted, letterSpacing: "0.6px", textTransform: "uppercase" }}>
            Live Transcript
            {isPhoneMode && <span style={{ fontWeight: 400, marginLeft: 6 }}>(per-turn, ~1–2 s delay)</span>}
          </span>
          <div ref={transcriptRef} style={{ flex: 1, overflowY: "auto", background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
            {displayTranscript.length === 0 ? (
              <p style={{ color: C.muted, fontSize: 11, textAlign: "center", marginTop: 20 }}>
                {isConnected ? (isPhoneMode ? "Waiting for first turn…" : "Listening…") : "Start a call to see the live transcript."}
              </p>
            ) : (
              displayTranscript.map((entry) => (
                <div key={entry.id} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, fontFamily: "monospace", color: entry.role === "agent" ? C.accent : C.green, paddingTop: 2, flexShrink: 0, width: 28 }}>
                    {entry.role === "agent" ? "ALEX" : "PT"}
                  </span>
                  <span style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{entry.text}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: workflow + warnings */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 0, overflow: "hidden" }}>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: C.muted, letterSpacing: "0.6px", textTransform: "uppercase" }}>Workflow</span>
            <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 5 }}>
              {WORKFLOW_STEPS.map((step) => {
                const isDone    = displayCompletedSteps.includes(step.id);
                const isActive  = displayCurrentStep === step.id && !isDone;
                const isPending = !isDone && !isActive && displayCurrentStep !== null;
                return (
                  <div key={step.id} style={{ display: "flex", alignItems: "center", gap: 6, opacity: isPending ? 0.4 : 1 }}>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", flexShrink: 0, background: isDone ? C.green : isActive ? C.accent : C.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: "#fff", fontWeight: 700, ...(isActive ? { animation: "pulseRing 1.4s ease-in-out infinite" } : {}) }}>
                      {isDone ? "✓" : ""}
                    </div>
                    <span style={{ fontSize: 10, lineHeight: 1.3, color: isDone ? C.green : isActive ? C.accent : C.text, fontWeight: isActive ? 700 : 400 }}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {displayWarnings.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: C.red, letterSpacing: "0.6px", textTransform: "uppercase" }}>⚠ Warnings</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" }}>
                {displayWarnings.map((w) => (
                  <div key={w.id} style={{ background: w.severity === "urgent" ? "#fef2f2" : "#fffbeb", border: `1px solid ${w.severity === "urgent" ? "#fecaca" : "#fde68a"}`, borderRadius: 8, padding: "6px 8px" }}>
                    <div style={{ fontSize: 8, fontWeight: 700, fontFamily: "monospace", color: w.severity === "urgent" ? C.red : C.amber, marginBottom: 2 }}>{w.severity.toUpperCase()}</div>
                    <div style={{ fontSize: 10, color: C.text }}>{w.sign}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulseRing { 0%,100%{box-shadow:0 0 0 2px ${C.accent}44} 50%{box-shadow:0 0 0 5px ${C.accent}11} }
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
  onCallStart, onCallEnd, onStepUpdate,
}: {
  onCallStart?: () => void;
  onCallEnd?: (data: { completedSteps: string[]; flaggedWarnings: { sign: string; severity: string }[]; transcript: string }) => void;
  onStepUpdate?: (steps: number, warnings: number) => void;
  patientName?: string;
  languageCode?: string;
}) {
  const [phoneNumber, setPhoneNumber] = useState("");

  return (
    <ConversationProvider>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 4 }}>
        <label style={{ fontSize: 10, fontWeight: 600, color: "#6b7a9e", letterSpacing: "0.6px", textTransform: "uppercase", fontFamily: "'Outfit', system-ui, sans-serif" }}>
          Outbound Phone Number
          <span style={{ fontWeight: 400, fontSize: 9, marginLeft: 6 }}>(leave blank to use browser mic)</span>
        </label>
        <input
          type="tel"
          placeholder="+1 (555) 000-0000"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #dde3f5", fontSize: 12, fontFamily: "monospace", color: "#1a2340", background: "#fff", outline: "none", width: "100%", boxSizing: "border-box" }}
        />
      </div>
      <VoiceAgentInner phoneNumber={phoneNumber} onCallStart={onCallStart} onCallEnd={onCallEnd} onStepUpdate={onStepUpdate} />
    </ConversationProvider>
  );
}
