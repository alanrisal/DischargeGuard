"use client";
import { useConversation, useConversationClientTool } from "@elevenlabs/react";
import { useState, useCallback, useRef } from "react";
import patientData from "../../agents/voice_coach/sample_data.json";

// ─── Must be called inside <ConversationProvider> ─────────────────────────────

const AGENT_ID = "agent_3001kmtk38tae4m9rhs2thzdvh3r";

export const WORKFLOW_STEPS = [
  { id: "opening",               label: "Opening" },
  { id: "symptoms",              label: "Symptoms Check" },
  { id: "medications",           label: "Medications" },
  { id: "activity_restrictions", label: "Activity Restrictions" },
  { id: "wound_care",            label: "Wound Care" },
  { id: "follow_ups",            label: "Follow-Up Appointments" },
  { id: "warning_signs",         label: "Warning Signs" },
  { id: "open_questions",        label: "Open Questions" },
  { id: "closing",               label: "Closing" },
] as const;

export type WorkflowStepId = (typeof WORKFLOW_STEPS)[number]["id"];

export type TranscriptEntry = {
  id: number;
  role: "agent" | "user";
  text: string;
};

export type FlaggedWarning = {
  id: number;
  sign: string;
  severity: "warning" | "urgent";
};

export function useVoiceAgent() {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [currentStep, setCurrentStep] = useState<WorkflowStepId | null>(null);
  const [completedSteps, setCompletedSteps] = useState<WorkflowStepId[]>([]);
  const [flaggedWarnings, setFlaggedWarnings] = useState<FlaggedWarning[]>([]);

  // Stable ref for step state inside tool callbacks (avoids stale closures)
  const stepRef = useRef<WorkflowStepId | null>(null);

  // ── Client tools (registered via dedicated hook, always up-to-date) ─────────

  useConversationClientTool(
    "update_workflow_step",
    (params: Record<string, unknown>): string => {
      const step   = params.step   as string;
      const status = params.status as string | undefined;
      const stepId = step as WorkflowStepId;
      const stepIds = WORKFLOW_STEPS.map((s) => s.id) as WorkflowStepId[];

      if (status === "completed") {
        setCompletedSteps((prev) =>
          prev.includes(stepId) ? prev : [...prev, stepId]
        );
        const idx = stepIds.indexOf(stepId);
        const next = idx !== -1 && idx < stepIds.length - 1 ? stepIds[idx + 1] : stepId;
        stepRef.current = next;
        setCurrentStep(next);
      } else {
        stepRef.current = stepId;
        setCurrentStep(stepId);
      }
      return "ok";
    }
  );

  useConversationClientTool(
    "flag_warning_sign",
    (params: Record<string, unknown>): string => {
      const sign     = params.sign     as string;
      const severity = params.severity as string | undefined;
      setFlaggedWarnings((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          sign,
          severity: severity === "urgent" ? "urgent" : "warning",
        },
      ]);
      return "ok";
    }
  );

  // No-op handler for any checklist tool the agent may call
  useConversationClientTool(
    "update_checklist_item",
    (_params: Record<string, unknown>): string => "ok"
  );

  // ── Core conversation hook ──────────────────────────────────────────────────

  const conversation = useConversation({
    onMessage: ({ message, source }) => {
      setTranscript((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          role: source === "ai" ? "agent" : "user",
          text: message,
        },
      ]);
    },
    onError: (message) => {
      console.error("[VoiceAgent]", message);
    },
  });

  // ── Session control ─────────────────────────────────────────────────────────

  const startCall = useCallback(async () => {
    setTranscript([]);
    setCurrentStep("opening");
    setCompletedSteps([]);
    setFlaggedWarnings([]);
    stepRef.current = "opening";

    // Pass full structured data from sample_data.json as dynamic variables.
    // The system prompt uses {{_each_medications}}, {{_each_restrictions}}, etc.
    // ElevenLabs' Handlebars engine resolves array variables server-side.
    // Pre-format all structured data as strings — the API only accepts
    // string | number | boolean. Arrays cause a server-side error.
    const medsFormatted = patientData.medications
      .map((m) =>
        `- ${m.name} ${m.dose}: ${m.frequency}. Purpose: ${m.purpose}` +
        (m.special_instructions ? `. Note: ${m.special_instructions}` : "")
      )
      .join("\n");

    const restrictionsFormatted = patientData.activity_restrictions
      .map((r) => `- ${r}`)
      .join("\n");

    const woundCareFormatted = patientData.wound_care
      .map((w) => `- ${w}`)
      .join("\n");

    const followUpsFormatted = patientData.follow_ups
      .map((f) => `- ${f.date} at ${f.time} with ${f.provider}: ${f.purpose}`)
      .join("\n");

    const warningSignsFormatted = patientData.warning_signs
      .map((w) => `- ${w}`)
      .join("\n");

    await conversation.startSession({
      agentId: AGENT_ID,
      connectionType: "websocket", // WebRTC (default) needs LiveKit infrastructure — use WebSocket
      dynamicVariables: {
        patient_first_name: patientData.patient.first_name,
        hospital_name:      patientData.hospital.name,
        patient_language:   patientData.patient.language,
        discharge_date:     patientData.patient.discharge_date,
        diagnosis:          patientData.patient.diagnosis,
        procedure:          patientData.patient.procedure,
        primary_provider:   patientData.patient.primary_provider.replace(/^Dr\.\s*/i, ""),
        medications:        medsFormatted,
        restrictions:       restrictionsFormatted,
        wound_care:         woundCareFormatted,
        follow_ups:         followUpsFormatted,
        warning_signs:      warningSignsFormatted,
      },
    });
  }, [conversation]);

  const endCall = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  return {
    status:         conversation.status,
    isSpeaking:     conversation.isSpeaking,
    transcript,
    currentStep,
    completedSteps,
    flaggedWarnings,
    startCall,
    endCall,
  };
}
