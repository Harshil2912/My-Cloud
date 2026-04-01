import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { formatDate } from '../utils/formatDate';
import { formatBytes } from '../utils/formatBytes';
import { Button } from '../components/ui/Button';

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 py-2 text-sm">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-900 dark:text-slate-100">{value ?? '—'}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { user, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl = null;

    async function loadAvatar() {
      setAvatarError('');
      try {
        const res = await authApi.getAvatar();
        objectUrl = URL.createObjectURL(res.data);
        if (active) setAvatarUrl(objectUrl);
      } catch {
        if (active) setAvatarUrl(null);
      }
    }

    loadAvatar();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [user?.id]);

  const usagePercent = useMemo(() => {
    const used = user?.storageUsed || 0;
    const quota = user?.storageQuota || 0;
    if (quota <= 0) return 0;
    return Math.min(100, Math.round((used / quota) * 100));
  }, [user?.storageUsed, user?.storageQuota]);

  const handleAvatarPick = () => fileInputRef.current?.click();

  const handleAvatarChange = async e => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarError('Please choose JPG, PNG, or WEBP image.');
      e.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Avatar must be 2 MB or less.');
      e.target.value = '';
      return;
    }

    setAvatarLoading(true);
    setAvatarError('');
    try {
      await authApi.uploadAvatar(file);
      const res = await authApi.getAvatar();
      const nextUrl = URL.createObjectURL(res.data);
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
      setAvatarUrl(nextUrl);
    } catch (err) {
      setAvatarError(err.response?.data?.error || 'Failed to update avatar.');
    } finally {
      setAvatarLoading(false);
      e.target.value = '';
    }
  };

  const handleDeleteAccount = async () => {
    const ok = window.confirm('Delete your account permanently? This cannot be undone.');
    if (!ok) return;

    setDeleting(true);
    try {
      await deleteAccount();
      navigate('/login', { replace: true });
    } catch {
      setDeleting(false);
      alert('Failed to delete account. Please try again.');
    }
  };

  const initials = (user?.username || user?.email || 'U').slice(0, 1).toUpperCase();

  return (
    <div className="flex-1 overflow-y-auto pr-1">
      <div className="glass-card mx-auto w-full max-w-2xl p-6">
        <h1 className="text-xl font-semibold brand-neon-text-soft">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your account profile and storage usage.</p>

        <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile avatar" className="h-20 w-20 rounded-full object-cover border border-[rgba(var(--brand-rgb),0.45)] p-0.5 transition-transform duration-300 hover:scale-105" style={{ boxShadow: '0 0 0 2px rgba(var(--brand-rgb),0.24), 0 0 14px rgba(var(--brand-rgb),0.25)' }} />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white transition-transform duration-300 hover:scale-105" style={{ background: 'linear-gradient(140deg, var(--brand-color), var(--secondary-color))', boxShadow: '0 0 0 2px rgba(var(--brand-rgb),0.24), 0 0 14px rgba(var(--brand-rgb),0.25)' }}>
              {initials}
            </div>
          )}

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <Button size="sm" variant="secondary" onClick={handleAvatarPick} loading={avatarLoading}>
              Edit profile photo
            </Button>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">JPG, PNG, or WEBP. Max 2 MB.</p>
            {avatarError && <p className="mt-1 text-xs text-red-500">{avatarError}</p>}
          </div>
        </div>

        <div className="mt-5 space-y-1">
          <InfoRow label="Username" value={user?.username || 'Not set'} />
          <InfoRow label="Email" value={user?.email} />

          <div className="border-b border-white/10 py-3">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Storage</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {formatBytes(user?.storageUsed || 0)} / {formatBytes(user?.storageQuota || 0)}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10">
              <div className="neon-progress h-2 rounded-full transition-all duration-300" style={{ width: `${usagePercent}%` }} />
            </div>
          </div>

          <InfoRow label="Created" value={formatDate(user?.createdAt)} />
        </div>

        <div className="mt-6 border-t border-white/10 pt-4">
          <Button variant="danger" size="sm" onClick={handleDeleteAccount} loading={deleting}>
            Delete account
          </Button>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">This permanently deletes your account and files.</p>
        </div>
      </div>
    </div>
  );
}
