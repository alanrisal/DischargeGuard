import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getSupabase } from "./supabase";

function sb(): SupabaseClient<Database> | null {
  return getSupabase();
}

export async function getPatient(id: string) {
  const supabase = sb();
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
  const supabase = sb();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("patients")
    .select("id, name, mrn, language, language_code, diagnosis")
    .order("name");
  if (error) throw error;
  return data;
}

/** One row by MRN — faster than loading all patients for the portal. */
export async function getPatientByMrn(mrn: string) {
  const supabase = sb();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("patients")
    .select("id, name, mrn, language, language_code, diagnosis")
    .eq("mrn", mrn)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPrescriptions(patientId: string) {
  const supabase = sb();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("prescriptions")
    .select("*")
    .eq("patient_id", patientId)
    .order("prescribed_date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getVisits(patientId: string) {
  const supabase = sb();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("visits")
    .select("*")
    .eq("patient_id", patientId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getCallHistory(patientId: string) {
  const supabase = sb();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("call_history")
    .select("*")
    .eq("patient_id", patientId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getDischargeChecklist(patientId: string) {
  const supabase = sb();
  if (!supabase) return null;
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
  transcript?: string | null;
  elevenlabs_conversation_id: string | null;
}) {
  const supabase = sb();
  if (!supabase) throw new Error("Supabase is not configured; cannot save call result.");
  const { transcript, ...rest } = result;
  const { data, error } = await supabase
    .from("call_history")
    .insert({ ...rest, transcript: transcript ?? null })
    .select()
    .single();
  if (error) throw error;
  return data;
}
