"use client";
import { useEffect, useRef, useState } from "react";
import { ConversationProvider } from "@elevenlabs/react";
import { useVoiceAgent, WORKFLOW_STEPS } from "@/lib/useVoiceAgent";
import { CheckCircle2, ChevronRight } from "lucide-react";

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

// ── Inner panel (must live inside ConversationProvider) ───────────────────────
function VoiceAgentInner({ onCallStart, onCallEnd, onStepUpdate }: {
  onCallStart?: () => void;
  onCallEnd?: (data: { completedSteps: string[]; flaggedWarnings: { sign: string; severity: string }[]; transcript: string }) => void;
  onStepUpdate?: (steps: number, warnings: number) => void;
}) {
  const {
    status, isSpeaking,
    transcript, currentStep, completedSteps, flaggedWarnings,
    startCall, endCall,
  } = useVoiceAgent();

  const [callStatus, setCallStatus] = useState<'idle' | 'active' | 'ended'>('idle');
  const [callTime, setCallTime] = useState("0:00");
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

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  useEffect(() => {
    if (callStatus === "active" && status === "disconnected" && !firedRef.current) {
      firedRef.current = true;
      setCallStatus('ended');
      if (timerRef.current) clearInterval(timerRef.current);
      stopAudio();
      onCallEnd?.({
        completedSteps: completedSteps as unknown as string[],
        flaggedWarnings,
        transcript: transcript.map((e) => `${e.role === "agent" ? "ALEX" : "PT"}: ${e.text}`).join("\n"),
      });
    }
    if (status === "connected") {
      firedRef.current = false; // reset for next call
    }
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify parent of live metric updates
  useEffect(() => {
    onStepUpdate?.(completedSteps.length, flaggedWarnings.length);
  }, [completedSteps.length, flaggedWarnings.length, onStepUpdate]);

  const connecting = status === "connecting";
  const compScore = Math.round((completedSteps.length / 9) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%", fontFamily: "'Inter', sans-serif" }}>

      {/* ── Top Card: Voice Agent + Call Controls ── */}
      <div style={{ ...glassCSS, padding: 20, flexShrink: 0 }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: C.text }}>Voice Agent</span>
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
        <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
          {/* Steps Done */}
          <div style={{ background: "rgba(255,255,255,0.8)", borderRadius: 12, padding: "10px 16px", flex: 1, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.green }}>{completedSteps.length}/9</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>Steps Done</div>
          </div>
          {/* Comprehension */}
          <div style={{ background: "rgba(255,255,255,0.8)", borderRadius: 12, padding: "10px 16px", flex: 1, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.red }}>{compScore}%</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>Comprehension</div>
          </div>
          {/* Call Duration */}
          <div style={{ background: "rgba(255,255,255,0.8)", borderRadius: 12, padding: "10px 16px", flex: 1, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.blue }}>{callTime}</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>Call Duration</div>
          </div>
        </div>
      </div>

      {/* ── Middle: LIVE TRANSCRIPT CARD ── */}
      <div style={{ ...glassCSS, flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
        {/* Headers */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 16, marginBottom: 12, flexShrink: 0 }}>
          <div style={uppercaseLabelCSS}>LIVE TRANSCRIPT</div>
          <div style={uppercaseLabelCSS}>WORKFLOW</div>
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
              transcript.map((entry) => (
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

      {/* ── Bottom Row: Call Highlights + Workflow Progress ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, flexShrink: 0 }}>
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

        {/* Workflow Progress List */}
        <div style={{ ...glassCSS, padding: "16px 20px", overflowY: "auto", maxHeight: 200 }}>
          <div style={{ ...uppercaseLabelCSS, marginBottom: 12 }}>WORKFLOW PROGRESS</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {WORKFLOW_STEPS.map((step) => {
              const isDone = completedSteps.includes(step.id);
              return (
                <div key={step.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.05)"
                }}>
                  {isDone ? <CheckCircle2 size={16} color={C.green} /> : <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #d1d5db" }}/>}
                  <span style={{ fontSize: 14, color: "#374151" }}>{step.label}</span>
                  <ChevronRight size={14} color="#9ca3af" style={{ marginLeft: "auto" }} />
                </div>
              );
            })}
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
      <div className={callStatus === 'active' ? "dot-live" : ""} style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
      <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>{label}</span>
    </div>
  );
}

// ── Public export: wraps inner with required ConversationProvider ─────────────
export default function VoiceAgentPanel({ onCallStart, onCallEnd, onStepUpdate }: {
  onCallStart?: () => void;
  onCallEnd?: (data: { completedSteps: string[]; flaggedWarnings: { sign: string; severity: string }[]; transcript: string }) => void;
  onStepUpdate?: (steps: number, warnings: number) => void;
}) {
  return (
    <ConversationProvider>
      <VoiceAgentInner onCallStart={onCallStart} onCallEnd={onCallEnd} onStepUpdate={onStepUpdate} />
    </ConversationProvider>
  );
}
