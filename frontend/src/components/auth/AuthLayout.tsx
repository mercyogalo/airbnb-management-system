import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/common/Logo';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  switchLabel: string;
  switchHref: string;
  switchText: string;
  children: React.ReactNode;
}

export function AuthLayout({
  title,
  subtitle,
  switchLabel,
  switchHref,
  switchText,
  children,
}: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen bg-primary md:grid-cols-2">
      <div className="relative hidden min-h-screen md:block">
        <Image
          src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1500&q=80"
          alt="Luxury stay interior"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/75 to-dark/75" />
        <div className="absolute inset-x-10 bottom-16">
          <p className="max-w-md text-3xl font-semibold leading-tight text-white">
            &ldquo;Turn every trip into a story with spaces that feel like home.&rdquo;
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-dark/70 hover:text-secondary">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <Logo size={58} className="rounded-full object-cover" priority />
          <div>
            <h1 className="text-3xl font-semibold">{title}</h1>
            <p className="mt-2 text-sm text-dark/70">{subtitle}</p>
          </div>

          {children}

          <p className="text-sm text-dark/75">
            {switchLabel}{' '}
            <Link href={switchHref} className="font-semibold text-secondary underline-offset-2 hover:underline">
              {switchText}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
