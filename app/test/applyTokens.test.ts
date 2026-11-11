import { describe, expect, it } from 'vitest';
import { applyTokens } from '../src/client/design/applyTokens';

function fakeRoot() {
  const props = new Map<string, string>();
  return { props, style: { setProperty: (name: string, value: string) => void props.set(name, value) } };
}

describe('applyTokens', () => {
  it('writes tokens as CSS custom properties on the root', () => {
    const root = fakeRoot();
    applyTokens(root, false);
    // accent changed from the prompt default #3659E3 to #5f8b3e by frontend-design.md (see README)
    expect(root.props.get('--color-accent')).toBe('#5f8b3e');
    expect(root.props.get('--space-4')).toBe('16px');
    expect(root.props.get('--color-surface-raised')).toBe('#ffffff');
    expect(root.props.get('--weight-semibold')).toBe('600');
    expect(root.props.get('--duration-normal')).toBe('180ms');
  });

  it('sets every duration to 0 for reduced motion', () => {
    const root = fakeRoot();
    applyTokens(root, true);
    expect(root.props.get('--duration-fast')).toBe('0ms');
    expect(root.props.get('--duration-slow')).toBe('0ms');
  });
});

it('switches dark and light palettes without losing spacing or reduced motion', () => {
  const root = fakeRoot();
  applyTokens(root, true, 'dark');
  expect(root.props.get('--color-surface-raised')).toBe('#202923');
  expect(root.props.get('--border-hairline')).toBe('1px solid var(--color-border)');
  expect(root.props.get('--space-4')).toBe('16px');
  expect(root.props.get('--duration-normal')).toBe('0ms');
  applyTokens(root, false, 'light');
  expect(root.props.get('--color-surface-raised')).toBe('#ffffff');
  expect(root.props.get('--duration-normal')).toBe('180ms');
});
