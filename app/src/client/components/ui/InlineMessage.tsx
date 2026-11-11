import type { ReactNode } from 'react';

export interface InlineMessageProps {
  tone?: 'info' | 'warning' | 'error';
  title?: string;
  children: ReactNode;
}

export function InlineMessage({ tone = 'info', title, children }: InlineMessageProps) {
  return (
    <div className={`ui-message ui-message--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {title && <p className="ui-message__title">{title}</p>}
      <div>{children}</div>
    </div>
  );
}
