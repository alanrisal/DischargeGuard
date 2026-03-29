import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sign, severity, conversation_id } = body;

    console.log('[Webhook] flag_warning_sign:', body);

    // Get existing warnings first
    const existing = await kv.hget<string>(
      `session:${conversation_id}`,
      'flaggedWarnings'
    );

    const warnings = existing ? JSON.parse(existing) : [];
    warnings.push({ sign, severity, flaggedAt: Date.now() });

    await kv.hset(`session:${conversation_id}`, {
      flaggedWarnings: JSON.stringify(warnings),
      updatedAt: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Webhook] flag_warning_sign error:', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}