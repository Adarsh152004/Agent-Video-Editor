import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  help?: string;
  error?: string;
  multiline?: boolean;
}

export function TextField({ label, help, error, id, className, multiline, ...rest }: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const noteId = `${inputId}-note`;
  const note = error ?? help;
  return (
    <div className={['ui-field', className].filter(Boolean).join(' ')}>
      <label className="ui-label" htmlFor={inputId}>
        {label}
      </label>
      {multiline ? <textarea
        {...rest as TextareaHTMLAttributes<HTMLTextAreaElement>}
        id={inputId}
        className="ui-input ui-input--multiline"
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? noteId : undefined}
      /> : <input
        {...rest}
        id={inputId}
        className="ui-input"
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? noteId : undefined}
      />}
      {note && (
        <p id={noteId} className={error ? 'ui-note ui-note--error' : 'ui-note'}>
          {note}
        </p>
      )}
    </div>
  );
}
