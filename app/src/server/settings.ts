import { access, mkdir, readdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import type { Settings, WorkspaceInfo } from '../shared/types.js';
import { detectCapabilities, resolveAgentInvocation } from './agent.js';
import { HttpError } from './http.js';
import { runCommand } from './process.js';

async function exists(path: string): Promise<boolean> {
  try { await access(path); return true; } catch { return false; }
}

function workspacePython(workspace: string): string {
  return join(workspace, '.venv', process.platform === 'win32' ? 'Scripts' : 'bin', process.platform === 'win32' ? 'python.exe' : 'python');
}

function defaultPythonCommand(): string {
  return process.platform === 'win32' ? 'python' : 'python3';
}

export async function detectWorkspace(workspace: string): Promise<WorkspaceInfo> {
  if (!workspace) return { workspace: null, skillsDir: null, skills: { intro: false, longForm: false }, companions: [] };
  const root = await realpath(workspace).catch(() => null);
  if (!root) return { workspace: null, skillsDir: null, skills: { intro: false, longForm: false }, companions: [] };
  let skillsDir: string | null = null;
  for (const candidate of ['skills', join('.claude', 'skills'), join('.agents', 'skills')]) {
    const path = join(root, candidate);
    if (await exists(join(path, 'presenter-intro-editor', 'SKILL.md')) || await exists(join(path, 'presenter-long-form-editor', 'SKILL.md'))) {
      skillsDir = await realpath(path);
      break;
    }
  }
  if (!skillsDir) return { workspace: null, skillsDir: null, skills: { intro: false, longForm: false }, companions: [] };
  const entries = await readdir(skillsDir, { withFileTypes: true });
  const companions = entries.filter((entry) => entry.isDirectory() && (entry.name === 'video-use' || entry.name.startsWith('remotion'))).map((entry) => entry.name).sort();
  return {
    workspace: root,
    skillsDir,
    skills: { intro: await exists(join(skillsDir, 'presenter-intro-editor', 'SKILL.md')), longForm: await exists(join(skillsDir, 'presenter-long-form-editor', 'SKILL.md')) },
    companions,
    warning: companions.length ? undefined : 'Edits work, but with less guidance: companion skills are missing.',
  };
}

function validateSettings(value: Partial<Settings>): void {
  if (value.agent && !['kimi', 'claude', 'codex'].includes(value.agent)) throw new HttpError(400, 'Unknown agent.');
}

export class SettingsStore {
  private settings!: Settings;
  private loaded = false;
  constructor(private readonly defaultWorkspace: string, private readonly settingsFile = join(homedir(), '.agent-video-editor', 'settings.json')) {}

  async load(): Promise<Settings> {
    if (this.loaded) return this.settings;
    let stored: Partial<Settings> = {};
    try {
      const parsed: unknown = JSON.parse(await readFile(this.settingsFile, 'utf8'));
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) stored = parsed as Partial<Settings>;
    } catch { /* First run or an invalid file is replaced with safe defaults. */ }
    validateSettings(stored);
    const candidate = stored.workspace || (await detectWorkspace(this.defaultWorkspace)).workspace || '';
    const info = await detectWorkspace(candidate);
    const workspace = info.workspace ?? candidate;
    const venvPython = workspace ? workspacePython(workspace) : '';
    this.settings = {
      workspace,
      agent: stored.agent ?? 'kimi',
      agentPath: stored.agentPath ?? (stored.agent === 'claude' ? 'claude' : stored.agent === 'codex' ? 'codex' : 'kimi'),
      model: stored.model ?? '',
      python: stored.python ?? (venvPython && await exists(venvPython) ? venvPython : defaultPythonCommand()),
      lastFolder: stored.lastFolder,
      skillsDir: info.skillsDir ?? undefined,
      agentHelp: stored.agentHelp,
      capabilities: stored.capabilities,
      resolvedCommand: stored.resolvedCommand,
    };
    this.loaded = true;
    if (!info.workspace) this.settings.workspace = '';
    if (info.workspace) await this.inspectAgent(this.settings);
    await this.persist();
    if (workspace && info.workspace) await mkdir(join(info.workspace, 'edit'), { recursive: true });
    return this.settings;
  }

  get(): Settings { if (!this.loaded) throw new Error('Settings not loaded'); return { ...this.settings }; }

  async workspaceInfo(): Promise<WorkspaceInfo> { return detectWorkspace(this.settings.workspace); }

  async save(value: Settings): Promise<WorkspaceInfo> {
    validateSettings(value);
    const info = await detectWorkspace(value.workspace);
    if (!info.workspace || !info.skillsDir) throw new HttpError(400, 'Choose a valid editor workspace containing the editing skills.');
    const previous = this.settings;
    const agentChanged = value.agent !== previous.agent && value.agentPath === previous.agentPath;
    const next: Settings = {
      workspace: info.workspace,
      agent: value.agent,
      agentPath: agentChanged ? value.agent : value.agentPath,
      model: value.agent !== previous.agent && value.model === previous.model ? '' : value.model,
      python: value.python || (await exists(workspacePython(info.workspace)) ? workspacePython(info.workspace) : defaultPythonCommand()),
      lastFolder: value.lastFolder ?? this.settings.lastFolder,
      skillsDir: info.skillsDir,
    };
    if (!await this.inspectAgent(next)) throw new HttpError(400, `Could not run ${next.agentPath} --help. Choose an installed agent executable. ${next.agentHelp ?? ''}`);
    this.settings = next;
    await this.persist();
    await mkdir(join(info.workspace, 'edit'), { recursive: true });
    return info;
  }

  private async inspectAgent(settings: Settings): Promise<boolean> {
    // GUI-launched servers may not inherit ~/.local/bin in PATH.
    if (settings.agentPath === settings.agent) {
      const candidates = [
        ...(settings.agent === 'kimi' ? [join(homedir(), '.kimi-code', 'bin', 'kimi')] : []),
        join(homedir(), '.local', 'bin', settings.agent),
      ];
      for (const candidate of candidates) {
        if (await exists(candidate)) { settings.agentPath = candidate; break; }
      }
    }
    const result = await runCommand(settings.agentPath, ['--help'], { cwd: settings.workspace, timeoutMs: 10000 });
    settings.agentHelp = `${result.stdout}\n${result.stderr}`.trim();
    const available = result.code === 0 && !result.timedOut;
    settings.capabilities = available ? detectCapabilities(settings.agent, settings.agentHelp) : { headless: false, jsonStream: false, resume: false };
    settings.resolvedCommand = available ? resolveAgentInvocation(settings, '<PROMPT>').display : undefined;
    return available;
  }

  async refreshAgent(): Promise<void> {
    await this.inspectAgent(this.settings);
    await this.persist();
  }

  async setLastFolder(path: string): Promise<void> { this.settings.lastFolder = path; await this.persist(); }

  private async persist(): Promise<void> {
    await mkdir(dirname(this.settingsFile), { recursive: true });
    await writeFile(this.settingsFile, `${JSON.stringify(this.settings, null, 2)}\n`, { mode: 0o600 });
  }
}
