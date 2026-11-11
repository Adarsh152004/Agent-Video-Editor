import type { AgentCapabilities, Settings } from '../shared/types.js';
import { commandText } from './process.js';

export interface AgentInvocation { args: string[]; capabilities: AgentCapabilities; display: string; }

function has(help: string, flag: string): boolean {
  return new RegExp(`(^|\\s)${flag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|=|$)`, 'm').test(help);
}

export function detectCapabilities(agent: Settings['agent'], help: string): AgentCapabilities {
  if (agent === 'claude' || agent === 'codex') return { headless: true, jsonStream: true, resume: true };
  return {
    headless: has(help, '--prompt') || has(help, '--print') || /(^|\s)(exec|headless)(\s|$)/m.test(help),
    jsonStream: help.includes('stream-json') || has(help, '--json'),
    resume: has(help, '--session') || help.includes('resume') || has(help, '--continue'),
  };
}

export function resolveAgentInvocation(settings: Settings, prompt: string, resumeId?: string): AgentInvocation {
  const help = settings.agentHelp ?? '';
  const capabilities = settings.capabilities ?? detectCapabilities(settings.agent, help);
  let args: string[];
  if (settings.agent === 'claude') {
    args = ['-p', prompt, '--output-format', 'stream-json', '--verbose', '--permission-mode', 'acceptEdits', '--allowedTools', 'Bash,Read,Write,Edit,Glob,Grep,WebFetch,WebSearch'];
    if (resumeId) args.push('--resume', resumeId);
  } else if (settings.agent === 'codex') {
    args = resumeId ? ['exec', 'resume', resumeId, prompt] : ['exec', '--json', '--full-auto', '-C', settings.workspace, prompt];
  } else if (has(help, '--prompt') && !has(help, '--print')) {
    args = ['--prompt', prompt];
    if (capabilities.jsonStream) args.push('--output-format', 'stream-json');
    if (settings.model) args.push('--model', settings.model);
    if (resumeId && has(help, '--session')) args.push('--session', resumeId);
  } else {
    args = [];
    if (resumeId && capabilities.resume) {
      if (has(help, '--resume')) args.push('--resume', resumeId);
      else if (/(^|\s)resume(\s|$)/m.test(help)) args.push('resume', resumeId);
      else if (has(help, '--continue')) args.push('--continue', resumeId);
    }
    if (!resumeId || !capabilities.resume) {
      if (has(help, '--print')) args.push('--print');
      else if (/(^|\s)exec(\s|$)/m.test(help)) args.push('exec');
      else if (/(^|\s)headless(\s|$)/m.test(help)) args.push('headless');
    }
    if (has(help, '--model') && settings.model) args.push('--model', settings.model);
    if (capabilities.jsonStream) {
      if (has(help, '--output-format') && help.includes('stream-json')) args.push('--output-format', 'stream-json');
      else if (has(help, '--format') && help.includes('stream-json')) args.push('--format', 'stream-json');
      else if (has(help, '--json')) args.push('--json');
    }
    const accessFlag = ['--dangerously-skip-permissions', '--yes', '--yolo', '--full-auto', '--allow-all'].find((flag) => has(help, flag));
    if (accessFlag) args.push(accessFlag);
    if (has(help, '--prompt')) args.push('--prompt', prompt);
    else args.push(prompt);
  }
  const displayArgs = args.map((arg) => arg === prompt ? '<PROMPT>' : arg);
  return { args, capabilities, display: commandText(settings.agentPath, displayArgs) };
}
