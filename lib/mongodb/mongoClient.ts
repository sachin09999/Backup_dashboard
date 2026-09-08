import { exec } from 'child_process';
import { promisify } from 'util';
import { CollectionInfo, MongoConnectionProfile } from '@/types/backup';
import { getActiveConnection } from '@/lib/settings/settingsStore';

const execAsync = promisify(exec);

export interface MongoHealthResult {
  status: 'ONLINE' | 'OFFLINE';
  version?: string;
  database: string;
  collections: CollectionInfo[];
  error?: string;
}

export async function checkMongoHealth(customProfile?: MongoConnectionProfile): Promise<MongoHealthResult> {
  const profile = customProfile || (await getActiveConnection());
  const dbName = profile.database || 'factory';

  try {
    let cmd = '';

    if (profile.type === 'REMOTE_URI' && profile.uri) {
      cmd = `mongo "${profile.uri}" --eval "db.getCollectionNames().forEach(c => print('COL:' + c + ':' + db[c].count()))"`;
    } else if (profile.type === 'REMOTE_URI' && profile.host) {
      const port = profile.port || 27017;
      const authDb = profile.authDatabase || 'admin';
      const user = profile.username ? `--username=${profile.username}` : '';
      const pass = profile.password ? `--password="${profile.password}"` : '';
      cmd = `mongo --host=${profile.host} --port=${port} ${user} ${pass} --authenticationDatabase=${authDb} ${dbName} --eval "db.getCollectionNames().forEach(c => print('COL:' + c + ':' + db[c].count()))"`;
    } else {
      // LOCAL_DOCKER
      const containerName = profile.containerName || process.env.MONGODB_CONTAINER || 'ast-mongodb';
      const mongoUser = profile.username || process.env.MONGODB_USER || 'aspeed_db';
      const mongoPass = profile.password || process.env.MONGODB_PASS || 'db5274';
      const authDb = profile.authDatabase || process.env.MONGODB_AUTH_DB || 'admin';
      cmd = `docker exec ${containerName} mongo ${dbName} --username=${mongoUser} --password="${mongoPass}" --authenticationDatabase=${authDb} --eval "db.getCollectionNames().forEach(c => print('COL:' + c + ':' + db[c].count()))"`;
    }

    const { stdout } = await execAsync(cmd, { timeout: 10000 });

    const collectionInfos: CollectionInfo[] = [];
    const lines = stdout.split('\n');

    for (const line of lines) {
      if (line.startsWith('COL:')) {
        const parts = line.trim().split(':');
        if (parts.length >= 3) {
          const name = parts[1];
          const count = parseInt(parts[2], 10) || 0;
          // Filter out system collections
          if (!name.startsWith('system.')) {
            collectionInfos.push({ name, count });
          }
        }
      }
    }

    // Default fallbacks if empty
    if (collectionInfos.length === 0) {
      for (const target of ['plants', 'cameras']) {
        collectionInfos.push({ name: target, count: 0 });
      }
    }

    return {
      status: 'ONLINE',
      version: 'MongoDB',
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
      error: `MongoDB connection error (${profile.name}): ${errorMsg}`
    };
  }
}
