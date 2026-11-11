export interface ScrubberProps {
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}

export function Scrubber({ label, value, max, onChange }: ScrubberProps) {
  return <input className="ui-scrubber" type="range" aria-label={label} min={0} max={max || 0} step={0.1} value={value} onChange={(event) => onChange(Number(event.target.value))} />;
}
