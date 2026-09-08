import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { getBackupById, getBackupDirectory } from '@/lib/backup/backupScanner';
import { addLog } from '@/lib/logs/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || id.includes('..') || id.includes('/') || id.includes('\\')) {
      return NextResponse.json({ error: 'Invalid backup ID' }, { status: 400 });
    }

    const backup = await getBackupById(id);
    if (!backup) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
    }

    return NextResponse.json({ backup });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || id.includes('..') || id.includes('/') || id.includes('\\')) {
      return NextResponse.json({ error: 'Invalid backup ID' }, { status: 400 });
    }

    const baseDir = await getBackupDirectory();
    const targetPath = path.join(baseDir, id);

    // Verify target path stays strictly inside baseDir
    const resolvedPath = path.resolve(targetPath);
    const resolvedBase = path.resolve(baseDir);

    if (!resolvedPath.startsWith(resolvedBase)) {
      await addLog('ERROR', `Forbidden deletion attempt outside BACKUP_DIRECTORY: ${id}`);
      return NextResponse.json({ error: 'Forbidden: Path outside backup directory' }, { status: 403 });
    }

    try {
      await fs.stat(targetPath);
    } catch {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
    }

    await fs.rm(targetPath, { recursive: true, force: true });
    await addLog('SUCCESS', `Backup "${id}" deleted successfully`);

    return NextResponse.json({ success: true, message: `Backup ${id} deleted successfully` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
