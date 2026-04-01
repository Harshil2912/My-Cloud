import { useEffect, useState } from 'react';
import { healthApi } from '../api/healthApi';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatBytes } from '../utils/formatBytes';
import { useAuth } from '../context/AuthContext';
import { isOwnerUser } from '../utils/isOwnerUser';

const STATUS_VARIANT = { ok: 'success', degraded: 'warning', error: 'error' };

function Section({ title, trend = 'up', progress = 0, children }) {
  return (
    <div className="glass-card card-hover-lift p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold brand-neon-text-soft">{title}</h2>
        <span className={`text-xs ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-slate-400'}`}>
          {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
        </span>
      </div>
      <div className="mb-3 h-1.5 w-full rounded-full bg-white/10">
        <div className="neon-progress h-1.5 rounded-full" style={{ width: `${Math.max(8, progress)}%` }} />
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-white/10 py-1.5 text-sm last:border-0">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-800 dark:text-slate-100">{value ?? '—'}</span>
    </div>
  );
}

function StatusDot({ status }) {
  const cls = status === 'ok' ? 'ok' : status === 'error' ? 'err' : 'warn';
  return <span className={`status-dot ${cls}`} aria-hidden="true" />;
}

export default function HealthPage() {
  const { user } = useAuth();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await healthApi.getHealth();
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch health data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHealth(); }, []);

  if (!isOwnerUser(user)) {
    return <div className="flex-1 p-6 text-slate-500">You do not have access to system insights.</div>;
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>;
  if (error)   return <div className="flex-1 p-6 text-red-500">{error}</div>;

  const { status, db, disk, backup, cache, compressionQueue, memory, usage } = data ?? {};

  return (
    <div className="flex-1 overflow-y-auto pr-1">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold brand-neon-text">Owner Insights</h1>
          <StatusDot status={status} />
          <Badge label={status} variant={STATUS_VARIANT[status] ?? 'default'} />
        </div>
        <Button variant="secondary" size="sm" onClick={fetchHealth} loading={loading}>Refresh</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Section title="Platform Usage" progress={usage?.storageUsagePercent ?? 0}>
          <Row label="Users" value={usage?.userCount} />
          <Row label="Active users" value={usage?.activeUsers} />
          <Row label="Storage used" value={formatBytes(usage?.totalStorageUsed)} />
          <Row label="Storage quota" value={formatBytes(usage?.totalStorageQuota)} />
          <Row label="Storage usage" value={`${usage?.storageUsagePercent ?? 0}%`} />
          <Row label="Files" value={usage?.totalFiles} />
          <Row label="Compressed files" value={`${usage?.compressedFiles ?? 0} (${usage?.compressionRatePercent ?? 0}%)`} />
        </Section>

        <Section title="Database" progress={db?.connection === 'ok' ? 100 : 20} trend={db?.connection === 'ok' ? 'up' : 'down'}>
          <Row label="Connection" value={<Badge label={db?.connection} variant={STATUS_VARIANT[db?.connection]} />} />
          <Row label="Size"       value={formatBytes(db?.sizeBytes)} />
        </Section>

        <Section title="Disk" progress={disk?.freePercent ?? 0}>
          <Row label="Free"      value={formatBytes(disk?.freeBytes)} />
          <Row label="Total"     value={formatBytes(disk?.totalBytes)} />
          <Row label="Available" value={`${disk?.freePercent ?? 0}%`} />
        </Section>

        <Section title="Memory" progress={memory?.heapTotalBytes ? Math.round(((memory?.heapUsedBytes || 0) / memory.heapTotalBytes) * 100) : 0} trend="steady">
          <Row label="RSS"        value={formatBytes(memory?.rssBytes)} />
          <Row label="Heap used"  value={formatBytes(memory?.heapUsedBytes)} />
          <Row label="Heap total" value={formatBytes(memory?.heapTotalBytes)} />
        </Section>

        <Section title="Backup" progress={backup?.status === 'ok' ? 100 : 25} trend={backup?.status === 'ok' ? 'up' : 'down'}>
          <Row label="Status"            value={<Badge label={backup?.status} variant={STATUS_VARIANT[backup?.status] ?? 'default'} />} />
          <Row label="Last DB backup"    value={backup?.lastDbBackup ? new Date(backup.lastDbBackup).toLocaleString() : 'Never'} />
          <Row label="Last file backup"  value={backup?.lastFilesBackup ? new Date(backup.lastFilesBackup).toLocaleString() : 'Never'} />
        </Section>

        <Section title="Cache" progress={Math.min(100, ((cache?.lruSizeBytes || 0) / (1024 * 1024 * 100)) * 100)} trend="steady">
          <Row label="Metadata keys" value={cache?.entries} />
          <Row label="Stream size"   value={formatBytes(cache?.lruSizeBytes)} />
        </Section>

        <Section title="Compression Queue" progress={Math.max(10, compressionQueue?.workerAlive ? 78 : 28)} trend={compressionQueue?.workerAlive ? 'up' : 'down'}>
          <Row label="Pending"    value={compressionQueue?.pending} />
          <Row label="Processing" value={compressionQueue?.processing} />
          <Row label="Failed"     value={compressionQueue?.errors} />
          <Row label="Worker"     value={compressionQueue?.workerAlive ? 'Alive' : 'Offline'} />
        </Section>
      </div>
    </div>
  );
}
