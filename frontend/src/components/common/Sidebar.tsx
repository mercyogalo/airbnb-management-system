'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Building2,
  Calendar,
  House,
  Plus,
  User,
  Users,
  LogOut,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';
import { Logo } from '@/components/common/Logo';

interface SidebarProps {
  role: UserRole;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const customerNav = [
  { href: '/user/browse', label: 'Browse stays', icon: House },
  { href: '/user/bookings', label: 'My bookings', icon: Calendar },
  { href: '/user/profile', label: 'Profile', icon: User },
];

const adminNav = [
  { href: '/admin/properties', label: 'Listings', icon: Building2 },
  { href: '/admin/properties/new', label: 'Add listing', icon: Plus },
  { href: '/admin/bookings', label: 'Bookings', icon: Calendar },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/users', label: 'Customers', icon: Users },
  { href: '/admin/profile', label: 'Profile', icon: User },
];

export function Sidebar({ role, isOpen, onClose, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const navItems = role === 'admin' ? adminNav : customerNav;

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-dark/50 transition-opacity lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-secondary/15 bg-white p-5 shadow-soft transition-transform lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="mb-8 flex items-center justify-between">
          <Logo size={50} className="h-[50px] w-[50px] rounded-full object-cover" />
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-secondary lg:hidden">
            <X size={18} />
          </button>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            let active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            if (role === 'admin') {
              if (item.href === '/admin/properties') {
                active = pathname === '/admin/properties' || /^\/admin\/properties\/[^/]+\/edit/.test(pathname);
              } else if (item.href === '/admin/properties/new') {
                active = pathname === '/admin/properties/new';
              }
            }
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  active
                    ? 'bg-secondary text-white'
                    : 'text-slate-600 hover:bg-muted hover:text-secondary',
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={onLogout}
          className="mt-auto inline-flex items-center gap-2 rounded-xl border border-secondary/30 px-3 py-2.5 text-sm font-medium text-secondary transition hover:bg-muted"
        >
          <LogOut size={16} />
          Logout
        </button>
      </aside>
    </>
  );
}
