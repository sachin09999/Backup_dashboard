import fs from 'fs/promises';
import path from 'path';
import { CollectionBackupMeta } from '@/types/backup';

export interface ValidationResult {
  isValid: boolean;
  collections: Record<string, CollectionBackupMeta>;
  totalDocuments: number;
  totalSizeBytes: number;
  errors: string[];
}

export async function validateBackupFolder(folderPath: string, expectedCollections: string[] = ['plants', 'cameras']): Promise<ValidationResult> {
  const collections: Record<string, CollectionBackupMeta> = {};
  const errors: string[] = [];
  let totalDocuments = 0;
  let totalSizeBytes = 0;

  for (const col of expectedCollections) {
    const filename = `${col}.json`;
    const filePath = path.join(folderPath, filename);

    try {
      const stat = await fs.stat(filePath);
      const fileSize = stat.size;
      totalSizeBytes += fileSize;

      if (fileSize === 0) {
        collections[col] = {
          documents: 0,
          file: filename,
          size: 0,
          status: 'invalid'
        };
        errors.push(`File ${filename} is 0 bytes (empty).`);
        continue;
      }

      // Read file content and validate JSON
      const content = await fs.readFile(filePath, 'utf-8');
      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch (jsonErr: unknown) {
        const msg = jsonErr instanceof Error ? jsonErr.message : String(jsonErr);
        collections[col] = {
          documents: 0,
          file: filename,
          size: fileSize,
          status: 'invalid'
        };
        errors.push(`File ${filename} contains invalid JSON: ${msg}`);
        continue;
      }

      let docCount = 0;
      if (Array.isArray(parsed)) {
        docCount = parsed.length;
      } else if (parsed && typeof parsed === 'object') {
        docCount = 1;
      }

      totalDocuments += docCount;

      collections[col] = {
        documents: docCount,
        file: filename,
        size: fileSize,
        status: 'valid'
      };
    } catch {
      collections[col] = {
        documents: 0,
        file: filename,
        size: 0,
        status: 'missing'
      };
      errors.push(`File ${filename} is missing.`);
    }
  }

  const isValid = errors.length === 0;
  return {
    isValid,
    collections,
    totalDocuments,
    totalSizeBytes,
    errors
  };
}
