export function BrandLogo({ size = 'md', showText = true, className = '', textClassName = '' }) {
  const iconSizes = {
    sm: 'h-10 w-10',
    md: 'h-14 w-14',
    lg: 'h-24 w-24',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-4xl',
  };

  return (
    <div className={`inline-flex flex-col items-center gap-1 ${className}`} style={{ color: 'var(--brand-color)' }}>
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={iconSizes[size] || iconSizes.md}
        aria-hidden="true"
      >
        <path
          d="M15.5 43.5h31a10.5 10.5 0 0 0 1.3-20.9A18 18 0 0 0 14.6 27a9.5 9.5 0 0 0 .9 16.5Z"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18 39.8c6.2 2 24.9 2 31.8-2.8"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      {showText && (
        <span className={`brand-neon-text-soft font-bold tracking-tight leading-none ${textSizes[size] || textSizes.md} ${textClassName}`}>
          MY Cloud
        </span>
      )}
    </div>
  );
}
