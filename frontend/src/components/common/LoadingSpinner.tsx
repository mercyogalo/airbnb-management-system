import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  label?: string;
}

export function LoadingSpinner({ className, label = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center gap-3 py-8 text-secondary', className)}>
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-secondary/30 border-t-secondary" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
