import { NextRequest, NextResponse } from 'next/server';
import { clearLogs, getLogs } from '@/lib/logs/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase() || '';
    const level = url.searchParams.get('level')?.toUpperCase() || '';

    let logs = await getLogs();

    if (level && level !== 'ALL') {
      logs = logs.filter((l) => l.level === level);
    }

    if (search) {
      logs = logs.filter((l) =>
        l.message.toLowerCase().includes(search) ||
        l.level.toLowerCase().includes(search) ||
        l.timestamp.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ logs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await clearLogs();
    return NextResponse.json({ success: true, message: 'Logs cleared successfully' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
