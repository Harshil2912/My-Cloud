import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/authApi';
import { BrandLogo } from '../branding/BrandLogo';
import { ThemeToggle } from '../settings/ThemeToggle';
import { AccentColorSelector } from '../settings/AccentColorSelector';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    let active = true;
    let url = null;

    async function loadAvatar() {
      try {
        const res = await authApi.getAvatar();
        url = URL.createObjectURL(res.data);
        if (active) setAvatarUrl(url);
      } catch {
        if (active) setAvatarUrl(null);
      }
    }

    loadAvatar();

    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!menuOpen) return;
    const onClickAway = e => {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false);
    };
    const onEscape = e => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClickAway);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickAway);
      document.removeEventListener('keydown', onEscape);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate('/login');
  };

  const handleProfile = () => {
    setMenuOpen(false);
    navigate('/profile');
  };

  const avatarInitial = (user?.username || user?.email || 'U').slice(0, 1).toUpperCase();

  return (
    <header className="glass-navbar relative z-[90] mx-4 mt-3 flex items-center justify-between overflow-visible rounded-[14px] px-5 py-3">
      <Link to="/" className="flex items-center">
        <BrandLogo size="sm" />
      </Link>

      {user && (
        <div className="flex items-center gap-3">
          <ThemeToggle compact />

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(v => !v)}
              className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[rgba(var(--brand-rgb),0.35)] bg-[rgba(var(--brand-rgb),0.14)] text-xs font-semibold text-[var(--brand-color)] shadow-[0_0_0_1px_rgba(var(--brand-rgb),0.18)] transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(var(--brand-rgb),0.4),0_0_14px_rgba(var(--brand-rgb),0.28)]"
              aria-label="Open settings"
              title="Settings"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                avatarInitial
              )}
            </button>

            {menuOpen && (
            <div className="glass-card absolute right-0 top-[calc(100%+10px)] z-[130] w-72 p-2">
              <div className="px-3 py-2 border-b border-white/10">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.username || user.email}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
              </div>

              <div className="mt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleProfile}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-white/10 dark:text-slate-200"
                >
                  Profile
                </button>

                <AccentColorSelector />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-500 transition-colors hover:bg-red-500/10 dark:text-red-300"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      )}
    </header>
  );
}
