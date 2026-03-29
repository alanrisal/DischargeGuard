import { NextRequest, NextResponse } from "next/server";

/**
 * Debug endpoint — returns the raw ElevenLabs conversation payload.
 * Usage: GET /api/debug-conversation?conversationId=<id>
 * Open this in the browser during a live call to see exactly what
 * ElevenLabs exposes in real-time.
 */
export async function GET(req: NextRequest) {
  const conversationId = req.nextUrl.searchParams.get("conversationId");
  if (!conversationId) {
    return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing ELEVENLABS_API_KEY" }, { status: 500 });
  }

  const res = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
    { headers: { "xi-api-key": apiKey }, cache: "no-store" }
  );

  const raw = await res.json();
  console.log("[debug-conversation] status:", res.status, JSON.stringify(raw, null, 2));

  return NextResponse.json({ httpStatus: res.status, ...raw });
}
