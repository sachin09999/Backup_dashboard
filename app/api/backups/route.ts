import { NextResponse } from 'next/server';
import { getAllBackups } from '@/lib/backup/backupScanner';
import { executeBackup } from '@/lib/backup/backupEngine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const backups = await getAllBackups();
    return NextResponse.json({ backups });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST() {
  try {
    const backup = await executeBackup();
    return NextResponse.json({ success: true, backup });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
