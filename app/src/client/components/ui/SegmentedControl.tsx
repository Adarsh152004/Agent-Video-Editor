import { useRef, type KeyboardEvent } from 'react';

export interface Segment<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string> {
  label: string;
  options: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

/** A radio group drawn as joined buttons. Arrow keys move the selection. */
export function SegmentedControl<T extends string>({ label, options, value, onChange, disabled }: SegmentedControlProps<T>) {
  const ref = useRef<HTMLDivElement>(null);

  function onKeyDown(e: KeyboardEvent) {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const enabled = options.filter((o) => !o.disabled);
    const next = enabled[(enabled.findIndex((o) => o.value === value) + step + enabled.length) % enabled.length];
    if (!next) return;
    onChange(next.value);
    ref.current?.querySelector<HTMLButtonElement>(`[data-value="${CSS.escape(next.value)}"]`)?.focus();
  }

  return (
    <div ref={ref} role="radiogroup" aria-label={label} className="ui-segmented" onKeyDown={onKeyDown}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            data-value={o.value}
            tabIndex={selected ? 0 : -1}
            disabled={disabled || o.disabled}
            className="ui-segmented__item"
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
