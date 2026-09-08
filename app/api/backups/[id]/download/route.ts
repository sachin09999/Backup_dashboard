import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { PassThrough } from 'stream';
import { ZipArchive } from 'archiver';
import { getBackupDirectory } from '@/lib/backup/backupScanner';

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

    const baseDir = await getBackupDirectory();
    const folderPath = path.join(baseDir, id);
    const resolvedPath = path.resolve(folderPath);
    const resolvedBase = path.resolve(baseDir);

    if (!resolvedPath.startsWith(resolvedBase)) {
      return NextResponse.json({ error: 'Forbidden path' }, { status: 403 });
    }

    if (!fs.existsSync(folderPath)) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
    }

    const archive = new ZipArchive({ zlib: { level: 6 } });
    const passthrough = new PassThrough();

    archive.pipe(passthrough);
    archive.directory(folderPath, id);
    archive.finalize();

    // Convert Node PassThrough to Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        passthrough.on('data', (chunk: Buffer) => controller.enqueue(chunk));
        passthrough.on('end', () => controller.close());
        passthrough.on('error', (err: Error) => controller.error(err));
      }
    });

    return new Response(webStream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${id}.zip"`
      }
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
