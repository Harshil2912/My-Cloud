import { useState } from 'react';
import { SharedFileCard } from './SharedFileCard';
import { Spinner } from '../ui/Spinner';
import { sharesApi } from '../../api/sharesApi';
import { useToast } from '../ui/Toast';

export function SharedList({ shares, loading, error, onRefresh, canRevoke = false }) {
  const [downloading, setDownloading] = useState(null);
  const { addToast } = useToast();

  const handleDownload = async shareId => {
    setDownloading(shareId);
    try {
      const res  = await sharesApi.downloadShared(shareId);
      const blob = new Blob([res.data]);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      const cd   = res.headers['content-disposition'] ?? '';
      const match = cd.match(/filename="?([^"]+)"?/);
      a.download  = match?.[1] ?? `shared-${shareId}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      addToast('Download failed', 'error');
    } finally {
      setDownloading(null);
    }
  };

  const handleRevoke = async shareId => {
    if (!window.confirm('Revoke this share?')) return;
    try {
      await sharesApi.revoke(shareId);
      onRefresh();
      addToast('Share revoked', 'success');
    } catch {
      addToast('Failed to revoke share', 'error');
    }
  };

  if (loading) return <div className="glass-card flex justify-center py-12"><Spinner /></div>;
  if (error)   return <p className="glass-card py-8 text-center text-red-500">{error}</p>;
  if (!shares.length) return <p className="glass-card py-12 text-center text-slate-500 dark:text-slate-400">Nothing here yet.</p>;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {shares.map(share => (
        <SharedFileCard
          key={share.id}
          share={share}
          onDownload={handleDownload}
          onRevoke={handleRevoke}
          downloading={downloading}
          canRevoke={canRevoke}
        />
      ))}
    </div>
  );
}
