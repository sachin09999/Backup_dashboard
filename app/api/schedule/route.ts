import { NextRequest, NextResponse } from 'next/server';
import { buildCronExpression, getScheduleConfig, saveScheduleConfig } from '@/lib/scheduler/schedulerService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = await getScheduleConfig();
    const cronExpression = buildCronExpression(config);

    return NextResponse.json({
      config,
      cronExpression
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = await saveScheduleConfig(body);
    const cronExpression = buildCronExpression(updated);

    return NextResponse.json({
      success: true,
      config: updated,
      cronExpression
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
