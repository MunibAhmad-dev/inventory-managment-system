'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getCurrentUser, setCurrentUser } from '@/lib/storage';
import type { UserRole } from '@/lib/types';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['admin', 'partner', 'salesman'] },
  { href: '/customers', label: 'Customers', icon: '👥', roles: ['admin', 'partner', 'salesman'] },
  { href: '/products', label: 'Products', icon: '📦', roles: ['admin', 'partner'] },
  { href: '/purchases', label: 'Purchases', icon: '🛒', roles: ['admin', 'partner'] },
  { href: '/sales', label: 'Sales', icon: '💰', roles: ['admin', 'partner', 'salesman'] },
  { href: '/recovery', label: 'Recovery', icon: '🔄', roles: ['admin', 'partner', 'salesman'] },
  { href: '/orders', label: 'Next Week Orders', icon: '📋', roles: ['admin', 'partner', 'salesman'] },
  { href: '/stock', label: 'Stock', icon: '🏭', roles: ['admin', 'partner'] },
  { href: '/expenses', label: 'Expenses', icon: '💸', roles: ['admin', 'partner'] },
  { href: '/reports', label: 'Reports', icon: '📈', roles: ['admin', 'partner'] },
  { href: '/partnership', label: 'Partnership', icon: '🤝', roles: ['admin', 'partner'] },
  { href: '/users', label: 'User Management', icon: '⚙️', roles: ['admin'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getCurrentUser();

  const handleLogout = () => {
    setCurrentUser(null);
    router.push('/login');
  };

  const filtered = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-full fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg">SK</div>
          <div>
            <div className="font-bold text-sm">SK Traders DMS</div>
            <div className="text-xs text-slate-400">Distribution System</div>
          </div>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div className="px-4 py-3 bg-slate-800 border-b border-slate-700">
          <div className="text-xs text-slate-400">Logged in as</div>
          <div className="font-semibold text-sm">{user.name}</div>
          <div className="text-xs text-blue-400 capitalize">{user.role}</div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-2">
        {filtered.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
