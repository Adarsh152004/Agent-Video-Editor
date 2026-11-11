import { spawn } from 'node:child_process';

export interface CommandResult { code: number | null; stdout: string; stderr: string; timedOut: boolean; command: string; }

export function commandText(command: string, args: string[]): string {
  return [command, ...args].map((part) => /\s/.test(part) ? JSON.stringify(part) : part).join(' ');
}

export function runCommand(command: string, args: string[], options: { cwd?: string; timeoutMs?: number; maxOutput?: number } = {}): Promise<CommandResult> {
  const timeoutMs = options.timeoutMs ?? 10000;
  const maxOutput = options.maxOutput ?? 2 * 1024 * 1024;
  return new Promise((resolve) => {
    try {
      const child = spawn(command, args, { cwd: options.cwd, env: process.env, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      const timer = setTimeout(() => { timedOut = true; child.kill('SIGTERM'); }, timeoutMs);
      child.stdout.on('data', (chunk: Buffer) => { if (stdout.length < maxOutput) stdout += chunk.toString('utf8'); });
      child.stderr.on('data', (chunk: Buffer) => { if (stderr.length < maxOutput) stderr += chunk.toString('utf8'); });
      child.on('error', (error) => { clearTimeout(timer); resolve({ code: null, stdout, stderr: error.message, timedOut, command: commandText(command, args) }); });
      child.on('close', (code) => { clearTimeout(timer); resolve({ code, stdout, stderr, timedOut, command: commandText(command, args) }); });
    } catch (err: unknown) {
      resolve({ code: null, stdout: '', stderr: err instanceof Error ? err.message : String(err), timedOut: false, command: commandText(command, args) });
    }
  });
}
