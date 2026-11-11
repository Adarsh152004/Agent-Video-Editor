export type SkillId = 'intro' | 'long-form';
export type PhaseId = 'intake' | 'transcribe' | 'brand-assets' | 'repo-captures' | 'directive' | 'validate' | 'graphics' | 'composite' | 'verify' | 'deliver';
export type JobStatus = 'preparing' | 'processing' | 'needs-decision' | 'complete' | 'failed' | 'cancelled';
export type FailureKind = 'missing-tool' | 'disk-full' | 'invalid-plan' | 'repo-capture' | 'verification' | 'agent-error' | 'cancelled';
export interface MediaInfo { path: string; kind: 'video' | 'audio'; durationS: number; width?: number; height?: number; fps?: string; sampleRate?: number; channels?: number; }
export interface DirEntry { name: string; path: string; kind: 'dir' | 'video' | 'audio' | 'other'; sizeBytes?: number; }
export interface DirListing { path: string; parent: string | null; entries: DirEntry[]; }
export interface Section { id: string; path: string; kind: 'camera' | 'voiceover'; media?: MediaInfo; }
export interface JobSettings {
  skill: SkillId; theme: string; projectName: string; outputFolder?: string;
  approvalMode: 'finished' | 'review-plan'; loudness: 'keep' | 'normalise' | 'propose';
  captions: boolean; allowRemoteUpload: boolean; notes: string;
  sections: Section[];
  repoRecordings?: { url: string; path: string }[];
  presenterFraming?: 'full-frame' | 'never-full-frame';
  delivery?: 'source' | '4k';
}
export interface PhaseState { id: PhaseId; state: 'pending' | 'active' | 'done' | 'skipped' | 'failed' | 'waiting'; message?: string; }
export interface Question { id: string; text: string; context?: string; options?: string[]; }
export interface Check { check: string; pass: boolean; detail: string; }
export interface JobResult { masterPath: string; durationS?: number; width?: number; height?: number; fps?: string; checks: Check[]; projectDir: string; cost?: number; }
export interface Job { id: string; settings: JobSettings; status: JobStatus; createdAt: string; phases: PhaseState[]; percent: number; activity: string[]; questions?: Question[]; result?: JobResult; failure?: { kind: FailureKind; summary: string; details: string[]; phase?: PhaseId }; progressStale?: boolean; }
export interface WorkspaceInfo { workspace: string | null; skillsDir: string | null; skills: { intro: boolean; longForm: boolean }; companions: string[]; warning?: string; }
export interface AgentCapabilities { headless: boolean; jsonStream: boolean; resume: boolean; }
export interface Settings { workspace: string; agent: 'kimi' | 'claude' | 'codex'; agentPath: string; model: string; python: string; lastFolder?: string; skillsDir?: string; agentHelp?: string; capabilities?: AgentCapabilities; resolvedCommand?: string; }
