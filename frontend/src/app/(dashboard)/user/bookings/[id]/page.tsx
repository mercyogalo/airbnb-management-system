'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
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
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [paying, setPaying] = useState(false);

  const loadBooking = useCallback(async () => {
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
  }, [params.id]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  const payMpesa = async () => {
    if (!booking) return;
    const digits = mpesaPhone.replace(/\D/g, '');
    if (digits.length < 9) {
      toast.error('Enter a valid M-Pesa number (e.g. 254712345678).');
      return;
    }
    let phone = digits;
    if (phone.startsWith('0')) phone = `254${phone.slice(1)}`;
    if (!phone.startsWith('254')) phone = `254${phone}`;

    setPaying(true);
    try {
      const res = await api.post<{ message: string }>('/payments/initiate', {
        bookingId: booking._id,
        phone,
      });
      toast.success(res.data.message ?? 'Check your phone for the M-Pesa prompt.');
      await loadBooking();
    } catch (err) {
      toast.error(getReadableError(err, 'Could not start payment.'));
    } finally {
      setPaying(false);
    }
  };

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
          <span className="font-semibold text-secondary">Check-in:</span> {formatDate(booking.checkIn)}
        </p>
        <p>
          <span className="font-semibold text-secondary">Check-out:</span> {formatDate(booking.checkOut)}
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
          <span className="font-semibold text-secondary">Special requests:</span> {booking.specialRequests}
        </p>
      ) : null}

      {booking.status === 'awaiting_payment' ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-dark/85">
          <p className="font-semibold text-secondary">Pay with M-Pesa to confirm</p>
          <p className="mt-1 text-xs text-dark/65">
            Enter the Safaricom number that will receive the STK push (format 254…). Approve the prompt on your phone to
            complete your deposit.
          </p>
          <label className="mt-3 block text-xs font-medium text-dark/75">M-Pesa phone</label>
          <input
            className="field mt-1 max-w-sm"
            placeholder="254712345678"
            value={mpesaPhone}
            onChange={(e) => setMpesaPhone(e.target.value)}
          />
          <button type="button" className="btn-primary mt-3" disabled={paying} onClick={payMpesa}>
            {paying ? 'Sending…' : 'Pay with M-Pesa'}
          </button>
        </div>
      ) : null}

      <Link href="/user/bookings" className="btn-ghost inline-flex">
        Back to my bookings
      </Link>
    </section>
  );
}
