import { useId } from 'react';

type Props = {
  label: string;
  name: string;
  type?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  autoComplete?: string;
  defaultValue?: string;
  multiline?: boolean;
  children?: React.ReactNode; // for <select> options
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  dir?: 'ltr' | 'rtl' | 'auto';
};

/** Accessible form field: visible label, hint and error linked with aria-describedby. */
export function Field({ label, name, type = 'text', hint, error, required, autoComplete, defaultValue, multiline, children, inputMode, dir }: Props) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined;
  const common = {
    id,
    name,
    required,
    'aria-invalid': error ? (true as const) : undefined,
    'aria-describedby': describedBy,
    defaultValue,
  };
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint && <span id={hintId} className="hint">{hint}</span>}
      {error && <span id={errId} className="error-text">{error}</span>}
      {children ? (
        <select {...common}>{children}</select>
      ) : multiline ? (
        <textarea {...common} />
      ) : (
        <input {...common} type={type} autoComplete={autoComplete} inputMode={inputMode} dir={dir} />
      )}
    </div>
  );
}

export function Honeypot() {
  return (
    <div className="hp" aria-hidden="true">
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

export function Alert({ kind, children }: { kind: 'success' | 'error' | 'info' | 'warning'; children: React.ReactNode }) {
  return (
    <div className={`notice notice-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
