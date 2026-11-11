import { tokens } from '../../design/tokens';

interface SpinnerProps {
  size?: 'sm' | 'md';
  /** Announced to screen readers. Omit when a parent already says it is busy. */
  label?: string;
}

export function Spinner({ size = 'md', label }: SpinnerProps) {
  const px = size === 'sm' ? tokens.icon.sm : tokens.icon.lg;
  return (
    <svg
      className="ui-spinner"
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity={0.2} strokeWidth={3} />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}
