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
import type { AuthResponse, UserRole } from '@/types';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

function getRedirectPath(role: UserRole) {
  if (role === 'admin') return '/admin/properties';
  return '/user/browse';
}

export default function RegisterPage() {
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
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      const response = await api.post<AuthResponse>('/auth/register', values);
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
      title="Create your StayEasy account"
      subtitle="Sign up as a guest to browse listings, check availability, and pay with M-Pesa to confirm your booking."
      switchLabel="Already have an account?"
      switchHref={safeNextPath ? `/login?next=${encodeURIComponent(safeNextPath)}` : '/login'}
      switchText="Log in"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-dark/85">
            Full name
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

        <p className="rounded-xl bg-muted px-3 py-2 text-xs text-dark/65">
          Host access is not self-serve — your StayEasy administrator account is created separately.
        </p>

        <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Create guest account'}
        </button>
      </form>
    </AuthLayout>
  );
}
