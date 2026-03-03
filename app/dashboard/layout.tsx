'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth.store';
import { authApi } from '@/lib/api';

const navItems = [
  { group: 'CRM', items: [
    { label: 'Pipeline', href: '/dashboard/crm/leads', icon: '📊' },
    { label: 'Contacts', href: '/dashboard/crm/contacts', icon: '👥' },
  ]},
  { group: 'Sales', items: [
    { label: 'Quotations', href: '/dashboard/sales/quotations', icon: '📋' },
    { label: 'Orders', href: '/dashboard/sales/orders', icon: '📦' },
    { label: 'Products', href: '/dashboard/products', icon: '📦' },
  ]},
  { group: 'Contracts', items: [
    { label: 'AMC Contracts', href: '/dashboard/amc', icon: '🔒' },
  ]},
  { group: 'Settings', items: [
  { label: 'Company Settings', href: '/dashboard/settings', icon: '⚙️' },
]},
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout, setAuth, _hasHydrated } = useAuthStore();
  const [showCompanyMenu, setShowCompanyMenu] = useState(false);
  const [switching, setSwitching] = useState(false);
  const companyMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (companyMenuRef.current && !companyMenuRef.current.contains(e.target as Node)) {
        setShowCompanyMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!_hasHydrated) return null;
  if (!isAuthenticated) return null;

  const handleSwitchCompany = async (slug: string) => {
    if (slug === user?.activeCompany?.slug) {
      setShowCompanyMenu(false);
      return;
    }
    setSwitching(true);
    try {
      const res = await authApi.switchCompany(slug);
      const data = (res as any)?.data;
      if (data?.accessToken) {
        setAuth(data.user, data.accessToken, data.refreshToken);
        setShowCompanyMenu(false);
        window.location.reload();
      }
    } catch (err) {
      console.error('Switch company failed:', err);
    } finally {
      setSwitching(false);
    }
  };

  const companies = user?.companies || [];
  const activeCompany = user?.activeCompany;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-56 bg-blue-950 flex flex-col">
        {/* Company Switcher */}
        <div className="px-4 py-4 border-b border-blue-900" ref={companyMenuRef}>
          <button
            onClick={() => setShowCompanyMenu(!showCompanyMenu)}
            className="w-full flex items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-700 flex items-center justify-center text-white text-xs font-bold">
                {activeCompany?.name?.[0] || 'S'}
              </div>
              <div className="text-left">
                <p className="text-white text-xs font-semibold truncate max-w-[110px]">{activeCompany?.name}</p>
                <p className="text-blue-400 text-xs">{activeCompany?.role}</p>
              </div>
            </div>
            <span className="text-blue-400 text-xs">⇅</span>
          </button>

          {showCompanyMenu && companies.length > 1 && (
            <div className="mt-2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
              {companies.map((company: any) => (
                <button
                  key={company.id}
                  onClick={() => handleSwitchCompany(company.slug)}
                  disabled={switching}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                    company.id === activeCompany?.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-blue-800 text-xs font-bold flex-shrink-0">
                    {company.name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-800">{company.name}</p>
                    <p className="text-xs text-gray-400">{company.role}</p>
                  </div>
                  {company.id === activeCompany?.id && (
                    <span className="ml-auto text-blue-600 text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {navItems.map((group) => (
            <div key={group.group} className="mb-4">
              <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider px-2 mb-1">
                {group.group}
              </p>
              {group.items.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-2 py-2 rounded-lg text-sm mb-0.5 transition-colors ${
                      isActive
                        ? 'bg-blue-800 text-white'
                        : 'text-blue-200 hover:bg-blue-900 hover:text-white'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-4 py-3 border-t border-blue-900">
          <p className="text-white text-xs font-medium truncate">{user?.fullName}</p>
          <p className="text-blue-400 text-xs truncate">{user?.email}</p>
          <button
            onClick={() => { logout(); router.push('/login'); }}
            className="mt-2 text-blue-400 hover:text-white text-xs transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {activeCompany?.name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {switching && (
              <span className="text-xs text-blue-600 animate-pulse">Switching company...</span>
            )}
            <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-white text-sm font-medium">
              {user?.fullName?.[0] || 'U'}
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}