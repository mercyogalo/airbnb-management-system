'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { BookingsTable } from '@/components/dashboard/BookingsTable';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import api from '@/lib/axios';
import { getReadableError } from '@/lib/utils';
import type { Booking, Property } from '@/types';

export default function OwnerBookingsPage() {
  const searchParams = useSearchParams();
  const propertyFilter = searchParams.get('propertyId');

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const propertyResponse = await api.get<Property[]>('/properties/owner/my');
      setProperties(propertyResponse.data);

      const propertyIds = propertyFilter ? [propertyFilter] : propertyResponse.data.map((property) => property._id);
      const bookingResults = await Promise.all(
        propertyIds.map(async (id) => {
          const response = await api.get<Booking[]>(`/bookings/property/${id}`);
          return response.data;
        }),
      );

      setBookings(bookingResults.flat());
    } catch (err) {
      setError(getReadableError(err, 'Could not load received bookings.'));
    } finally {
      setLoading(false);
    }
  }, [propertyFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const bookingCountText = useMemo(() => {
    if (!propertyFilter) return `Across ${properties.length} properties`;
    return 'Filtered to one property';
  }, [propertyFilter, properties.length]);

  const updateStatus = async (bookingId: string, status: Booking['status']) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status });
      toast.success(`Booking ${status}.`);
      fetchData();
    } catch (err) {
      toast.error(getReadableError(err, 'Could not update booking status.'));
    }
  };

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-secondary/10 bg-white p-5 shadow-soft">
        <h2 className="text-2xl font-semibold">Bookings Received</h2>
        <p className="mt-1 text-sm text-dark/70">{bookingCountText}</p>
      </div>

      {loading ? <LoadingSpinner label="Loading bookings..." /> : null}
      {error ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

      {!loading && !error ? (
        <BookingsTable
          bookings={bookings}
          actionCell={(booking) => (
            <div className="flex gap-2">
              {booking.status === 'pending' ? (
                <button
                  type="button"
                  className="btn-primary !px-3 !py-1.5"
                  onClick={() => updateStatus(booking._id, 'confirmed')}
                >
                  Confirm
                </button>
              ) : null}

              {booking.status === 'confirmed' ? (
                <button
                  type="button"
                  className="btn-ghost !px-3 !py-1.5"
                  onClick={() => updateStatus(booking._id, 'completed')}
                >
                  Complete
                </button>
              ) : null}
            </div>
          )}
        />
      ) : null}
    </section>
  );
}
