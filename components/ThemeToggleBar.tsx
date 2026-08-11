'use client';

import { useTheme } from './ThemeProvider';

export function ThemeToggleBar() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative w-16 h-8 rounded-full p-1 transition-colors duration-300 flex items-center justify-between cursor-pointer border shadow-inner ${
        isDark
          ? 'bg-slate-900 border-slate-700'
          : 'bg-slate-200 border-slate-300'
      }`}
      aria-label="Toggle theme"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {/* Sun Icon (shown on left when light mode or right when dark mode) */}
      <span className="w-6 flex items-center justify-center text-xs pointer-events-none select-none z-0">
        <svg
          className={`w-4 h-4 transition-opacity duration-200 ${isDark ? 'opacity-40 text-slate-400' : 'opacity-100 text-amber-500'}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      </span>

      {/* Moon Icon */}
      <span className="w-6 flex items-center justify-center text-xs pointer-events-none select-none z-0">
        <svg
          className={`w-3.5 h-3.5 transition-opacity duration-200 ${isDark ? 'opacity-100 text-indigo-300' : 'opacity-40 text-slate-500'}`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M21.64 13a1 1 0 00-1.05-.14 8.05 8.05 0 01-3.37.73A8.15 8.15 0 019.08 5.49a8.59 8.59 0 01.25-2A1 1 0 008 2.36 10.14 10.14 0 1022 14.05a1 1 0 00-.36-1.05z" />
        </svg>
      </span>

      {/* Sliding Knob */}
      <span
        className={`absolute top-1 left-1 w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${
          isDark
            ? 'translate-x-8 bg-slate-100 text-slate-900'
            : 'translate-x-0 bg-slate-900 text-white'
        }`}
      />
    </button>
  );
}
