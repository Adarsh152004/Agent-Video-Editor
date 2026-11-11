import type { DirListing, Job, JobSettings, MediaInfo, Settings, WorkspaceInfo } from '../../shared/types';

export interface Api {
  getWorkspace(): Promise<WorkspaceInfo>;
  getSettings(): Promise<Settings>;
  saveSettings(s: Settings): Promise<WorkspaceInfo>;
  listDir(path?: string): Promise<DirListing>;
  probe(path: string): Promise<MediaInfo>;
  uploadFile(file: File, onProgress: (fraction: number) => void, signal?: AbortSignal): Promise<MediaInfo>;
  projectExists(name: string, outputFolder?: string): Promise<boolean>;
  startJob(settings: JobSettings): Promise<Job>;
  answerQuestions(jobId: string, answers: Record<string, string>): Promise<void>;
  cancelJob(jobId: string): Promise<void>;
  listJobs(): Promise<Job[]>;
  reveal(path: string): Promise<void>;
  mediaUrl(path: string): string;
  onJobUpdate(cb: (job: Job) => void): () => void;
  onConnectionChange(cb: (connected: boolean) => void): () => void;
}
