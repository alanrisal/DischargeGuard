import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL!,
  token: process.env.STORAGE_KV_REST_API_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { item_id, status, note, conversation_id } = body;

    console.log('[Webhook] update_checklist_item:', body);

    // Upstash may return the value already parsed (object) or as a raw string
    const existingRaw = await redis.hget(`session:${conversation_id}`, 'itemStates');
    const itemStates: Record<string, unknown> =
      existingRaw == null
        ? {}
        : typeof existingRaw === 'string'
        ? JSON.parse(existingRaw)
        : (existingRaw as Record<string, unknown>);
    itemStates[item_id] = { status, note, updatedAt: Date.now() };

    await redis.hset(`session:${conversation_id}`, {
      itemStates: JSON.stringify(itemStates),
      updatedAt: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Webhook] update_checklist_item error:', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}