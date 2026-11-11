export interface ProgressBarProps {
  label: string;
  /** 0 to 100. Leave undefined for an indeterminate bar. */
  value?: number;
}

export function ProgressBar({ label, value }: ProgressBarProps) {
  const pct = value === undefined ? undefined : Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={pct === undefined ? 'ui-progress ui-progress--indeterminate' : 'ui-progress'}
    >
      <div className="ui-progress__fill" style={pct === undefined ? undefined : { width: `${pct}%` }} />
    </div>
  );
}
