import type { ReactNode } from 'react';

export interface StatusBadgeProps {
  tone?: 'neutral' | 'success' | 'danger' | 'warning';
  children: ReactNode;
}

export function StatusBadge({ tone = 'neutral', children }: StatusBadgeProps) {
  return (
    <span className={`ui-badge ui-badge--${tone}`}>
      <span className="ui-badge__dot" aria-hidden="true" />
      {children}
    </span>
  );
}
