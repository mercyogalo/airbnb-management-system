'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BookingsTable } from '@/components/dashboard/BookingsTable';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import api from '@/lib/axios';
import { getReadableError } from '@/lib/utils';
import type { Booking } from '@/types';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<Booking[]>('/bookings/all');
      setBookings(response.data);
    } catch (err) {
      setError(getReadableError(err, 'Could not load bookings.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const markCompleted = async (bookingId: string) => {
    try {
      await api.put(`/bookings/${bookingId}/complete`);
      toast.success('Booking marked as completed.');
      fetchBookings();
    } catch (err) {
      toast.error(getReadableError(err, 'Could not update booking.'));
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      toast.success('Booking cancelled.');
      fetchBookings();
    } catch (err) {
      toast.error(getReadableError(err, 'Could not cancel booking.'));
    }
  };

  return (
    <section className="space-y-4">
      {loading ? <LoadingSpinner label="Loading bookings..." /> : null}
      {error ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

      {!loading && !error ? (
        <BookingsTable
          bookings={bookings}
          showGuestDetails
          actionCell={(booking) => (
            <div className="flex flex-wrap gap-2">
              {booking.status === 'confirmed' ? (
                <button type="button" className="btn-primary !px-3 !py-1.5" onClick={() => markCompleted(booking._id)}>
                  Complete
                </button>
              ) : null}
              {booking.status === 'awaiting_payment' || booking.status === 'confirmed' ? (
                <button type="button" className="btn-ghost !px-3 !py-1.5" onClick={() => cancelBooking(booking._id)}>
                  Cancel
                </button>
              ) : null}
            </div>
          )}
        />
      ) : null}
    </section>
  );
}
