import Link from "next/link";

const scenarios = [
  { id: "maria", name: "Maria Garcia", lang: "Spanish", note: "Post-surgery follow-up" },
  { id: "wei",   name: "Wei Chen",    lang: "Mandarin", note: "Headache escalation" },
  { id: "james", name: "James Wilson", lang: "English", note: "Elderly, multiple meds" },
];

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">DischargeGuard</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          AI-powered post-discharge patient support · Google ADK + ElevenLabs
        </p>
      </div>

      {/* Status bar */}
      <div
        className="flex items-center gap-2 px-4 py-2 rounded-full text-xs"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <span className="w-2 h-2 rounded-full" style={{ background: "var(--green)" }} />
        <span>Agents ready</span>
        <span style={{ color: "var(--muted)" }}>·</span>
        <span style={{ color: "var(--muted)" }}>demo mode</span>
      </div>

      {/* Scenario cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
        {scenarios.map((s) => (
          <Link
            key={s.id}
            href={`/dashboard?scenario=${s.id}`}
            className="rounded-xl p-5 block transition-all hover:scale-[1.02]"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <span className="block font-semibold text-sm">{s.name}</span>
            <span className="block text-xs mt-1" style={{ color: "var(--blue)" }}>{s.lang}</span>
            <span className="block text-xs mt-2" style={{ color: "var(--muted)" }}>{s.note}</span>
          </Link>
        ))}
      </div>

      {/* Footer hint */}
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        Select a patient to open the live dashboard
      </p>
    </main>
  );
}
