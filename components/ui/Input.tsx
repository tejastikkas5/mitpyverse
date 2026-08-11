import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-slate-950 border ${
          error ? 'border-rose-500' : 'border-slate-800 focus:border-indigo-500'
        } rounded-lg px-3.5 py-2 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
    </div>
  );
}
