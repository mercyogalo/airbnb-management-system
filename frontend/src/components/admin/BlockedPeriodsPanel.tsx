'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { formatDate, getReadableError } from '@/lib/utils';
import type { BlockedPeriod } from '@/types';

interface BlockedPeriodsPanelProps {
  propertyId: string;
  periods: BlockedPeriod[];
  onUpdated: () => void;
}

export function BlockedPeriodsPanel({ propertyId, periods, onUpdated }: BlockedPeriodsPanelProps) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState('');
  const [type, setType] = useState<'full_day' | 'time_range'>('full_day');
  const [saving, setSaving] = useState(false);

  const add = async () => {
    if (!start || !end || !reason.trim()) {
      toast.error('Start, end, and reason are required.');
      return;
    }
    if (new Date(start) >= new Date(end)) {
      toast.error('End must be after start.');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/properties/${propertyId}/block-periods`, {
        periods: [
          {
            start: new Date(start).toISOString(),
            end: new Date(end).toISOString(),
            reason: reason.trim(),
            type,
          },
        ],
      });
      toast.success('Blocked period added.');
      setStart('');
      setEnd('');
      setReason('');
      onUpdated();
    } catch (e) {
      toast.error(getReadableError(e, 'Could not add blocked period.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (periodId: string) => {
    try {
      await api.delete(`/properties/${propertyId}/block-periods`, {
        data: { periodIds: [periodId] },
      });
      toast.success('Blocked period removed.');
      onUpdated();
    } catch (e) {
      toast.error(getReadableError(e, 'Could not remove blocked period.'));
    }
  };

  return (
    <div className="rounded-2xl border border-secondary/10 bg-white p-6 shadow-soft">
      <h3 className="mb-1 text-base font-semibold text-dark/80">Availability — blocked times</h3>
      <p className="mb-4 text-xs text-dark/60">
        Use this for maintenance, personal use, or any window when the listing should not be booked. Overlaps with guest
        stays are still prevented by the booking engine.
      </p>

      {periods.length > 0 ? (
        <ul className="mb-6 space-y-2">
          {periods.map((p) => (
            <li
              key={p._id ?? `${p.start}-${p.end}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-secondary/10 bg-muted/40 px-3 py-2 text-sm"
            >
              <span className="text-dark/80">
                {formatDate(p.start)} → {formatDate(p.end)}
                <span className="ml-2 text-xs text-dark/55">({p.type})</span>
                <span className="mt-1 block text-xs font-medium text-secondary">{p.reason}</span>
              </span>
              {p._id ? (
                <button type="button" className="btn-ghost !px-2 !py-1 text-xs" onClick={() => remove(p._id!)}>
                  Remove
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-xs text-dark/50">No blocked periods yet.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-dark/75">Start</label>
          <input type="datetime-local" className="field" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-dark/75">End</label>
          <input type="datetime-local" className="field" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-dark/75">Reason</label>
          <input className="field" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Maintenance" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-dark/75">Type</label>
          <select className="field" value={type} onChange={(e) => setType(e.target.value as 'full_day' | 'time_range')}>
            <option value="full_day">Full day</option>
            <option value="time_range">Time range</option>
          </select>
        </div>
      </div>
      <button type="button" className="btn-primary mt-4 w-full sm:w-auto" onClick={add} disabled={saving}>
        {saving ? 'Saving...' : 'Add blocked period'}
      </button>
    </div>
  );
}
