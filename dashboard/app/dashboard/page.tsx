import Link from "next/link";

// Minimal static panels — wired up to real data in later sprints
const meds = [
  { name: "Metformin 500mg", status: "green",  note: "Twice daily with food" },
  { name: "Lisinopril 10mg", status: "yellow", note: "Once daily, morning" },
  { name: "Warfarin 5mg",    status: "red",    note: "Requires INR monitoring" },
];

const statusColor: Record<string, string> = {
  green:  "var(--green)",
  yellow: "var(--yellow)",
  red:    "var(--red)",
};

const agentEvents = [
  { agent: "discharge_reader",    msg: "Extracted 3 medications from discharge notes" },
  { agent: "comprehension_check", msg: "Warfarin comprehension score: RED" },
  { agent: "escalation",          msg: "Alert sent — nurse review required" },
  { agent: "voice_coach",         msg: "Switching to simplified language" },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen p-6 flex flex-col gap-6 max-w-5xl mx-auto">

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Live Call Dashboard</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            Patient: Maria Garcia · Spanish · Post-surgery
          </p>
        </div>
        <Link
          href="/"
          className="text-xs px-3 py-1.5 rounded-lg"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          ← Back
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Call panel */}
        <Panel title="Call" badge="● LIVE">
          <div
            className="rounded-lg flex items-center justify-center h-20 text-xs"
            style={{ background: "var(--bg)", color: "var(--muted)" }}
          >
            {/* Waveform placeholder */}
            <span>▂▄▆▄▂▅▇▅▂▄▆▄▂</span>
          </div>
          <p className="text-xs mt-3 leading-relaxed" style={{ color: "var(--muted)" }}>
            &ldquo;Sí, entiendo que debo tomar la Metformina dos veces al día con las comidas...&rdquo;
          </p>
        </Panel>

        {/* Comprehension checklist */}
        <Panel title="Comprehension Checklist">
          <ul className="flex flex-col gap-2">
            {meds.map((m) => (
              <li key={m.name} className="flex items-start gap-3">
                <span
                  className="mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: statusColor[m.status] }}
                />
                <div>
                  <span className="block text-xs font-medium">{m.name}</span>
                  <span className="block text-xs" style={{ color: "var(--muted)" }}>{m.note}</span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Agent activity */}
        <Panel title="Agent Activity">
          <ul className="flex flex-col gap-2">
            {agentEvents.map((e, i) => (
              <li key={i} className="flex gap-2 text-xs">
                <span style={{ color: "var(--blue)", flexShrink: 0 }}>{e.agent}</span>
                <span style={{ color: "var(--muted)" }}>{e.msg}</span>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Alerts */}
        <Panel title="Alerts">
          <div
            className="rounded-lg p-3 text-xs"
            style={{ background: "#ef44441a", border: "1px solid #ef444440" }}
          >
            <p className="font-semibold" style={{ color: "var(--red)" }}>
              ⚠ Escalation triggered
            </p>
            <p className="mt-1" style={{ color: "var(--muted)" }}>
              Patient did not demonstrate understanding of Warfarin INR monitoring.
              Nurse review recommended before discharge.
            </p>
          </div>
        </Panel>

      </div>
    </main>
  );
}

function Panel({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
          {title}
        </span>
        {badge && (
          <span className="text-xs font-medium" style={{ color: "var(--red)" }}>{badge}</span>
        )}
      </div>
      {children}
    </div>
  );
}
