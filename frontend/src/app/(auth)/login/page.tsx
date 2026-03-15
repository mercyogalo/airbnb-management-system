'use client';

import { useEffect } from 'react';
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
import { getReadableError } from '@/lib/utils';
import type { AuthResponse } from '@/types';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function getRedirectPath(role: AuthResponse['user']['role']) {
  if (role === 'owner') return '/owner/properties';
  if (role === 'admin') return '/admin/analytics';
  return '/user/bookings';
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { user, hydrated } = useAuth();
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
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', values);
      setAuth(response.data.user, response.data.token);
      toast.success('Welcome back!');
      router.push(safeNextPath ?? getRedirectPath(response.data.user.role));
    } catch (error) {
      toast.error(getReadableError(error, 'Unable to log you in.'));
    }
  };

  if (!hydrated || user) {
    return <LoadingSpinner className="min-h-screen" label="Checking your session..." />;
  }

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue your bookings and hosting dashboard."
      switchLabel="Don't have an account?"
      switchHref={safeNextPath ? `/register?next=${encodeURIComponent(safeNextPath)}` : '/register'}
      switchText="Create one"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </AuthLayout>
  );
}
