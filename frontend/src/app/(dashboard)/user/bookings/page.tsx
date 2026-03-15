'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BookingsTable } from '@/components/dashboard/BookingsTable';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import api from '@/lib/axios';
import { formatDate, getReadableError } from '@/lib/utils';
import type { Booking } from '@/types';

const Modal = dynamic(() => import('@/components/common/Modal').then((mod) => mod.Modal), {
  ssr: false,
});

export default function UserBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<Booking[]>('/bookings/my');
      setBookings(response.data);
    } catch (err) {
      setError(getReadableError(err, 'Could not load your bookings.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const updateStatus = async (id: string, status: Booking['status']) => {
    try {
      await api.put(`/bookings/${id}/status`, { status });
      toast.success(`Booking marked as ${status}.`);
      fetchBookings();
    } catch (err) {
      toast.error(getReadableError(err, 'Could not update booking status.'));
    }
  };

  const deleteBooking = async (id: string) => {
    try {
      await api.delete(`/bookings/${id}`);
      toast.success('Booking deleted.');
      fetchBookings();
    } catch (err) {
      toast.error(getReadableError(err, 'Could not delete booking.'));
    }
  };

  return (
    <section className="space-y-4">
      {loading ? <LoadingSpinner label="Loading bookings..." /> : null}
      {error ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

      {!loading && !error ? (
        <BookingsTable
          bookings={bookings}
          actionCell={(booking) => (
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-ghost !px-3 !py-1.5" onClick={() => setSelected(booking)}>
                View
              </button>

              {booking.status === 'pending' ? (
                <button
                  type="button"
                  className="btn-ghost !px-3 !py-1.5"
                  onClick={() => updateStatus(booking._id, 'cancelled')}
                >
                  Cancel
                </button>
              ) : null}

              {(booking.status === 'pending' || booking.status === 'cancelled') ? (
                <button
                  type="button"
                  className="btn-ghost !px-3 !py-1.5"
                  onClick={() => deleteBooking(booking._id)}
                >
                  Delete
                </button>
              ) : null}

              <Link href={`/user/bookings/${booking._id}`} className="btn-primary !px-3 !py-1.5">
                Open
              </Link>
            </div>
          )}
        />
      ) : null}

      <Modal isOpen={Boolean(selected)} onClose={() => setSelected(null)} title="Booking Details">
        {selected ? (
          <div className="space-y-2 text-sm text-dark/80">
            <p>
              <span className="font-semibold text-secondary">Property:</span> {selected.property?.name}
            </p>
            <p>
              <span className="font-semibold text-secondary">Check-In:</span> {formatDate(selected.checkIn)}
            </p>
            <p>
              <span className="font-semibold text-secondary">Check-Out:</span> {formatDate(selected.checkOut)}
            </p>
            <p>
              <span className="font-semibold text-secondary">Guests:</span> {selected.guests}
            </p>
            <p>
              <span className="font-semibold text-secondary">Status:</span> {selected.status}
            </p>
            {selected.specialRequests ? (
              <p>
                <span className="font-semibold text-secondary">Special Requests:</span> {selected.specialRequests}
              </p>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
