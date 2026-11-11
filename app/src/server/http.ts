import type { IncomingMessage } from 'node:http';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function readJson<T>(req: IncomingMessage, limit = 1024 * 1024): Promise<T> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > limit) throw new HttpError(413, 'Request body is too large.');
    chunks.push(buffer);
  }
  try {
    const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('object required');
    return value as T;
  } catch {
    throw new HttpError(400, 'Invalid JSON body.');
  }
}

export function errorMessage(error: unknown): { status: number; error: string } {
  if (error instanceof HttpError) return { status: error.status, error: error.message };
  return { status: 500, error: error instanceof Error ? error.message : 'Internal error' };
}
