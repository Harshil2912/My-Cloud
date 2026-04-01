export function Input({ label, id, error, hint, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm
          focus:outline-none focus:ring-2 transition-colors
          ${error
            ? 'border-red-400 focus:ring-red-400'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
          } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {hint  && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
