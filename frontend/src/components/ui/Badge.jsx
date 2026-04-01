const VARIANTS = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-800',
  error:   'bg-red-100   text-red-700',
  info:    'bg-blue-100  text-blue-700',
};

export function Badge({ label, variant = 'default', className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${VARIANTS[variant]} ${className}`}>
      {label}
    </span>
  );
}
