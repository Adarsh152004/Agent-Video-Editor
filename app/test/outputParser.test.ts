import { describe, expect, it, vi } from 'vitest';
import { AgentOutputParser, parseOutputLine } from '../src/server/outputParser';

 describe('generic agent output parser', () => {
  it('extracts activity, tool calls, session, cost and terminal status generically', () => {
    expect(parseOutputLine('{"type":"message","message":"Writing plan","session_id":"session-1","cost":0.25}')).toMatchObject({ activity: ['Writing plan'], sessionId: 'session-1', cost: 0.25 });
    expect(parseOutputLine('{"type":"tool_call","name":"Bash","input":{"command":"ffmpeg -version"}}').activity).toEqual(['-> Bash ffmpeg -version']);
    expect(parseOutputLine('{"type":"result","status":"error"}').terminal).toBe('error');
    expect(parseOutputLine('plain agent output').activity).toEqual(['plain agent output']);
  });
  it('keeps a split final line buffered until end', () => {
    const consume = vi.fn();
    const parser = new AgentOutputParser(consume);
    parser.push('{"type":"message","text":"hel');
    expect(consume).not.toHaveBeenCalled();
    parser.push('lo"}');
    expect(consume).not.toHaveBeenCalled();
    parser.end();
    expect(consume.mock.calls[0][1].activity).toEqual(['hello']);
  });
  it('ignores unknown JSON event types', () => {
    expect(parseOutputLine('{"type":"vendor_unknown_future","text":"ignore me"}').activity).toEqual([]);
  });
 });
