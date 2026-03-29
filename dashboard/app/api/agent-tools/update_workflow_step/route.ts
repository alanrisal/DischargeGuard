import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL!,
  token: process.env.STORAGE_KV_REST_API_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { step, status, conversation_id } = body;

    console.log('[Webhook] update_workflow_step:', body);

    await redis.hset(`session:${conversation_id}`, {
      currentStep: step,
      [`step_${step}`]: status,
      updatedAt: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Webhook] update_workflow_step error:', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}