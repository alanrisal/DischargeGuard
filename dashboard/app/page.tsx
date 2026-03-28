import ScenarioCard from "@/components/ScenarioCard";

const scenarios = [
  { id: "maria", name: "Maria Garcia",  lang: "Spanish",  note: "Post-surgery follow-up",  emoji: "🇪🇸" },
  { id: "wei",   name: "Wei Chen",      lang: "Mandarin", note: "Headache escalation path", emoji: "🇨🇳" },
  { id: "james", name: "James Wilson",  lang: "English",  note: "Elderly, multiple meds",   emoji: "🇺🇸" },
];

export default function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 32,
      padding: 32,
      background: "#fffaf7",
      fontFamily: "'Outfit', system-ui, sans-serif",
    }}>
      {/* Logo + title */}
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 40, height: 40,
            background: "linear-gradient(135deg, #e07b54, #c4a35a)",
            borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20,
            boxShadow: "0 2px 8px rgba(224,123,84,0.25)",
          }}>🏥</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#3a2a1e", margin: 0, letterSpacing: "-0.5px" }}>
            Discharge<span style={{ color: "#e07b54" }}>Guard</span>
          </h1>
        </div>
        <p style={{ fontSize: 14, color: "#a08070", margin: 0 }}>
          AI-powered post-discharge patient support · Google ADK + ElevenLabs
        </p>
      </div>

      {/* Status pill */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "7px 16px", borderRadius: 999,
        background: "#f0faf5", border: "1px solid #b8dece",
        fontSize: 12, color: "#3a7a5a",
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "#5aab8a", display: "inline-block",
          boxShadow: "0 0 0 3px rgba(90,171,138,0.2)",
        }} />
        Agents ready
        <span style={{ color: "#b8cec4" }}>·</span>
        <span style={{ color: "#8ab8a8" }}>demo mode</span>
      </div>

      {/* Scenario cards — client components */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, width: "100%", maxWidth: 640 }}>
        {scenarios.map((s) => (
          <ScenarioCard key={s.id} {...s} />
        ))}
      </div>

      <p style={{ fontSize: 12, color: "#c4a88a" }}>Select a patient to open the live dashboard</p>
    </main>
  );
}
