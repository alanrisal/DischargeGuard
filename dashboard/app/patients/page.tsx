import { createClient } from "@supabase/supabase-js";
import PatientCard from "@/components/patients/PatientCard";
import Link from "next/link";

const FALLBACK = [
  { id: "maria", name: "Maria Garcia",  lang: "Spanish",  langCode: "es", note: "Post-cholecystectomy",   initials: "MG", status: "scheduled" as const },
  { id: "wei",   name: "Wei Chen",      lang: "Mandarin", langCode: "zh", note: "Post-cardiac stent",     initials: "WC", status: "scheduled" as const },
  { id: "james", name: "James Wilson",  lang: "English",  langCode: "en", note: "Post-hip replacement",   initials: "JW", status: "scheduled" as const },
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
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

async function getPatients() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await supabase
      .from("patients")
      .select("id, mrn, name, language, language_code, diagnosis")
      .order("name");
    if (error || !data?.length) return FALLBACK;
    return data.map((p) => ({
      id:            p.mrn,
      voiceScenario: pickVoiceScenario(p.language_code),
      name:          p.name,
      lang:          p.language,
      langCode:      p.language_code,
      note:          p.diagnosis.split(",")[0].trim(),
      initials:      getInitials(p.name),
      status:        "scheduled" as const,
      emoji:         LANG_EMOJI[p.language_code] ?? "🏥",
    }));
  } catch {
    return FALLBACK;
  }
}

export default async function PatientsPage() {
  const patients = await getPatients();

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-base)",
      fontFamily: "var(--font-body)",
      padding: "0",
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: "32px 48px 0",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
      }}>
        <div>
          {/* Back to landing */}
          <Link href="/" className="back-link" style={{
            fontFamily: "var(--font-body)", fontWeight: 400, fontSize: 12,
            textDecoration: "none",
            letterSpacing: "0.06em", display: "inline-flex",
            alignItems: "center", gap: 5, marginBottom: 20,
          }}>
            ← CareCall
          </Link>

          <h1 style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: "clamp(32px, 4vw, 52px)",
            color: "var(--text-primary)",
            lineHeight: 1.1,
            margin: 0,
          }}>
            Select a Patient
          </h1>
          <p style={{
            fontFamily: "var(--font-body)",
            fontWeight: 300,
            fontSize: 14,
            color: "var(--text-tertiary)",
            marginTop: 8,
            letterSpacing: "0.02em",
          }}>
            Active monitored patients · CareCall AI
          </p>
        </div>

        {/* Live indicator */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 16px",
          background: "var(--surface-raised)",
          boxShadow: "4px 4px 10px var(--shadow-dark), -4px -4px 10px var(--shadow-light)",
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 500,
          color: "var(--accent-success)",
          letterSpacing: "0.06em",
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "var(--accent-success)",
            display: "inline-block",
            animation: "pulse-dot 2s ease-in-out infinite",
          }} />
          {patients.length} PATIENTS READY
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{
        margin: "28px 48px",
        height: 1,
        background: "linear-gradient(to right, var(--shadow-dark), transparent)",
      }} />

      {/* ── Search bar ── */}
      <div style={{ padding: "0 48px", marginBottom: 32, maxWidth: 440 }}>
        <div style={{
          background: "var(--surface-inset)",
          boxShadow: "inset 4px 4px 10px var(--shadow-dark), inset -4px -4px 10px var(--shadow-light)",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "11px 16px",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search by name or condition…"
            style={{
              border: "none", outline: "none", background: "transparent",
              fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 400,
              color: "var(--text-primary)", width: "100%",
            }}
          />
        </div>
      </div>

      {/* ── Patient grid ── */}
      <div style={{
        padding: "0 48px 48px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 20,
        maxWidth: 1100,
      }}>
        {patients.map((p, i) => (
          <PatientCard
            key={p.id}
            id={p.id}
            name={p.name}
            lang={p.lang}
            langCode={p.langCode}
            note={p.note}
            initials={p.initials}
            status={p.status}
            voiceScenario={"voiceScenario" in p ? (p as { voiceScenario: string }).voiceScenario : p.id}
            animDelay={i * 80}
          />
        ))}
      </div>
    </div>
  );
}
