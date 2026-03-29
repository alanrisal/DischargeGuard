import { SUBTITLES, SUBTITLES_JAMES, SUBTITLES_WEI } from "./demoData";
import type { TranscriptEntry } from "./useVoiceAgent";

/** Parse ALEX:/PT: (or agent:/user:) lines from send-summary, VoiceAgentPanel, or ElevenLabs hydration. */
export function parseTranscriptString(raw: string): TranscriptEntry[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => {
      const agentMatch = /^(ALEX|agent|assistant):\s*/i.exec(line);
      if (agentMatch) {
        return { id: i, role: "agent" as const, text: line.slice(agentMatch[0].length) };
      }
      const userMatch = /^(PT|user|patient):\s*/i.exec(line);
      if (userMatch) {
        return { id: i, role: "user" as const, text: line.slice(userMatch[0].length) };
      }
      return { id: i, role: "user" as const, text: line };
    });
}

const SUBTITLE_TABLE: Record<string, { en: string }[]> = {
  maria: SUBTITLES,
  wei: SUBTITLES_WEI,
  james: SUBTITLES_JAMES,
};

/** Demo lines (English) for portal when no DB / ElevenLabs transcript yet. */
export function subtitlesToTranscriptEntries(scenarioId: string): TranscriptEntry[] {
  const rows = SUBTITLE_TABLE[scenarioId];
  if (!rows?.length) return [];
  return rows.map((s, i) => ({
    id: i,
    role: /^Patient:/i.test(s.en.trim()) ? ("user" as const) : ("agent" as const),
    text: s.en.replace(/^Patient:\s*/, "").replace(/^"/, "").replace(/"$/, "").trim() || s.en,
  }));
}
