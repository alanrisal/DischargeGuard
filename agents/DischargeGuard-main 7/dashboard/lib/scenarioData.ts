import mariaData from "../../agents/voice_coach/sample_data.json";
import weiData from "../../agents/voice_coach/sample_data_wei.json";
import jamesData from "../../agents/voice_coach/sample_data_james.json";

export type PatientVoiceData = {
  hospital: { name: string };
  patient: {
    first_name: string;
    language: string;
    discharge_date: string;
    diagnosis: string;
    procedure: string;
    primary_provider: string;
  };
  medications: {
    name: string;
    dose: string;
    frequency: string;
    purpose: string;
    special_instructions: string | null;
  }[];
  activity_restrictions: string[];
  wound_care: string[];
  follow_ups: { date: string; time: string; provider: string; purpose: string }[];
  warning_signs: string[];
};

export type Scenario = {
  id: string;
  name: string;
  language: string;
  language_code: string;
  mrn: string;
  diagnosis: string;
  voiceData: PatientVoiceData;
};

export const SCENARIOS: Record<string, Scenario> = {
  maria: {
    id: "maria",
    name: "Maria Garcia",
    language: "Spanish",
    language_code: "es",
    mrn: "847291",
    diagnosis: "Post-cholecystectomy, Type 2 Diabetes, Hypertension",
    voiceData: mariaData as PatientVoiceData,
  },
  wei: {
    id: "wei",
    name: "Wei Chen",
    language: "Mandarin",
    language_code: "zh",
    mrn: "829304",
    diagnosis: "Post-cardiac stent, Hypertension, Atrial Fibrillation",
    voiceData: weiData as PatientVoiceData,
  },
  james: {
    id: "james",
    name: "James Wilson",
    language: "English",
    language_code: "en",
    mrn: "763819",
    diagnosis: "Post-hip replacement, COPD, Type 2 Diabetes",
    voiceData: jamesData as PatientVoiceData,
  },
};

/** Returns the scenario for a given URL param (e.g. "maria", "wei", "james"). Defaults to maria. */
export function getScenario(id: string): Scenario {
  return SCENARIOS[id] ?? SCENARIOS.maria;
}
