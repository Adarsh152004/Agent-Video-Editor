import type { DirListing, Job, JobSettings, MediaInfo, Settings, WorkspaceInfo } from '../../shared/types';
import type { Api } from './Api';
import { authHeaders, clientToken, clearClientToken } from './auth';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = clientToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(path, { ...init, headers });
  if (!response.ok) {
    if (response.status === 401) clearClientToken();
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error || response.statusText);
  }
  return response.json() as Promise<T>;
}

function jsonBody(value: unknown): RequestInit {
  return { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) };
}

export class HttpApi implements Api {
  getWorkspace() { return request<WorkspaceInfo>('/api/workspace'); }
  getSettings() { return request<Settings>('/api/settings'); }
  saveSettings(settings: Settings) { return request<WorkspaceInfo>('/api/settings', { ...jsonBody(settings), method: 'PUT' }); }
  listDir(path?: string) { return request<DirListing>(`/api/fs/list${path ? `?path=${encodeURIComponent(path)}` : ''}`); }
  probe(path: string) { return request<MediaInfo>('/api/probe', { ...jsonBody({ path }), method: 'POST' }); }
  uploadFile(file: File, onProgress: (fraction: number) => void, signal?: AbortSignal) {
    return new Promise<MediaInfo>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload');
      const headers = authHeaders();
      for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value);
      xhr.setRequestHeader('X-File-Name', encodeURIComponent(file.name));
      xhr.upload.onprogress = (event) => event.lengthComputable && onProgress(event.loaded / event.total);
      xhr.onload = () => {
        const body = JSON.parse(xhr.responseText || '{}') as MediaInfo & { error?: string };
        if (xhr.status < 400) resolve(body); else reject(new Error(body.error || 'Upload failed'));
      };
      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.onabort = () => reject(new DOMException('Cancelled', 'AbortError'));
      signal?.addEventListener('abort', () => xhr.abort(), { once: true });
      xhr.send(file);
    });
  }
  async projectExists(name: string, outputFolder?: string) { return (await request<{ exists: boolean }>(`/api/projects/${encodeURIComponent(name)}/exists${outputFolder ? `?outputFolder=${encodeURIComponent(outputFolder)}` : ''}`)).exists; }
  startJob(settings: JobSettings) { return request<Job>('/api/jobs', { ...jsonBody(settings), method: 'POST' }); }
  async answerQuestions(jobId: string, answers: Record<string, string>) { await request<{ ok: true }>(`/api/jobs/${jobId}/answers`, { ...jsonBody({ answers }), method: 'POST' }); }
  async cancelJob(jobId: string) { await request<{ ok: true }>(`/api/jobs/${jobId}/cancel`, { method: 'POST' }); }
  listJobs() { return request<Job[]>('/api/jobs'); }
  async reveal(path: string) { await request<{ ok: true }>('/api/reveal', { ...jsonBody({ path }), method: 'POST' }); }
  mediaUrl(path: string) { return `/api/media?path=${encodeURIComponent(path)}&t=${encodeURIComponent(clientToken() ?? '')}`; }
  onJobUpdate(cb: (job: Job) => void) {
    const events = new EventSource(`/api/events?t=${encodeURIComponent(clientToken() ?? '')}`);
    const listener = (event: MessageEvent) => cb(JSON.parse(event.data) as Job);
    events.addEventListener('job', listener);
    return () => { events.removeEventListener('job', listener); events.close(); };
  }
  onConnectionChange(cb: (connected: boolean) => void) {
    const events = new EventSource(`/api/events?t=${encodeURIComponent(clientToken() ?? '')}`);
    events.onopen = () => cb(true);
    events.onerror = async () => {
      try {
        const res = await fetch('/api/health', { headers: authHeaders() });
        if (res.status === 401) {
          clearClientToken();
          window.location.reload();
          return;
        }
      } catch {}
      cb(false);
    };
    return () => events.close();
  }
}
