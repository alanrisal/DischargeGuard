"use client";

import VoiceAgentPanel from "@/components/VoiceAgentPanel";
import type { PatientVoiceData } from "@/lib/scenarioData";
import type { TranscriptEntry } from "@/lib/useVoiceAgent";

export default function VoiceAssistantSection({
  scenarioId,
  vd,
  onTranscriptChange,
  onCallStart,
  onCallEnd,
}: {
  scenarioId: string;
  vd: PatientVoiceData;
  onTranscriptChange: (entries: TranscriptEntry[]) => void;
  onCallStart: () => void;
  onCallEnd: (data: {
    completedSteps: string[];
    flaggedWarnings: { sign: string; severity: string }[];
    transcript: string;
  }) => void;
}) {
  return (
    <VoiceAgentPanel
      hideOutboundPhone
      patientData={vd}
      scenarioId={scenarioId}
      onCallStart={onCallStart}
      onCallEnd={onCallEnd}
      onTranscriptUpdate={onTranscriptChange}
    />
  );
}
