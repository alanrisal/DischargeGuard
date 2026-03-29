import { NextRequest, NextResponse } from "next/server";

// Proxy — forwards scenario to Cloud Run care_coordinator
// TODO: connect to NEXT_PUBLIC_AGENTS_URL
export async function POST(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json({ status: "queued", scenario: body.scenario });
}
