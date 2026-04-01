/**
 * Format an ISO date string or timestamp into a locale string.
 * @param {string|number|Date} value
 * @returns {string}
 */
export function formatDate(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString(undefined, {
    year:   'numeric',
    month:  'short',
    day:    'numeric',
    hour:   '2-digit',
    minute: '2-digit'
  });
}

/**
 * Return a relative time string like "2 hours ago".
 * @param {string|number|Date} value
 * @returns {string}
 */
export function timeAgo(value) {
  if (!value) return '—';
  const now  = Date.now();
  const then = new Date(value).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
