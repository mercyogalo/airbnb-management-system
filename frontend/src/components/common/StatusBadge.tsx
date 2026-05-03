import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  awaiting_payment: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-slate-200 text-slate-700',
  expired: 'bg-slate-200 text-slate-700',
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-200 text-slate-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize',
        statusStyles[normalized] ?? 'bg-slate-100 text-slate-600',
      )}
    >
      {normalized}
    </span>
  );
}
