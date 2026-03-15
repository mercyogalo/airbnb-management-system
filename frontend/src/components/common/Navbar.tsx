'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '#home', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#properties', label: 'Properties' },
  { href: '#testimonials', label: 'Testimonials' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-secondary/10 bg-white/95 shadow-sm backdrop-blur">
      <div className="container-shell flex h-20 items-center justify-between">
        <Link href="/" className="text-2xl font-bold tracking-tight text-secondary">
          StayEasy
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-dark/80 hover:text-secondary">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className="btn-ghost">
            Log In
          </Link>
          <Link href="/register" className="btn-primary">
            Get Started
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-xl p-2 text-secondary lg:hidden"
          aria-label="Toggle navigation"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div
        className={cn(
          'overflow-hidden border-t border-secondary/10 bg-white transition-[max-height] duration-300 lg:hidden',
          open ? 'max-h-96' : 'max-h-0',
        )}
      >
        <div className="container-shell space-y-2 py-4">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-dark hover:bg-muted"
            >
              {link.label}
            </a>
          ))}
          <div className="flex gap-2 pt-2">
            <Link href="/login" className="btn-ghost w-full text-center" onClick={() => setOpen(false)}>
              Log In
            </Link>
            <Link href="/register" className="btn-primary w-full text-center" onClick={() => setOpen(false)}>
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
