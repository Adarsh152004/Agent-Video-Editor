export interface ParsedOutput {
  activity: string[];
  sessionId?: string;
  terminal?: 'success' | 'error';
  cost?: number;
}

function short(value: string, length = 300): string { return value.length > length ? value.slice(0, length) : value; }

function visit(value: unknown, output: ParsedOutput, parentKey = ''): void {
  if (Array.isArray(value)) { for (const item of value) visit(item, output, parentKey); return; }
  if (!value || typeof value !== 'object') return;
  const record = value as Record<string, unknown>;
  const type = typeof record.type === 'string' ? record.type.toLowerCase() : '';
  const toolName = record.tool_name ?? record.tool ?? ((type.includes('tool') || parentKey === 'calls') ? record.name : undefined);
  if (typeof toolName === 'string') {
    const input = record.input ?? record.arguments ?? record.args;
    let summary = '';
    if (input && typeof input === 'object' && typeof (input as Record<string, unknown>).command === 'string') summary = short((input as Record<string, unknown>).command as string, 160);
    else if (typeof record.command === 'string') summary = short(record.command, 160);
    else if (typeof record.summary === 'string') summary = short(record.summary, 160);
    output.activity.push(`-> ${toolName}${summary ? ` ${summary}` : ''}`);
  }
  for (const [key, child] of Object.entries(record)) {
    const lower = key.toLowerCase();
    if (['text', 'message', 'content', 'delta'].includes(lower) && typeof child === 'string' && child.trim()) output.activity.push(short(child));
    if (['session_id', 'sessionid', 'thread_id', 'threadid', 'conversation_id', 'conversationid'].includes(lower) && typeof child === 'string') output.sessionId = child;
    if (['cost', 'total_cost', 'total_cost_usd', 'cost_usd'].includes(lower) && typeof child === 'number' && Number.isFinite(child)) output.cost = child;
    if (['status', 'state'].includes(lower) && typeof child === 'string' && /terminal|result|done|complete|error|finished/.test(`${type} ${parentKey}`)) {
      if (['error', 'failed', 'failure'].includes(child.toLowerCase())) output.terminal = 'error';
      if (['success', 'succeeded', 'complete', 'completed', 'done'].includes(child.toLowerCase())) output.terminal = 'success';
    }
    if (child && typeof child === 'object') visit(child, output, lower);
  }
}

export function parseOutputLine(line: string): ParsedOutput {
  const output: ParsedOutput = { activity: [] };
  const trimmed = line.trim();
  if (!trimmed) return output;
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const type = (parsed as Record<string, unknown>).type;
      const known = typeof type !== 'string' || /message|content|delta|tool|result|done|error|session|thread|conversation|completion|assistant|agent|status|turn|response|item|event|success/i.test(type);
      if (known) visit(parsed, output);
    } else output.activity.push(short(trimmed));
  } catch {
    output.activity.push(trimmed);
  }
  return output;
}

export class AgentOutputParser {
  private partial = '';
  constructor(private readonly consume: (line: string, output: ParsedOutput) => void) {}
  push(chunk: string): void {
    const lines = (this.partial + chunk).split(/\r?\n/);
    this.partial = lines.pop() ?? '';
    for (const line of lines) this.consume(line, parseOutputLine(line));
  }
  end(): void {
    if (!this.partial) return;
    const line = this.partial;
    this.partial = '';
    this.consume(line, parseOutputLine(line));
  }
}
