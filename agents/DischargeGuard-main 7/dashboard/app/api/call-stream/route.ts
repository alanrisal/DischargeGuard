import { NextRequest } from "next/server";

// SSE proxy — relays agent events from event_bus.py to the browser
// TODO: connect to Cloud Run SSE endpoint
export async function GET(_req: NextRequest) {
  return new Response("SSE endpoint not yet connected", { status: 200 });
}
