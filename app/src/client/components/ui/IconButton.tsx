import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Required: icon buttons have no visible text. */
  label: string;
  icon: ReactNode;
  size?: 'sm' | 'md';
}

export function IconButton({ label, icon, size = 'md', className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      aria-label={label}
      title={label}
      className={['ui-iconbtn', `ui-iconbtn--${size}`, className].filter(Boolean).join(' ')}
    >
      {icon}
    </button>
  );
}
