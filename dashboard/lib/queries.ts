import { supabase } from "./supabase";

export async function getPatient(id: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function getAllPatients() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("patients")
    .select("id, name, mrn, language, language_code, diagnosis")
    .order("name");
  if (error) throw error;
  return data;
}

export async function getPrescriptions(patientId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("prescriptions")
    .select("*")
    .eq("patient_id", patientId)
    .order("prescribed_date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getVisits(patientId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("visits")
    .select("*")
    .eq("patient_id", patientId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getCallHistory(patientId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("call_history")
    .select("*")
    .eq("patient_id", patientId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getDischargeChecklist(patientId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("discharge_checklists")
    .select("*")
    .eq("patient_id", patientId);
  if (error) throw error;
  return data;
}

export async function saveCallResult(result: {
  patient_id: string;
  date: string;
  time: string;
  duration: string;
  type: string;
  status: "completed" | "no-answer" | "failed";
  agent: string;
  language_code: string;
  comprehension_score: number;
  flags: string[];
  summary: string;
  transcript: string | null;
  elevenlabs_conversation_id: string | null;
}) {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("call_history")
    .insert(result)
    .select()
    .single();
  if (error) throw error;
  return data;
}
