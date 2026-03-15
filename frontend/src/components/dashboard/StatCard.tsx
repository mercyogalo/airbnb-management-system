interface StatCardProps {
  label: string;
  value: string | number;
  helper?: string;
}

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-secondary/10 bg-white p-5 shadow-soft">
      <p className="text-sm text-dark/70">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-secondary">{value}</p>
      {helper ? <p className="mt-1 text-xs text-dark/60">{helper}</p> : null}
    </article>
  );
}
