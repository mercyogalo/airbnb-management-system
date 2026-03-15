'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { StatCard } from '@/components/dashboard/StatCard';
import api from '@/lib/axios';
import { formatDate, getReadableError } from '@/lib/utils';
import type { Booking, Property, UserRole } from '@/types';

const AdminCharts = dynamic(
  () => import('@/components/dashboard/AdminCharts').then((mod) => mod.AdminCharts),
  {
    ssr: false,
    loading: () => <LoadingSpinner label="Loading analytics charts..." />,
  },
);

export default function AdminAnalyticsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
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

        setProperties(propertiesResponse.data);
        setBookings(bookingResponses.flatMap((response) => response.data));
      } catch (err) {
        setError(getReadableError(err, 'Could not load analytics data.'));
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const roleData = useMemo(() => {
    const roleCount: Record<UserRole, number> = {
      user: 0,
      owner: 0,
      admin: 1,
    };

    const seen = new Set<string>();

    for (const property of properties) {
      const ownerId = property.owner?._id;
      if (!ownerId || seen.has(ownerId)) continue;
      seen.add(ownerId);
      roleCount.owner += 1;
    }

    for (const booking of bookings) {
      const guestId = booking.guest?._id;
      if (!guestId || seen.has(guestId)) continue;
      seen.add(guestId);
      roleCount.user += 1;
    }

    return [
      { name: 'Users', value: roleCount.user },
      { name: 'Owners', value: roleCount.owner },
      { name: 'Admins', value: roleCount.admin },
    ];
  }, [bookings, properties]);

  const uniqueGuests = useMemo(() => {
    return new Set(bookings.map((booking) => booking.guest?._id).filter(Boolean)).size;
  }, [bookings]);

  const recentBookings = useMemo(() => {
    return [...bookings]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }, [bookings]);

  const propertyStatusData = useMemo(
    () => [
      { status: 'pending', count: properties.filter((property) => property.status === 'pending').length },
      { status: 'approved', count: properties.filter((property) => property.status === 'approved').length },
      { status: 'rejected', count: properties.filter((property) => property.status === 'rejected').length },
    ],
    [properties],
  );

  return (
    <section className="space-y-6">
      {loading ? <LoadingSpinner label="Loading analytics..." /> : null}
      {error ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

      {!loading && !error ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Active Guests" value={uniqueGuests} />
            <StatCard label="Bookings" value={bookings.length} />
            <StatCard label="Confirmed Bookings" value={bookings.filter((booking) => booking.status === 'confirmed').length} />
            <StatCard label="Total Properties" value={properties.length} />
          </div>

          <AdminCharts roleData={roleData} propertyStatusData={propertyStatusData} />

          <article className="rounded-2xl border border-secondary/10 bg-white p-5 shadow-soft">
            <h3 className="text-xl font-semibold">Recent Booking Activity</h3>
            <div className="mt-4 space-y-2">
              {recentBookings.map((booking) => (
                <div key={booking._id} className="flex items-center justify-between rounded-xl bg-muted px-3 py-2">
                  <span className="font-medium text-secondary">{booking.guest?.name ?? 'Guest'}</span>
                  <span className="text-xs text-dark/70">{formatDate(booking.createdAt)}</span>
                </div>
              ))}
            </div>
          </article>
        </>
      ) : null}
    </section>
  );
}
