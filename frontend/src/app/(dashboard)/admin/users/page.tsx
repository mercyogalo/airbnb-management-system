'use client';

import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import api from '@/lib/axios';
import { formatDate, getReadableError } from '@/lib/utils';
import type { Booking } from '@/types';

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  lastBookingAt?: string;
}

export default function AdminUsersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const bookingsResponse = await api.get<Booking[]>('/bookings/all');
        const byGuest = new Map<string, CustomerRow>();

        for (const booking of bookingsResponse.data) {
          const guestId = booking.guest?._id;
          if (!guestId) continue;
          const created = booking.createdAt;
          const existing = byGuest.get(guestId);
          if (!existing) {
            byGuest.set(guestId, {
              id: guestId,
              name: booking.guest.name,
              email: booking.guest.email,
              lastBookingAt: created,
            });
          } else if (new Date(created) > new Date(existing.lastBookingAt ?? 0)) {
            byGuest.set(guestId, { ...existing, lastBookingAt: created });
          }
        }

        setCustomers(Array.from(byGuest.values()).sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) {
        setError(getReadableError(err, 'Could not load customers.'));
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  return (
    <section className="space-y-4">
      <p className="rounded-xl bg-muted p-3 text-sm text-dark/75">
        Customers who have booked at least once. The host account is separate (admin login — not listed here).
      </p>

      {loading ? <LoadingSpinner label="Loading customers..." /> : null}
      {error ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

      {!loading && !error ? (
        <div className="overflow-hidden rounded-2xl border border-secondary/10 bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted text-left text-secondary">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Latest activity</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-t border-secondary/10 text-dark/80">
                    <td className="px-4 py-3">{c.name}</td>
                    <td className="px-4 py-3">{c.email}</td>
                    <td className="px-4 py-3">{c.lastBookingAt ? formatDate(c.lastBookingAt) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
