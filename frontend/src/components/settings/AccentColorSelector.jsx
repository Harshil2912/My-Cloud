import { useTheme } from '../../context/ThemeContext';

const ACCENT_PALETTE = [
  '#3b82f6',
  '#1e40af',
  '#22d3ee',
  '#0e7490',
  '#10b981',
  '#f59e0b',
  '#f43f5e',
  '#8b5cf6',
];

export function AccentColorSelector() {
  const { accentColor, setAccentColor } = useTheme();

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Accent</p>
      <div className="grid grid-cols-8 gap-2">
        {ACCENT_PALETTE.map(color => {
          const selected = accentColor === color;
          return (
            <button
              key={color}
              type="button"
              onClick={() => setAccentColor(color)}
              className={`h-5 w-5 rounded-full border transition-all duration-150 ${selected ? 'border-white/80 ring-2 ring-[rgba(var(--brand-rgb),0.35)]' : 'border-black/10 dark:border-white/20'}`}
              style={{ backgroundColor: color }}
              aria-label={`Set accent color ${color}`}
              title={color}
            />
          );
        })}
      </div>
    </div>
  );
}
