'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { StatusBadge } from '@/components/common/StatusBadge';
import api from '@/lib/axios';
import { formatCurrency, formatDate, getReadableError } from '@/lib/utils';
import type { Booking } from '@/types';

export default function BookingDetailsPage() {
  const params = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<Booking>(`/bookings/${params.id}`);
        setBooking(response.data);
      } catch (err) {
        setError(getReadableError(err, 'Could not load booking details.'));
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [params.id]);

  if (loading) return <LoadingSpinner label="Loading booking details..." />;
  if (error) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>;
  if (!booking) return <p className="rounded-xl bg-muted p-4 text-sm">Booking not found.</p>;

  return (
    <section className="space-y-4 rounded-2xl border border-secondary/10 bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">{booking.property?.name}</h2>
        <StatusBadge status={booking.status} />
      </div>

      <div className="grid gap-3 text-sm text-dark/80 sm:grid-cols-2">
        <p>
          <span className="font-semibold text-secondary">Check-In:</span> {formatDate(booking.checkIn)}
        </p>
        <p>
          <span className="font-semibold text-secondary">Check-Out:</span> {formatDate(booking.checkOut)}
        </p>
        <p>
          <span className="font-semibold text-secondary">Guests:</span> {booking.guests}
        </p>
        <p>
          <span className="font-semibold text-secondary">Total:</span> {formatCurrency(booking.totalPrice)}
        </p>
      </div>

      {booking.specialRequests ? (
        <p className="rounded-xl bg-muted p-3 text-sm text-dark/80">
          <span className="font-semibold text-secondary">Special Requests:</span> {booking.specialRequests}
        </p>
      ) : null}

      <Link href="/user/bookings" className="btn-ghost inline-flex">
        Back to My Bookings
      </Link>
    </section>
  );
}
