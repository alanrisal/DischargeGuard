"use client";
import { useConversation, useConversationClientTool } from "@elevenlabs/react";
import { useState, useCallback, useMemo } from "react";
import patientData from "../../agents/voice_coach/sample_data.json";
import type { ChecklistItem, ItemState } from "./types";

// ─── Must be called inside <ConversationProvider> ─────────────────────────────

const AGENT_ID = "agent_3001kmtk38tae4m9rhs2thzdvh3r";

// ── Build a checklist from any patient JSON ───────────────────────────────────
// IDs are derived from the data — no hardcoding per patient.
export function buildPatientChecklist(
  data: typeof patientData
): ChecklistItem[] {
  const slug = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

  const items: ChecklistItem[] = [];

  // Medications
  data.medications.forEach((med) => {
    items.push({
      id:       `med_${slug(med.name)}`,
      name:     `${med.name} ${med.dose}`,
      detail:   `${med.frequency} · ${med.purpose}`,
      category: "medication",
    });
  });

  // Activity restrictions (one row)
  items.push({
    id:       "activity_restrictions",
    name:     "Activity Restrictions",
    detail:   data.activity_restrictions[0] ?? "",
    category: "restriction",
  });

  // Wound care (one row, only if data exists)
  if (data.wound_care.length > 0) {
    items.push({
      id:       "wound_care",
      name:     "Wound Care",
      detail:   data.wound_care[0] ?? "",
      category: "care",
    });
  }

  // Follow-up appointments
  data.follow_ups.forEach((fu, i) => {
    items.push({
      id:       `followup_${i + 1}`,
      name:     `Follow-up: ${fu.provider}`,
      detail:   `${fu.date} at ${fu.time} · ${fu.purpose}`,
      category: "appointment",
    });
  });

  // Warning signs (one row)
  items.push({
    id:       "warning_signs",
    name:     "Warning Signs",
    detail:   data.warning_signs[0] ?? "",
    category: "safety",
  });

  return items;
}

// ── Map workflow step → checklist categories (works for any patient) ──────────
const STEP_CATEGORY: Record<string, string[]> = {
  medications:           ["medication"],
  activity_restrictions: ["restriction"],
  wound_care:            ["care"],
  follow_ups:            ["appointment"],
  warning_signs:         ["safety"],
};

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
export type TranscriptEntry = { id: number; role: "agent" | "user"; text: string };
export type FlaggedWarning  = { id: number; sign: string; severity: "warning" | "urgent" };

function blankStates(items: ChecklistItem[]): Record<string, ItemState> {
  return Object.fromEntries(
    items.map((c) => [c.id, { status: "idle" as const, score: "", fill: 0, note: "" }])
  );
}

