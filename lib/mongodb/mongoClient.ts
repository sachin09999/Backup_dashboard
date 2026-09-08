import { exec } from 'child_process';
import { promisify } from 'util';
import { CollectionInfo } from '@/types/backup';

const execAsync = promisify(exec);

export interface MongoHealthResult {
  status: 'ONLINE' | 'OFFLINE';
  version?: string;
  database: string;
  collections: CollectionInfo[];
  error?: string;
}

export async function checkMongoHealth(): Promise<MongoHealthResult> {
  const containerName = process.env.MONGODB_CONTAINER || 'ast-mongodb';
  const dbName = process.env.MONGODB_DATABASE || 'factory';
  const mongoUser = process.env.MONGODB_USER || 'aspeed_db';
  const mongoPass = process.env.MONGODB_PASS || 'db5274';
  const authDb = process.env.MONGODB_AUTH_DB || 'admin';

  try {
    // Execute mongo shell inside container (compatible with MongoDB 4.0.3)
    const cmd = `docker exec ${containerName} mongo ${dbName} --username=${mongoUser} --password="${mongoPass}" --authenticationDatabase=${authDb} --eval "db.getCollectionNames().forEach(c => print('COL:' + c + ':' + db[c].count()))"`;

    const { stdout } = await execAsync(cmd, { timeout: 10000 });

    const collectionInfos: CollectionInfo[] = [];
    const lines = stdout.split('\n');

    for (const line of lines) {
      if (line.startsWith('COL:')) {
        const parts = line.trim().split(':');
        if (parts.length >= 3) {
          const name = parts[1];
          const count = parseInt(parts[2], 10) || 0;
          if (name === 'plants' || name === 'cameras') {
            collectionInfos.push({ name, count });
          }
        }
      }
    }

    // Ensure both plants and cameras are listed
    for (const target of ['plants', 'cameras']) {
      if (!collectionInfos.find((c) => c.name === target)) {
        collectionInfos.push({ name: target, count: 0 });
      }
    }

    return {
      status: 'ONLINE',
      version: '4.0.3',
      database: dbName,
      collections: collectionInfos
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      status: 'OFFLINE',
      database: dbName,
      collections: [
        { name: 'plants', count: 0 },
        { name: 'cameras', count: 0 }
      ],
      error: `MongoDB connection error: ${errorMsg}`
    };
  }
}
