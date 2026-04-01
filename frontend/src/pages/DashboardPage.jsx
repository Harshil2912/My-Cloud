import { useState } from 'react';
import { FileList } from '../components/files/FileList';
import { ShareModal } from '../components/shares/ShareModal';
import { useFiles } from '../hooks/useFiles';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { formatBytes } from '../utils/formatBytes';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [page, setPage]         = useState(1);
  const { files, total, loading, error, refetch, deleteFile } = useFiles({ page, limit: 20 });
  const [shareTarget, setShareTarget] = useState(null);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="flex-1 overflow-y-auto pr-1">
      <div className="glass-card card-hover-lift mb-5 flex items-center justify-between p-5">
        <div>
          <h1 className="text-xl font-semibold brand-neon-text-soft">My Files</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{total} file{total !== 1 ? 's' : ''} · {formatBytes(user?.storageUsed ?? 0)} used</p>
        </div>
        <Link to="/upload">
          <Button>Upload</Button>
        </Link>
      </div>

      <FileList
        files={files}
        loading={loading}
        error={error}
        onRefresh={refetch}
        onOpenShare={setShareTarget}
      />

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
          <span className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400">{page} / {totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</Button>
        </div>
      )}

      {shareTarget && (
        <ShareModal
          file={shareTarget}
          onClose={() => setShareTarget(null)}
          onCreated={refetch}
        />
      )}
    </div>
  );
}
