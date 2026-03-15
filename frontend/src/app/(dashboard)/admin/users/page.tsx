'use client';

import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import api from '@/lib/axios';
import { formatDate, getReadableError } from '@/lib/utils';
import type { Booking, Property, User, UserRole } from '@/types';

interface AggregatedUser extends User {
  source: 'guest' | 'owner';
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AggregatedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const propertiesResponse = await api.get<Property[]>('/properties');
        const bookingResponses = await Promise.all(
          propertiesResponse.data.map((property) => api.get<Booking[]>(`/bookings/property/${property._id}`)),
        );

        const nextUsers = new Map<string, AggregatedUser>();

        for (const property of propertiesResponse.data) {
          const ownerId = property.owner?._id;
          if (!ownerId) continue;

          nextUsers.set(ownerId, {
            id: ownerId,
            _id: ownerId,
            name: property.owner.name,
            email: property.owner.email,
            role: 'owner',
            source: 'owner',
          });
        }

        for (const response of bookingResponses) {
          for (const booking of response.data) {
            const guestId = booking.guest?._id;
            if (!guestId) continue;

            const existing = nextUsers.get(guestId);
            const role: UserRole = existing?.role ?? 'user';

            nextUsers.set(guestId, {
              id: guestId,
              _id: guestId,
              name: booking.guest.name,
              email: booking.guest.email,
              role,
              source: existing?.source ?? 'guest',
            });
          }
        }

        setUsers(Array.from(nextUsers.values()));
      } catch (err) {
        setError(getReadableError(err, 'Could not load users.'));
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  return (
    <section className="space-y-4">
      <p className="rounded-xl bg-muted p-3 text-sm text-dark/75">
        This list is generated from property ownership and booking activity available in the current backend API.
      </p>

      {loading ? <LoadingSpinner label="Loading users..." /> : null}
      {error ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

      {!loading && !error ? (
        <div className="overflow-hidden rounded-2xl border border-secondary/10 bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted text-left text-secondary">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Last Seen</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-secondary/10 text-dark/80">
                    <td className="px-4 py-3">{user.name}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold text-secondary">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">{user.updatedAt ? formatDate(user.updatedAt) : '-'}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 capitalize">
                        {user.source}
                      </span>
                    </td>
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
