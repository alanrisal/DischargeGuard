"use client";
import { useEffect, useRef, useState } from "react";
import { ConversationProvider } from "@elevenlabs/react";
import { useVoiceAgent, WORKFLOW_STEPS } from "@/lib/useVoiceAgent";
import { CheckCircle2, ChevronRight, AlertTriangle, ShieldCheck } from "lucide-react";

const C = {
  accent:  "var(--md-sys-color-primary)",
  green:   "#0d9488",
  amber:   "#d97706",
  red:     "#ef4444",
  blue:    "#2563eb",
  muted:   "#9ca3af",
  border:  "rgba(0,0,0,0.05)",
  text:    "#1a1a2e",
};

const glassCSS = {
  background: "rgba(255,255,255,0.75)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  borderRadius: 20,
  border: "none",
  boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
};

const uppercaseLabelCSS = {
  fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#9ca3af",
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

  const [callStatus, setCallStatus] = useState<'idle' | 'active' | 'ended'>('idle');
  const [callTime, setCallTime] = useState("0:00");
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current!.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / bufferLength;
      const centerY = canvas.height / 2;

      dataArray.forEach((val, i) => {
        const barHeight = (val / 255) * (canvas.height * 0.45);
        const x = i * barWidth;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.beginPath();
        ctx.roundRect(x + 1, centerY - barHeight, barWidth - 2, barHeight, 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
        ctx.beginPath();
        ctx.roundRect(x + 1, centerY, barWidth - 2, barHeight, 2);
        ctx.fill();
      });
    };
    draw();
  };

  const drawSimulatedWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let tick = 0;

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bars = 32;
      const barWidth = canvas.width / bars;
      const centerY = canvas.height / 2;

      for (let i = 0; i < bars; i++) {
        const MathSin = Math.sin;
        const height = (
          MathSin(tick * 0.04 + i * 0.5) * 0.3 + MathSin(tick * 0.07 + i * 0.3) * 0.2 + 0.15
        ) * canvas.height * 0.45;

        const x = i * barWidth;
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.beginPath();
        ctx.roundRect(x + 1, centerY - height, barWidth - 2, height, 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.09)';
        ctx.beginPath();
        ctx.roundRect(x + 1, centerY, barWidth - 2, height, 2);
        ctx.fill();
      }
      tick++;
    };
    draw();
  };

  const startAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 128;
      source.connect(analyserRef.current);
      drawWaveform();
    } catch (e) {
      console.warn('Microphone access denied — using simulated waveform');
      drawSimulatedWaveform();
    }
  };

  const stopAudio = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    };
  }, []);

  const handleCallButton = () => {
    if (callStatus === 'idle' || callStatus === 'ended') {
      setCallStatus('active');
      setCallTime("0:00");
      startRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const s = Math.floor((Date.now() - startRef.current) / 1000);
        const m = Math.floor(s / 60);
        const sec = s % 60;
        setCallTime(`${m}:${sec.toString().padStart(2, "0")}`);
      }, 500);

      startAudio();
      startCall();
      onCallStart?.();
    } else if (callStatus === 'active') {
      setCallStatus('ended');
      if (timerRef.current) clearInterval(timerRef.current);
      stopAudio();
      endCall();
      onCallEnd?.({
        completedSteps: completedSteps as unknown as string[],
        flaggedWarnings,
        transcript: transcript.map((e) => `${e.role === "agent" ? "ALEX" : "PT"}: ${e.text}`).join("\n"),
      });
    }
  };

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

  useEffect(() => {
    if (callStatus === "active" && status === "disconnected" && !firedRef.current) {
      firedRef.current = true;
      setCallStatus('ended');
      if (timerRef.current) clearInterval(timerRef.current);
      stopAudio();
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
        body: JSON.stringify({ phoneNumber: phoneNumber.trim() }),
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

  const connecting = status === "connecting";
  const compScore = Math.round((completedSteps.length / 9) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%", fontFamily: "'Inter', sans-serif" }}>

      {/* ── Top Card: Voice Agent + Call Controls ── */}
      <div style={{ ...glassCSS, padding: "10px 16px", flexShrink: 0 }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Voice Agent</span>
            <StatusDot callStatus={callStatus} />
          </div>
          <button
            onClick={handleCallButton}
            className="call-btn"
            style={{
              position: 'relative', zIndex: 1, overflow: 'hidden',
              background: callStatus === 'active' ? '#991b1b' : '#0d9488', color: '#ffffff',
              height: 44, borderRadius: 999, padding: '0 24px', fontSize: 14, fontWeight: 700,
              border: 'none', cursor: 'pointer', minWidth: 140,
              transition: 'background 0.3s ease, transform 0.15s ease',
            }}
          >
            <canvas ref={canvasRef} width={180} height={44} style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              opacity: callStatus === 'active' ? 1 : 0, transition: 'opacity 0.5s ease', pointerEvents: 'none',
            }}/>
            <span style={{ position: 'relative', zIndex: 2, pointerEvents: 'none' }}>
              {callStatus === 'active' ? 'End Call' : 'Start Call'}
            </span>
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexShrink: 0 }}>
          {/* Steps Done */}
          <div style={{ background: "rgba(255,255,255,0.8)", borderRadius: 10, padding: "6px 10px", flex: 1, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.green }}>{completedSteps.length}/9</div>
            <div style={{ fontSize: 10, color: "#6b7280" }}>Steps Done</div>
          </div>
          {/* Comprehension */}
          <div style={{ background: "rgba(255,255,255,0.8)", borderRadius: 10, padding: "6px 10px", flex: 1, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.red }}>{compScore}%</div>
            <div style={{ fontSize: 10, color: "#6b7280" }}>Comprehension</div>
          </div>
          {/* Call Duration */}
          <div style={{ background: "rgba(255,255,255,0.8)", borderRadius: 10, padding: "6px 10px", flex: 1, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.blue }}>{callTime}</div>
            <div style={{ fontSize: 10, color: "#6b7280" }}>Call Duration</div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Live Transcript — grows when expanded ── */}
      <div style={{
        ...glassCSS,
        flex: transcriptExpanded ? '1 1 100%' : '1 1 0%',
        minHeight: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        padding: "16px 20px",
        transition: 'flex 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Headers */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 16, marginBottom: 12, flexShrink: 0, alignItems: "center" }}>
          <div style={{ ...uppercaseLabelCSS, margin: 0 }}>LIVE TRANSCRIPT</div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ ...uppercaseLabelCSS, margin: 0 }}>WORKFLOW</div>
            <button
              onClick={() => setTranscriptExpanded(prev => !prev)}
              style={{
                marginLeft: 'auto', width: '26px', height: '26px', borderRadius: '8px',
                border: 'none', background: 'rgba(13,148,136,0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(13,148,136,0.22)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(13,148,136,0.10)'}
              title={transcriptExpanded ? 'Collapse transcript' : 'Expand transcript'}
            >
              {transcriptExpanded ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="4 14 10 14 10 20"/>
                  <polyline points="20 10 14 10 14 4"/>
                  <line x1="10" y1="14" x2="3" y2="21"/>
                  <line x1="21" y1="3" x2="14" y2="10"/>
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="15 3 21 3 21 9"/>
                  <polyline points="9 21 3 21 3 15"/>
                  <line x1="21" y1="3" x2="14" y2="10"/>
                  <line x1="3" y1="21" x2="10" y2="14"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Content Side by Side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 16, height: "calc(100% - 24px)", minHeight: 0 }}>
          {/* Transcript Scroll Area */}
          <div ref={transcriptRef} style={{
            background: "rgba(255,255,255,0.5)", borderRadius: 14, padding: 16, overflowY: "auto",
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            {transcript.length === 0 ? (
              <p style={{ color: C.muted, fontSize: 13, fontStyle: "italic", textAlign: "center", marginTop: 20 }}>
                {callStatus === 'active' ? "Listening…" : "Start a call to see the live transcript."}
              </p>
            ) : (
              displayTranscript.map((entry) => (
                <div key={entry.id} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: entry.role === "agent" ? C.accent : C.green, paddingTop: 2, flexShrink: 0, width: 34 }}>
                    {entry.role === "agent" ? "ALEX" : "PT"}
                  </span>
                  <span style={{ fontSize: 13, fontStyle: "italic", color: C.text, lineHeight: 1.5 }}>
                    {entry.text}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Workflow Checklist Right Side */}
          <div style={{ overflowY: "auto", paddingRight: 4, display: "flex", flexDirection: "column" }}>
            {WORKFLOW_STEPS.map((step) => {
              const isDone = completedSteps.includes(step.id);
              const isActive = currentStep === step.id && !isDone;
              return (
                <div key={step.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", opacity: (!isDone && !isActive && currentStep !== null) ? 0.4 : 1 }}>
                  {isDone ? (
                    <CheckCircle2 size={14} color={C.green} />
                  ) : isActive ? (
                    <div style={{ width: 14, height: 14, borderRadius: "50%", background: C.green, display: "flex", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #d1d5db", flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: 13, color: "#374151", fontWeight: isDone || isActive ? 600 : 400 }}>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Row 3: Bottom row (Call Highlights + Warnings) — collapses when expanded ── */}
      <div style={{
        flexShrink: 0,
        overflow: 'hidden',
        maxHeight: transcriptExpanded ? '0px' : '300px',
        opacity: transcriptExpanded ? 0 : 1,
        pointerEvents: transcriptExpanded ? 'none' : 'auto',
        transition: [
          'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          `opacity 0.25s ease ${transcriptExpanded ? '0s' : '0.1s'}`
        ].join(', '),
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, paddingTop: "0px" }}>
        {/* Call Highlights */}
        <div style={{ ...glassCSS, padding: "16px 20px" }}>
          <div style={{ ...uppercaseLabelCSS, marginBottom: 12 }}>CALL HIGHLIGHTS</div>
          <div style={{
            background: "#d1fae5", borderLeft: "4px solid #0d9488", borderRadius: "0 12px 12px 0",
            padding: "16px", display: "flex", gap: 14, alignItems: "flex-start",
          }}>
            <div style={{ width: 24, height: 24, flexShrink: 0, display: "flex" }}>
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: "rotate(-35deg)", display: "block" }}>
                <rect x="6" y="10" width="20" height="12" rx="6" fill="white" stroke="#0d9488" strokeWidth="2.5" />
                <path d="M6 16C6 12.6863 8.68629 10 12 10H16V22H12C8.68629 22 6 19.3137 6 16Z" fill="#0d9488"/>
                <line x1="16" y1="10" x2="16" y2="22" stroke="#0d9488" strokeWidth="2.5"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#065f46" }}>New Medication Conflict</div>
              <div style={{ fontSize: 13, color: "#065f46" }}>Patient reported mild nausea after starting Ibuprofen. Advised taking with meals.</div>
            </div>
          </div>
        </div>

        {/* Warnings Card */}
        <div style={{ ...glassCSS, padding: "16px 20px", overflowY: "auto", maxHeight: 200 }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                background: "#991b1b", color: "white", borderRadius: 10,
                padding: "4px 12px", fontSize: 20, fontWeight: 700,
              }}>
                {flaggedWarnings.length}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>Warnings</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>
                  {flaggedWarnings.length === 0 ? "No issues detected" : "Requires attention"}
                </div>
              </div>
            </div>
            <div style={uppercaseLabelCSS}>THIS SESSION</div>
          </div>

          {/* Warning items list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {flaggedWarnings.length === 0 ? (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", padding: "32px 16px", gap: 10
              }}>
                <ShieldCheck size={36} color="#0d9488" opacity={0.4} />
                <div style={{ fontSize: 13, color: "#9ca3af", textAlign: "center" }}>No warnings this session</div>
              </div>
            ) : (
              flaggedWarnings.map((w, i) => (
                <div key={w.id || i} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  background: "#fef2f2", borderRadius: 12, padding: "12px 14px", borderLeft: "3px solid #991b1b"
                }}>
                  <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e", textTransform: "capitalize" }}>
                      {w.severity} Alert
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{w.sign}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>Just now</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      </div>

      <style>{`
        .call-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.08);
        }
        .call-btn:active {
          transform: translateY(1px);
          filter: brightness(0.95);
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.4); }
        }
        .dot-live { animation: pulse-dot 1.5s ease infinite; }
        @keyframes pulseRing {
          0%, 100% { box-shadow: 0 0 0 2px ${C.accent}44; }
          50%       { box-shadow: 0 0 0 5px ${C.accent}11; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </div>
  );
}

// ── Status indicator ──────────────────────────────────────────────────────────
function StatusDot({ callStatus }: { callStatus: 'idle' | 'active' | 'ended' }) {
  const color = callStatus === 'idle' ? '#9ca3af' : callStatus === 'active' ? '#22c55e' : '#9ca3af';
  const label = callStatus === 'idle' ? 'Idle' : callStatus === 'active' ? 'Live' : 'Idle';

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div className={callStatus === 'active' ? "dot-live" : ""} style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>{label}</span>
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
