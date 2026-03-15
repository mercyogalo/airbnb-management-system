'use client';

import { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, Home } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { cn, getReadableError } from '@/lib/utils';
import type { AuthResponse, UserRole } from '@/types';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

function getRedirectPath(role: UserRole) {
  if (role === 'owner') return '/owner/properties';
  if (role === 'admin') return '/admin/analytics';
  return '/user/bookings';
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { user, hydrated } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const nextPath = searchParams.get('next');
  const safeNextPath = nextPath && nextPath.startsWith('/') ? nextPath : null;

  useEffect(() => {
    if (!hydrated || !user) return;
    router.replace(safeNextPath ?? getRedirectPath(user.role));
  }, [hydrated, router, safeNextPath, user]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const roleCards = useMemo(
    () => [
      {
        role: 'user' as const,
        title: "I'm a Customer",
        description: 'Book stays and manage your reservations.',
        icon: BriefcaseBusiness,
      },
      {
        role: 'owner' as const,
        title: "I'm an Airbnb Owner",
        description: 'List properties and manage incoming bookings.',
        icon: Home,
      },
    ],
    [],
  );

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      const payload = { ...values, role: selectedRole };
      const response = await api.post<AuthResponse>('/auth/register', payload);
      setAuth(response.data.user, response.data.token);
      toast.success('Account created successfully.');
      router.push(safeNextPath ?? getRedirectPath(response.data.user.role));
    } catch (error) {
      toast.error(getReadableError(error, 'Unable to register right now.'));
    }
  };

  if (!hydrated || user) {
    return <LoadingSpinner className="min-h-screen" label="Checking your session..." />;
  }

  return (
    <AuthLayout
      title="Create Your StayEasy Account"
      subtitle="Choose whether you want to book as a customer or list as an Airbnb owner."
      switchLabel="Already have an account?"
      switchHref={safeNextPath ? `/login?next=${encodeURIComponent(safeNextPath)}` : '/login'}
      switchText="Log in"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-dark/85">
            Full Name
          </label>
          <input id="name" type="text" className="field" placeholder="Jane Doe" {...register('name')} />
          {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-dark/85">
            Email
          </label>
          <input id="email" type="email" className="field" placeholder="you@example.com" {...register('email')} />
          {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-dark/85">
            Password
          </label>
          <input id="password" type="password" className="field" placeholder="••••••••" {...register('password')} />
          {errors.password ? <p className="mt-1 text-xs text-red-600">{errors.password.message}</p> : null}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-dark/80">I want to use StayEasy as:</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {roleCards.map((card) => {
              const Icon = card.icon;
              const active = selectedRole === card.role;
              return (
                <button
                  type="button"
                  key={card.role}
                  onClick={() => setSelectedRole(card.role)}
                  className={cn(
                    'rounded-xl border p-4 text-left transition',
                    active ? 'border-secondary bg-muted' : 'border-secondary/15 hover:bg-muted/60',
                  )}
                >
                  <Icon className="mb-2 text-secondary" size={18} />
                  <p className="text-sm font-semibold text-secondary">{card.title}</p>
                  <p className="mt-1 text-xs text-dark/70">{card.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
    </AuthLayout>
  );
}
