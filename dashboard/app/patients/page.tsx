import { createClient } from "@supabase/supabase-js";
import PatientsDashboardShell, { type PatientPickerRow } from "@/components/patients/PatientsDashboardShell";

const FALLBACK: PatientPickerRow[] = [
  { id: "maria", name: "Maria Garcia", lang: "Spanish", langCode: "es", note: "Post-cholecystectomy", initials: "MG", status: "scheduled", voiceScenario: "maria", emoji: "🇪🇸" },
  { id: "wei", name: "Wei Chen", lang: "Mandarin", langCode: "zh", note: "Post-cardiac stent", initials: "WC", status: "scheduled", voiceScenario: "wei", emoji: "🇨🇳" },
  { id: "james", name: "James Wilson", lang: "English", langCode: "en", note: "Post-hip replacement", initials: "JW", status: "scheduled", voiceScenario: "james", emoji: "🇺🇸" },
];

const LANG_EMOJI: Record<string, string> = {
  es: "🇪🇸", zh: "🇨🇳", en: "🇺🇸", ko: "🇰🇷", fr: "🇫🇷", de: "🇩🇪", pt: "🇧🇷", hi: "🇮🇳",
};

function pickVoiceScenario(language_code: string): string {
  if (language_code === "es") return "maria";
  if (language_code === "zh" || language_code === "zh-CN") return "wei";
  return "james";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

async function getPatients(): Promise<PatientPickerRow[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return FALLBACK;

  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from("patients")
      .select("id, mrn, name, language, language_code, diagnosis")
      .order("name");
    if (error || !data?.length) return FALLBACK;
    return data.map((p) => ({
      id: p.mrn,
      voiceScenario: pickVoiceScenario(p.language_code),
      name: p.name,
      lang: p.language,
      langCode: p.language_code,
      note: p.diagnosis.split(",")[0].trim(),
      initials: getInitials(p.name),
      status: "scheduled" as const,
      emoji: LANG_EMOJI[p.language_code] ?? "🏥",
    }));
  } catch {
    return FALLBACK;
  }
}

export default async function PatientsPage() {
  const patients = await getPatients();
  return <PatientsDashboardShell patients={patients} />;
}
