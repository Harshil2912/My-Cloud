import { useShares } from '../hooks/useShares';
import { SharedList } from '../components/shares/SharedList';

export default function SharedWithMePage() {
  const { sharedWithMe, loading, error, refetch } = useShares();

  return (
    <div className="flex-1 overflow-y-auto pr-1">
      <div className="glass-card mb-5 p-5">
        <h1 className="text-xl font-semibold brand-neon-text-soft">Shared with Me</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Files other users have shared with you</p>
      </div>
      <SharedList
        shares={sharedWithMe}
        loading={loading}
        error={error}
        onRefresh={refetch}
        canRevoke={false}
      />
    </div>
  );
}
