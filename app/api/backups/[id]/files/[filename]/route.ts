import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { getBackupDirectory } from '@/lib/backup/backupScanner';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  try {
    const { id, filename } = await params;

    // Path traversal validations
    if (!id || id.includes('..') || id.includes('/') || id.includes('\\')) {
      return NextResponse.json({ error: 'Invalid backup ID' }, { status: 400 });
    }
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const baseDir = await getBackupDirectory();
    const filePath = path.join(baseDir, id, filename);
    const resolvedPath = path.resolve(filePath);
    const resolvedBase = path.resolve(baseDir);

    if (!resolvedPath.startsWith(resolvedBase)) {
      return NextResponse.json({ error: 'Forbidden path' }, { status: 403 });
    }

    try {
      await fs.stat(filePath);
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const url = new URL(request.url);
    const isDownload = url.searchParams.get('download') === 'true';

    if (isDownload) {
      const fileBuffer = await fs.readFile(filePath);
      return new Response(fileBuffer, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }

    // JSON Preview / Pagination
    const content = await fs.readFile(filePath, 'utf-8');
    try {
      const parsed = JSON.parse(content);
      const pageStr = url.searchParams.get('page');
      const limitStr = url.searchParams.get('limit');

      if (Array.isArray(parsed) && pageStr && limitStr) {
        const page = Math.max(1, parseInt(pageStr, 10) || 1);
        const limit = Math.max(1, Math.min(500, parseInt(limitStr, 10) || 50));
        const totalItems = parsed.length;
        const totalPages = Math.ceil(totalItems / limit);
        const startIndex = (page - 1) * limit;
        const items = parsed.slice(startIndex, startIndex + limit);

        return NextResponse.json({
          paginated: true,
          page,
          limit,
          totalItems,
          totalPages,
          items
        });
      }

      return NextResponse.json({ paginated: false, raw: parsed });
    } catch {
      // Non-JSON or raw string fallback
      return NextResponse.json({ paginated: false, text: content });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
