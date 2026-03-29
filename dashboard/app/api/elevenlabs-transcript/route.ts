import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Turn = { role?: string; message?: string; content?: string; text?: string };

function normalizeRole(role: string | undefined): "agent" | "user" {
  const r = (role ?? "").toLowerCase();
  if (r === "agent" || r === "assistant" || r === "ai" || r === "bot") return "agent";
  return "user";
}

function turnText(t: Turn): string {
  return (t.message ?? t.content ?? t.text ?? "").trim();
}

/** Convert ElevenLabs conversation turns to the same ALEX:/PT: format as VoiceAgentPanel. */
function turnsToTranscript(turns: Turn[]): string {
  return turns
    .map((item) => {
      const text = turnText(item);
      if (!text) return "";
      const prefix = normalizeRole(item.role) === "agent" ? "ALEX" : "PT";
      return `${prefix}: ${text}`;
    })
    .filter(Boolean)
    .join("\n");
}

/**
 * Fetch finalized (or in-progress) transcript from ElevenLabs for a conversation id.
 * Used when call_history has elevenlabs_conversation_id but transcript was not stored in Supabase.
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id?.trim()) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ELEVENLABS_API_KEY not configured" }, { status: 503 });
  }

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${encodeURIComponent(id)}`, {
      headers: { "xi-api-key": apiKey },
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return NextResponse.json(
        { error: "ElevenLabs request failed", status: res.status, body: body.slice(0, 200) },
        { status: 502 }
      );
    }

    const conv = await res.json();
    const status: string = conv.status ?? "unknown";
    const turns: Turn[] = conv.transcript ?? conv.turns ?? conv.messages ?? [];
    const transcript = turnsToTranscript(turns);

    return NextResponse.json({
      transcript: transcript || null,
      status,
      turnCount: turns.length,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
