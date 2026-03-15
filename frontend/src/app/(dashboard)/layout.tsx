'use client';

import { Menu } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '@/components/common/Sidebar';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';

const titleMap: Record<string, string> = {
  '/user/browse': 'Browse Properties',
  '/user/bookings': 'My Bookings',
  '/owner/properties': 'My Properties',
  '/owner/properties/new': 'Add Property',
  '/owner/bookings': 'Bookings Received',
  '/admin/analytics': 'Admin Analytics',
  '/admin/users': 'All Users',
  '/admin/properties': 'All Properties',
};

function getDashboardByRole(role: UserRole) {
  if (role === 'owner') return '/owner/properties';
  if (role === 'admin') return '/admin/analytics';
  return '/user/bookings';
}

function canAccessRouteByRole(role: UserRole, pathname: string) {
  if (pathname.startsWith('/admin')) {
    return role === 'admin';
  }

  if (pathname.startsWith('/owner')) {
    return role === 'owner' || role === 'admin';
  }

  if (pathname.startsWith('/user')) {
    return role === 'user' || role === 'owner' || role === 'admin';
  }

  return true;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hydrated, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const canAccessCurrentRoute = user ? canAccessRouteByRole(user.role, pathname) : false;

  useEffect(() => {
    if (!hydrated) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!canAccessRouteByRole(user.role, pathname)) {
      router.replace(getDashboardByRole(user.role));
    }
  }, [hydrated, pathname, router, user]);

  const pageTitle = useMemo(() => {
    const directMatch = titleMap[pathname];
    if (directMatch) return directMatch;
    if (pathname.includes('/bookings/') && pathname.startsWith('/user')) return 'Booking Details';
    if (pathname.includes('/edit')) return 'Edit Property';
    return 'Dashboard';
  }, [pathname]);

  if (!hydrated) {
    return <LoadingSpinner className="min-h-screen" label="Loading your dashboard..." />;
  }

  if (!user) {
    return <LoadingSpinner className="min-h-screen" label="Redirecting to login..." />;
  }

  if (!canAccessCurrentRoute) {
    return <LoadingSpinner className="min-h-screen" label="Verifying access permissions..." />;
  }

  return (
    <div className="min-h-screen bg-muted/50 lg:pl-64">
      <Sidebar role={user.role} isOpen={open} onClose={() => setOpen(false)} onLogout={logout} />

      <header className="sticky top-0 z-30 border-b border-secondary/10 bg-white/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-secondary lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-semibold sm:text-xl">{pageTitle}</h1>
          <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold uppercase text-white">
              {user.name.charAt(0)}
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-secondary">{user.name}</p>
              <p className="text-[11px] uppercase tracking-wide text-dark/55">{user.role}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