export function useVoiceAgent() {
  // Build checklist once from patient data — swap `patientData` for another
  // patient object and everything else (IDs, tool instructions) follows.
  const checklist = useMemo(() => buildPatientChecklist(patientData), []);

  // category → item IDs, built from the live checklist (no hardcoding)
  const categoryToIds = useMemo(() => {
    const map: Record<string, string[]> = {};
    checklist.forEach((item) => {
      (map[item.category] ??= []).push(item.id);
    });
    return map;
  }, [checklist]);

  const [transcript,      setTranscript]      = useState<TranscriptEntry[]>([]);
  const [currentStep,     setCurrentStep]     = useState<WorkflowStepId | null>(null);
  const [completedSteps,  setCompletedSteps]  = useState<WorkflowStepId[]>([]);
  const [flaggedWarnings, setFlaggedWarnings] = useState<FlaggedWarning[]>([]);
  const [itemStates,      setItemStates]      = useState<Record<string, ItemState>>(
    () => blankStates(checklist)
  );

  // ── update_workflow_step ─────────────────────────────────────────────────────
  // Activates every checklist row in the matching category for that step.
  useConversationClientTool(
    "update_workflow_step",
    (params: Record<string, unknown>): string => {
      console.log("[Tool] update_workflow_step called:", params);
      const step   = params.step   as WorkflowStepId;
      const status = params.status as string | undefined;
      const stepIds = WORKFLOW_STEPS.map((s) => s.id) as WorkflowStepId[];

      if (status === "completed") {
        setCompletedSteps((prev) => prev.includes(step) ? prev : [...prev, step]);
        const idx  = stepIds.indexOf(step);
        const next = idx !== -1 && idx < stepIds.length - 1 ? stepIds[idx + 1] : step;
        setCurrentStep(next);
      } else {
        setCurrentStep(step);
        const categories = STEP_CATEGORY[step] ?? [];
        const ids = categories.flatMap((cat) => categoryToIds[cat] ?? []);
        if (ids.length > 0) {
          setItemStates((prev) => {
            const next = { ...prev };
            ids.forEach((id) => {
              if (next[id]?.status === "idle")
                next[id] = { ...next[id], status: "active", fill: 30 };
            });
            return next;
          });
        }
      }
      return "ok";
    }
  );

  // ── update_checklist_item ────────────────────────────────────────────────────
  // Generic: item_id comes from the dynamic variable we pass to the agent,
  // so it always matches the current patient's checklist.
  useConversationClientTool(
    "update_checklist_item",
    (params: Record<string, unknown>): string => {
      console.log("[Tool] update_checklist_item called:", params);
      const itemId = params.item_id as string;
      const status = params.status  as ItemState["status"];
      const note   = (params.note   as string | undefined) ?? "";
      const fillMap: Record<string, number> = { green: 95, yellow: 60, red: 20, active: 40, idle: 0 };

      setItemStates((prev) => {
        if (!(itemId in prev)) {
          console.warn("[Tool] update_checklist_item: unknown item_id:", itemId, "known IDs:", Object.keys(prev));
          return prev;
        }
        return {
          ...prev,
          [itemId]: {
            status,
            score: status === "green" ? "GREEN" : status === "yellow" ? "PARTIAL" : status === "red" ? "RED" : "",
            fill:  fillMap[status] ?? 0,
            note,
          },
        };
      });
      return "ok";
    }
  );

  // ── flag_warning_sign ────────────────────────────────────────────────────────
  useConversationClientTool(
    "flag_warning_sign",
    (params: Record<string, unknown>): string => {
      console.log("[Tool] flag_warning_sign called:", params);
      setFlaggedWarnings((prev) => [
        ...prev,
        {
          id:       Date.now() + Math.random(),
          sign:     params.sign     as string,
          severity: params.severity === "urgent" ? "urgent" : "warning",
        },
      ]);
      return "ok";
    }
  );

  // ── Core conversation hook ───────────────────────────────────────────────────
  const conversation = useConversation({
    onConnect: () => console.log("[VoiceAgent] ✅ Connected"),
    onDisconnect: () => console.log("[VoiceAgent] 🔴 Disconnected"),
    onMessage: ({ message, role }) => {
      console.log("[VoiceAgent] 💬 Message:", role, message);
      setTranscript((prev) => [
        ...prev,
        { id: Date.now() + Math.random(), role, text: message },
      ]);
    },
    onError: (message) => console.error("[VoiceAgent] ❌ Error:", message),
  });

  // ── Session start ────────────────────────────────────────────────────────────
  const startCall = useCallback(() => {
    setTranscript([]);
    setCurrentStep("opening");
    setCompletedSteps([]);
    setFlaggedWarnings([]);
    setItemStates(blankStates(checklist));

    // Build dynamic variable listing every checklist item with its ID.
    // The agent's system prompt uses {{checklist_items}} — no hardcoded IDs needed.
    const checklistItemsVar = checklist
      .map((item) => `- ${item.name} (item_id: "${item.id}")`)
      .join("\n");

    const medsFormatted = patientData.medications
      .map((m) =>
        `- ${m.name} ${m.dose}: ${m.frequency}. Purpose: ${m.purpose}` +
        (m.special_instructions ? `. Note: ${m.special_instructions}` : "")
      )
      .join("\n");

    const restrictionsFormatted = patientData.activity_restrictions.map((r) => `- ${r}`).join("\n");
    const woundCareFormatted    = patientData.wound_care.map((w) => `- ${w}`).join("\n");
    const followUpsFormatted    = patientData.follow_ups
      .map((f) => `- ${f.date} at ${f.time} with ${f.provider}: ${f.purpose}`)
      .join("\n");
    const warningSignsFormatted = patientData.warning_signs.map((w) => `- ${w}`).join("\n");

    console.log("[VoiceAgent] 🚀 startSession called, agentId:", AGENT_ID);
    conversation.startSession({
      agentId: AGENT_ID,
      connectionType: "websocket",
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
        // ← The key: all item IDs for this patient, generated at runtime
        checklist_items:    checklistItemsVar,
      },
    });
  }, [conversation, checklist]);

  const endCall = useCallback(() => {
    conversation.endSession();
  }, [conversation]);

  return {
    status:          conversation.status,
    isSpeaking:      conversation.isSpeaking,
    checklist,       // ← the item definitions for this patient
    itemStates,      // ← live status of each item
    transcript,
    currentStep,
    completedSteps,
    flaggedWarnings,
    startCall,
    endCall,
  };
}
