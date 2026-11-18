import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || props.name;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-zinc-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3.5 py-2 text-sm bg-white text-zinc-900 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 ${
          error
            ? 'border-rose-500 focus:ring-rose-500'
            : 'border-zinc-300'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-500">{error}</p>}
      {!error && helperText && <p className="text-xs text-zinc-500">{helperText}</p>}
    </div>
  );
};
