import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { step, status, conversation_id } = body;

    console.log('[Webhook] update_workflow_step:', body);

    if (!conversation_id) {
      return NextResponse.json({ success: false, error: 'missing conversation_id' }, { status: 400 });
    }

    await kv.hset(`session:${conversation_id}`, {
      currentStep: step,
      lastStepStatus: status ?? 'active',
      updatedAt: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Webhook] update_workflow_step error:', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
