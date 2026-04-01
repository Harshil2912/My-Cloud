import { formatBytes } from '../../utils/formatBytes';
import { timeAgo } from '../../utils/formatDate';
import { Button } from '../ui/Button';

export function SharedFileCard({ share, onDownload, onRevoke, downloading, canRevoke }) {
  const file = share.file ?? share;

  return (
    <div className="glass-card card-hover-lift flex items-start justify-between p-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100" title={file.original_name}>
          {file.original_name}
        </p>
        <p className="mt-0.5 space-x-2 text-xs text-slate-500 dark:text-slate-400">
          {file.size_bytes != null && <span>{formatBytes(file.size_bytes)}</span>}
          {share.shared_by && <><span>·</span><span>from {share.shared_by}</span></>}
          {share.created_at && <><span>·</span><span>{timeAgo(share.created_at)}</span></>}
        </p>
        {share.expires_at && (
          <p className="mt-1 text-xs text-amber-500">Expires {timeAgo(share.expires_at)}</p>
        )}
      </div>

      <div className="ml-4 flex flex-col gap-1 shrink-0">
        <Button size="sm" variant="secondary" onClick={() => onDownload(share.id)} loading={downloading === share.id}>
          Download
        </Button>
        {canRevoke && (
          <Button size="sm" variant="danger" onClick={() => onRevoke(share.id)}>
            Revoke
          </Button>
        )}
      </div>
    </div>
  );
}
