import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isOwnerUser } from '../../utils/isOwnerUser';

function FilesIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v9A2.5 2.5 0 0 1 18.5 21h-13A2.5 2.5 0 0 1 3 18.5z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M4 17v1.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V17" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.7 13.5 6.6 3.9" />
      <path d="m15.3 6.6-6.6 3.8" />
    </svg>
  );
}

function InsightsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19V5" />
      <path d="M10 19v-8" />
      <path d="M16 19V9" />
      <path d="M22 19V3" />
    </svg>
  );
}

const NAV_ITEMS = [
  { to: '/dashboard', label: 'My Files',      exact: false, icon: FilesIcon },
  { to: '/upload',    label: 'Upload',        exact: false, icon: UploadIcon },
  { to: '/shared',    label: 'Shared with me', exact: false, icon: ShareIcon },
];

const OWNER_ITEMS = [
  { to: '/health',    label: 'System Insights', exact: false, icon: InsightsIcon },
];

export function Sidebar() {
  const { user } = useAuth();

  const linkClass = ({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`;

  const items = isOwnerUser(user) ? [...NAV_ITEMS, ...OWNER_ITEMS] : NAV_ITEMS;

  return (
    <aside className="glass-sidebar w-60 shrink-0 p-3">
      <nav className="flex flex-col gap-1">
        {items.map(item => (
          <NavLink key={item.to} to={item.to} end={item.exact} className={linkClass}>
            <span className="flex items-center gap-2.5 text-[15px] font-medium">
              <item.icon />
              <span className="brand-neon-text-soft">{item.label}</span>
            </span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
