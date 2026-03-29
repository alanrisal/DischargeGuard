// Your React UI polls this to get live state during a call
import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const conversation_id = searchParams.get('conversation_id');

    if (!conversation_id) {
      return NextResponse.json({ error: 'missing conversation_id' }, { status: 400 });
    }

    const session = await kv.hgetall(`session:${conversation_id}`);

    if (!session) {
      return NextResponse.json({ found: false });
    }

    // Parse the JSON strings back into objects
    return NextResponse.json({
      found: true,
      currentStep: session.currentStep ?? null,
      itemStates: session.itemStates ? JSON.parse(session.itemStates as string) : {},
      flaggedWarnings: session.flaggedWarnings ? JSON.parse(session.flaggedWarnings as string) : [],
      updatedAt: session.updatedAt ?? null,
    });
  } catch (err) {
    console.error('[session-state] error:', err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}