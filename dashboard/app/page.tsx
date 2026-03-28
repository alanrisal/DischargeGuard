import ScenarioCard from "@/components/ScenarioCard";

const scenarios = [
  { id: "maria", name: "Maria Garcia",  lang: "Spanish",  note: "Post-surgery follow-up",  emoji: "🇪🇸" },
  { id: "wei",   name: "Wei Chen",      lang: "Mandarin", note: "Headache escalation path", emoji: "🇨🇳" },
  { id: "james", name: "James Wilson",  lang: "English",  note: "Elderly, multiple meds",   emoji: "🇺🇸" },
];

export default function Home() {
  return (
    <main style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 32, padding: 32,
      background: "#f8faff", fontFamily: "'Outfit', system-ui, sans-serif",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12 }}>
          <img src="/logo.png" alt="DischargeGuard" style={{ width: 52, height: 52, objectFit: "contain" }} />
          <h1 style={{ fontSize: 30, fontWeight: 700, color: "#1a2340", margin: 0, letterSpacing: "-0.5px" }}>
            Discharge<span style={{ color: "#2563eb" }}>Guard</span>
          </h1>
        </div>
        <p style={{ fontSize: 14, color: "#6b7a9e", margin: 0 }}>
          AI-powered post-discharge patient support · Google ADK + ElevenLabs
        </p>
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "7px 16px",
        borderRadius: 999, background: "#f0fdf4", border: "1px solid #86efac",
        fontSize: 12, color: "#15803d",
      }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a", display: "inline-block", boxShadow: "0 0 0 3px rgba(22,163,74,0.2)" }} />
        Agents ready
        <span style={{ color: "#86efac" }}>·</span>
        <span style={{ color: "#4ade80" }}>demo mode</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, width: "100%", maxWidth: 640 }}>
        {scenarios.map((s) => <ScenarioCard key={s.id} {...s} />)}
      </div>

      <p style={{ fontSize: 12, color: "#c7d2e8" }}>Select a patient to open the live dashboard</p>
    </main>
  );
}
