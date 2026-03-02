'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth.store';

const navItems = [
  { group: 'CRM', items: [
    { label: 'Pipeline', href: '/dashboard/crm/leads', icon: '📊' },
    { label: 'Contacts', href: '/dashboard/crm/contacts', icon: '👥' },
  ]},
  { group: 'Sales', items: [
    { label: 'Quotations', href: '/dashboard/sales/quotations', icon: '📋' },
    { label: 'Orders', href: '/dashboard/sales/orders', icon: '📦' },
  ]},
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-56 bg-slate-900 text-white flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-sm font-bold">
              S
            </div>
            <div>
              <p className="text-sm font-semibold">{user?.activeCompany?.name}</p>
              <p className="text-xs text-slate-400">{user?.activeCompany?.role}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-4">
          {navItems.map((group) => (
            <div key={group.group}>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-2">
                {group.group}
              </p>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    pathname === item.href
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-700">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium">{user?.fullName}</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
          <button
            onClick={() => { logout(); router.push('/login'); }}
            className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}