import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { item_id, status, note, conversation_id } = body;

    console.log('[Webhook] update_checklist_item:', body);

    // Get existing checklist state first (stored as JSON string)
    const existingStr = await kv.hget<string>(`session:${conversation_id}`, 'itemStates');
    const itemStates: Record<string, unknown> = existingStr ? JSON.parse(existingStr) : {};
    itemStates[item_id] = { status, note, updatedAt: Date.now() };

    await kv.hset(`session:${conversation_id}`, {
      itemStates: JSON.stringify(itemStates),
      updatedAt: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Webhook] update_checklist_item error:', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}