import { exec } from 'child_process';
import { promisify } from 'util';
import { addLog } from '@/lib/logs/logger';

const execAsync = promisify(exec);

export interface ContainerStatus {
  status: 'RUNNING' | 'STOPPED' | 'NOT_FOUND';
  containerName: string;
  containerId?: string;
  uptime?: string;
  image?: string;
  error?: string;
}

export async function checkDockerContainer(containerName: string = process.env.MONGODB_CONTAINER || 'ast-mongodb'): Promise<ContainerStatus> {
  try {
    const { stdout } = await execAsync(`docker inspect --format='{{.State.Status}}|{{.Id}}|{{.State.StartedAt}}|{{.Config.Image}}' ${containerName}`);
    const [statusStr, id, startedAt, image] = stdout.trim().split('|');

    if (statusStr === 'running') {
      return {
        status: 'RUNNING',
        containerName,
        containerId: id.substring(0, 12),
        uptime: startedAt ? `Started ${new Date(startedAt).toLocaleString()}` : 'Running',
        image
      };
    } else {
      return {
        status: 'STOPPED',
        containerName,
        containerId: id ? id.substring(0, 12) : undefined,
        error: `Container is in state: ${statusStr}`
      };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes('No such object') || errorMsg.includes('Error: No such container')) {
      return {
        status: 'NOT_FOUND',
        containerName,
        error: `Container ${containerName} not found on host.`
      };
    }
    return {
      status: 'NOT_FOUND',
      containerName,
      error: `Docker check error: ${errorMsg}`
    };
  }
}

export async function execInContainer(
  containerName: string,
  command: string,
  options?: { timeout?: number }
): Promise<{ stdout: string; stderr: string }> {
  const fullCommand = `docker exec ${containerName} ${command}`;
  try {
    const result = await execAsync(fullCommand, { timeout: options?.timeout || 120000 });
    return result;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await addLog('ERROR', `Docker exec failed in ${containerName}: ${command}`, { error: errorMsg });
    throw err;
  }
}
