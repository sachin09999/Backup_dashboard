import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/settings/settingsStore';
import { checkMongoHealth } from '@/lib/mongodb/mongoClient';
import { MongoConnectionProfile } from '@/types/backup';

// GET /api/connections -> List all connection profiles & active profile
export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({
      activeConnectionId: settings.activeConnectionId,
      connections: settings.connections || []
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/connections -> Add/Update profile, Activate profile, or Test connection
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, profile, connectionId } = body;

    const settings = await getSettings();
    const connections: MongoConnectionProfile[] = settings.connections || [];

    if (action === 'activate') {
      if (!connectionId) {
        return NextResponse.json({ error: 'connectionId is required' }, { status: 400 });
      }

      const target = connections.find(c => c.id === connectionId);
      if (!target) {
        return NextResponse.json({ error: 'Connection profile not found' }, { status: 404 });
      }

      await updateSettings({ activeConnectionId: connectionId });
      return NextResponse.json({ success: true, activeConnectionId: connectionId, activeProfile: target });
    }

    if (action === 'test') {
      if (!profile) {
        return NextResponse.json({ error: 'Profile details required for testing' }, { status: 400 });
      }

      const health = await checkMongoHealth(profile);
      return NextResponse.json({
        success: health.status === 'ONLINE',
        health
      });
    }

    if (action === 'save') {
      if (!profile || !profile.name || !profile.database) {
        return NextResponse.json({ error: 'Profile name and database are required' }, { status: 400 });
      }

      const existingIndex = connections.findIndex(c => c.id === profile.id);
      const newProfile: MongoConnectionProfile = {
        id: profile.id || `conn_${Date.now()}`,
        name: profile.name,
        type: profile.type || 'REMOTE_URI',
        uri: profile.uri,
        host: profile.host,
        port: profile.port,
        database: profile.database,
        username: profile.username,
        password: profile.password,
        authDatabase: profile.authDatabase || 'admin'
      };

      let updatedConnections: MongoConnectionProfile[];
      if (existingIndex >= 0) {
        updatedConnections = [...connections];
        updatedConnections[existingIndex] = newProfile;
      } else {
        updatedConnections = [...connections, newProfile];
      }

      await updateSettings({
        connections: updatedConnections,
        activeConnectionId: newProfile.id
      });

      return NextResponse.json({
        success: true,
        profile: newProfile,
        connections: updatedConnections,
        activeConnectionId: newProfile.id
      });
    }

    if (action === 'delete') {
      if (!connectionId) {
        return NextResponse.json({ error: 'connectionId is required' }, { status: 400 });
      }

      if (connectionId === 'local-docker') {
        return NextResponse.json({ error: 'Cannot delete the default local Docker connection' }, { status: 400 });
      }

      const updatedConnections = connections.filter(c => c.id !== connectionId);
      const newActiveId = settings.activeConnectionId === connectionId ? 'local-docker' : settings.activeConnectionId;

      await updateSettings({
        connections: updatedConnections,
        activeConnectionId: newActiveId
      });

      return NextResponse.json({
        success: true,
        connections: updatedConnections,
        activeConnectionId: newActiveId
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
