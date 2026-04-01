import { useTheme } from '../../context/ThemeContext';

export function ThemeToggle({ compact = false }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`group inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[rgba(var(--brand-rgb),0.35)] hover:shadow-[0_0_0_1px_rgba(var(--brand-rgb),0.25),0_8px_20px_rgba(0,0,0,0.25)] ${compact ? 'h-9 w-9 justify-center p-0' : 'gap-2 p-1 pr-3'}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span className={`inline-flex items-center justify-center rounded-full transition-all duration-200 ${compact ? 'h-6 w-6' : 'h-7 w-7'} ${isDark ? 'bg-[rgba(var(--brand-rgb),0.2)] text-[var(--brand-color)]' : 'bg-[rgba(15,23,42,0.08)] text-slate-500'}`}>
        {isDark ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
        )}
      </span>
      {!compact && <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{isDark ? 'Dark' : 'Light'}</span>}
    </button>
  );
}
