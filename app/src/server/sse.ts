import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Job } from '../shared/types.js';

interface Client { req: IncomingMessage; res: ServerResponse }

export class SseHub {
  private clients = new Set<Client>();
  private queues = new Map<string, { job: Job; timer?: ReturnType<typeof setTimeout>; lastSent: number }>();

  connect(req: IncomingMessage, res: ServerResponse, jobs: Job[]): void {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write(': connected\n\n');
    const client = { req, res };
    this.clients.add(client);
    for (const job of jobs) this.write(res, job);
    const keepAlive = setInterval(() => res.write(': keep-alive\n\n'), 15000);
    req.on('close', () => { clearInterval(keepAlive); this.clients.delete(client); });
  }

  publish(job: Job): void {
    const previous = this.queues.get(job.id);
    if (previous?.timer) clearTimeout(previous.timer);
    const queue = { job, lastSent: previous?.lastSent ?? 0, timer: undefined as ReturnType<typeof setTimeout> | undefined };
    const send = () => {
      queue.timer = undefined;
      queue.lastSent = Date.now();
      for (const client of this.clients) this.write(client.res, queue.job);
    };
    const wait = 250 - (Date.now() - queue.lastSent);
    if (wait > 0) queue.timer = setTimeout(send, wait); else send();
    this.queues.set(job.id, queue);
  }

  private write(res: ServerResponse, job: Job): void { res.write(`event: job\ndata: ${JSON.stringify(job)}\n\n`); }
}
