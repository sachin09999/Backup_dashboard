import { executeBackup } from '@/lib/backup/backupEngine';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        await executeBackup((event) => {
          sendEvent(event);
        });

        // End stream cleanly
        sendEvent({ step: 7, totalSteps: 7, status: 'completed', message: 'Stream completed' });
        controller.close();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        sendEvent({ step: 0, totalSteps: 7, status: 'failed', message: msg });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    }
  });
}
