import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  actions?: ReactNode;
}

export function Card({ title, actions, className, children, ...rest }: CardProps) {
  return (
    <section {...rest} className={['ui-card', className].filter(Boolean).join(' ')}>
      {(title || actions) && (
        <header className="ui-card__header">
          {title && <h2 className="ui-card__title">{title}</h2>}
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}
