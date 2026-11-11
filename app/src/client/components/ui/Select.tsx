import { useId, type SelectHTMLAttributes } from 'react';
import { ChevronDownIcon } from './icons';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label: string;
  options: SelectOption[];
  help?: string;
}

export function Select({ label, options, help, id, className, ...rest }: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <div className={['ui-field', className].filter(Boolean).join(' ')}>
      <label className="ui-label" htmlFor={selectId}>
        {label}
      </label>
      <div className="ui-select">
        <select {...rest} id={selectId} className="ui-input" aria-describedby={help ? `${selectId}-note` : undefined}>
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="ui-select__chevron" />
      </div>
      {help && (
        <p id={`${selectId}-note`} className="ui-note">
          {help}
        </p>
      )}
    </div>
  );
}
