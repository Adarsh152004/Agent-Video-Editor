import { expect, it } from 'vitest';
import { detectCapabilities, resolveAgentInvocation } from '../src/server/agent';
import type { Settings } from '../src/shared/types';

const help = `  -S, --session [id] Resume a session
  -p, --prompt <prompt> Run one prompt non-interactively
  -m, --model <model> Model alias
  --output-format <format> choices: text, stream-json
  --yolo Ask when needed
  --auto Never ask`;
const settings: Settings = { workspace: '/workspace', agent: 'kimi', agentPath: '/installed/kimi', model: '', python: '/python', agentHelp: help };
it('supports the installed Kimi prompt protocol without conflicting permission flags', () => {
  expect(detectCapabilities('kimi', help)).toEqual({ headless: true, jsonStream: true, resume: true });
  expect(resolveAgentInvocation(settings, 'edit video').args).toEqual(['--prompt', 'edit video', '--output-format', 'stream-json']);
});
it('resumes the exact Kimi session and honors an explicit model', () => {
  expect(resolveAgentInvocation({ ...settings, model: 'my-model' }, 'continue', 'session-1').args).toEqual(['--prompt', 'continue', '--output-format', 'stream-json', '--model', 'my-model', '--session', 'session-1']);
});
it('keeps the legacy print interface working with a named prompt argument', () => {
  const invocation = resolveAgentInvocation({ ...settings, agentHelp: '--print Run headless\n--prompt PROMPT\n--output-format stream-json\n--yes\n' }, 'edit video');
  expect(invocation.args).toContain('--print');
  expect(invocation.args.slice(-2)).toEqual(['--prompt', 'edit video']);
});
