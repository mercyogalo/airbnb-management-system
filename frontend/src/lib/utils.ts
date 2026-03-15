import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return `KSh ${new Intl.NumberFormat('en-KE', {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function getNightCount(checkIn: string | Date, checkOut: string | Date) {
  const oneDay = 1000 * 60 * 60 * 24;
  const start = new Date(checkIn).getTime();
  const end = new Date(checkOut).getTime();
  const diff = Math.ceil((end - start) / oneDay);
  return Number.isFinite(diff) && diff > 0 ? diff : 0;
}

export function getReadableError(error: unknown, fallback = 'Something went wrong.') {
  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }

  return fallback;
}
