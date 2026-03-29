import { NextRequest } from "next/server";

// Keep the serverless function alive for long calls (Vercel Pro: up to 300s)
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * ElevenLabs conversation status flow for Twilio calls:
 *   "in-progress"  → call is live (transcript MAY be empty or partial during the call)
 *   "processing"   → call ended, ElevenLabs is finalizing transcript — KEEP POLLING
 *   "done"         → full transcript ready
 *   "failed"       → call failed
 *
 * IMPORTANT: For Twilio-based calls ElevenLabs often only populates the
 * transcript array AFTER the call ends (status → "done"), not turn-by-turn
 * during the call. This is a limitation of their REST API for phone calls.
 * The entire transcript floods in once processing completes.
 */

type Turn = { role: string; message: string };

export async function GET(req: NextRequest) {
  const conversationId = req.nextUrl.searchParams.get("conversationId");
  if (!conversationId) return new Response("Missing conversationId", { status: 400 });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return new Response("Missing ELEVENLABS_API_KEY", { status: 500 });

  let closed = false;
  req.signal.addEventListener("abort", () => { closed = true; });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) => {
        if (closed) return;
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`)); }
        catch { closed = true; }
      };

      let lastLen = 0;
      let consecutiveErrors = 0;
      let pollCount = 0;

      while (!closed) {
        pollCount++;
        try {
          const res = await fetch(
            `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
            { headers: { "xi-api-key": apiKey }, cache: "no-store" }
          );

          if (res.ok) {
            consecutiveErrors = 0;
            const conv = await res.json();
            const status: string = conv.status ?? "unknown";

            // Log every 5th poll to server console so we can see what ElevenLabs returns
            if (pollCount % 5 === 1) {
              console.log(`[conv-stream #${pollCount}] id=${conversationId} status=${status} transcript_len=${(conv.transcript ?? []).length}`);
            }

            send({ type: "status", convStatus: status });

            // ElevenLabs may nest transcript differently depending on version.
            // Try the standard field first, then fall back to known alternatives.
            const turns: Turn[] =
              conv.transcript ??
              conv.turns ??
              conv.messages ??
              [];

            if (turns.length > lastLen) {
              console.log(`[conv-stream] ${turns.length - lastLen} new turn(s) at poll #${pollCount}`);
              for (const item of turns.slice(lastLen)) {
                // Some ElevenLabs versions use "message", others "content" or "text"
                const text: string = item.message ?? (item as Record<string, string>).content ?? (item as Record<string, string>).text ?? "";
                if (text) send({ type: "transcript", role: item.role, text });
              }
              lastLen = turns.length;
            }

            if (status === "done" || status === "failed") {
              console.log(`[conv-stream] terminal status "${status}" at poll #${pollCount}, total turns: ${turns.length}`);
              send({ type: "end", status });
              closed = true;
            }

          } else {
            consecutiveErrors++;
            const body = await res.text().catch(() => "");
            console.warn(`[conv-stream] HTTP ${res.status} at poll #${pollCount}:`, body);
            send({ type: "poll_error", httpStatus: res.status, body });
            if (consecutiveErrors >= 8) {
              send({ type: "end", status: "failed", reason: `HTTP ${res.status} after ${consecutiveErrors} retries` });
              closed = true;
            }
          }
        } catch (err) {
          consecutiveErrors++;
          console.warn(`[conv-stream] fetch error at poll #${pollCount}:`, err);
          send({ type: "poll_error", message: String(err) });
          if (consecutiveErrors >= 8) {
            send({ type: "end", status: "failed", reason: String(err) });
            closed = true;
          }
        }

        if (!closed) await new Promise<void>((r) => setTimeout(r, 1500));
      }

      try { controller.close(); } catch { /* already closed */ }
    },
    cancel() { closed = true; },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
