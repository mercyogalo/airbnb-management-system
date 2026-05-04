'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { StatusBadge } from '@/components/common/StatusBadge';
import api from '@/lib/axios';
import { formatCurrency, formatDate, getReadableError } from '@/lib/utils';
import type { Booking } from '@/types';

const POLL_INTERVAL_MS  = 1_000;   
const POLL_TIMEOUT_MS   = 60_000; // stop after 2 minutes

export default function BookingDetailsPage() {
  const params = useParams<{ id: string }>();

  const [booking,  setBooking]  = useState<Booking | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [paying,   setPaying]   = useState(false);
  const [polling,  setPolling]  = useState(false); // STK push sent — now waiting

  const pollInterval = useRef<NodeJS.Timeout | null>(null);
  const pollTimeout  = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollInterval.current) clearInterval(pollInterval.current);
    if (pollTimeout.current)  clearTimeout(pollTimeout.current);
    pollInterval.current = null;
    pollTimeout.current  = null;
    setPolling(false);
  }, []);

  const loadBooking = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Booking>(`/bookings/${params.id}`);
      setBooking(res.data);
    } catch (err) {
      setError(getReadableError(err, 'Could not load booking details.'));
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  // Poll backend for status change after STK push
  const startPolling = useCallback(() => {
    setPolling(true);

    const check = async () => {
      try {
        const res = await api.get<{ status: string }>(`/payments/status/${params.id}`);
        const { status } = res.data;

        if (status === 'confirmed') {
          stopPolling();
          toast.success('🎉 Payment confirmed! Your booking is secured.');
          // Reload full booking to refresh all fields
          await loadBooking();
        } else if (status === 'failed' || status === 'cancelled' || status === 'expired') {
          stopPolling();
          toast.error('Payment was not completed. Please try again.');
          await loadBooking();
        }
        // if still 'awaiting_payment' keep polling
      } catch {
        // silent — keep polling
      }
    };

    pollInterval.current = setInterval(check, POLL_INTERVAL_MS);

    // Safety net — stop after 2 minutes even if no response
    pollTimeout.current = setTimeout(() => {
      stopPolling();
      toast.error('Payment timed out. If you paid, please refresh the page.');
      loadBooking();
    }, POLL_TIMEOUT_MS);
  }, [params.id, loadBooking, stopPolling]);

  useEffect(() => {
    loadBooking();
    return () => stopPolling(); // cleanup on unmount
  }, [loadBooking, stopPolling]);

  const payMpesa = async () => {
    if (!booking) return;

    const digits = mpesaPhone.replace(/\D/g, '');
    if (digits.length < 9) {
      toast.error('Enter a valid M-Pesa number (e.g. 254712345678).');
      return;
    }

    let phone = digits;
    if (phone.startsWith('0'))   phone = `254${phone.slice(1)}`;
    if (!phone.startsWith('254')) phone = `254${phone}`;

    setPaying(true);
    try {
      const res = await api.post<{ message: string }>('/payments/initiate', {
        bookingId: booking._id,
        phone,
      });
      toast.success(res.data.message ?? 'Check your phone for the M-Pesa prompt.');
      startPolling(); // ← start watching for confirmation
    } catch (err) {
      toast.error(getReadableError(err, 'Could not start payment.'));
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading booking details..." />;
  if (error)   return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>;
  if (!booking) return <p className="rounded-xl bg-muted p-4 text-sm">Booking not found.</p>;

  return (
    <section className="space-y-4 rounded-2xl border border-secondary/10 bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">{booking.property?.name}</h2>
        <StatusBadge status={booking.status} />
      </div>

      <div className="grid gap-3 text-sm text-dark/80 sm:grid-cols-2">
        <p><span className="font-semibold text-secondary">Check-in:</span> {formatDate(booking.checkIn)}</p>
        <p><span className="font-semibold text-secondary">Check-out:</span> {formatDate(booking.checkOut)}</p>
        <p><span className="font-semibold text-secondary">Guests:</span> {booking.guests}</p>
        <p><span className="font-semibold text-secondary">Total:</span> {formatCurrency(booking.totalPrice)}</p>
      </div>

      {booking.specialRequests ? (
        <p className="rounded-xl bg-muted p-3 text-sm text-dark/80">
          <span className="font-semibold text-secondary">Special requests:</span> {booking.specialRequests}
        </p>
      ) : null}

      {/* ── Awaiting payment — show M-Pesa form or polling state ── */}
      {booking.status === 'awaiting_payment' ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-dark/85">
          {polling ? (
            // Waiting for M-Pesa callback
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-300 border-t-secondary" />
              <p className="font-semibold text-secondary">Waiting for M-Pesa confirmation…</p>
              <p className="text-xs text-dark/65">
                Check your phone and enter your PIN. <br />
                <strong>Do not close this page or pay again.</strong>
              </p>
            </div>
          ) : (
            // Show payment form
            <>
              <p className="font-semibold text-secondary">Pay with M-Pesa to confirm</p>
              <p className="mt-1 text-xs text-dark/65">
                Enter the Safaricom number that will receive the STK push (format 254…).
                Approve the prompt on your phone to complete your deposit.
              </p>
              <label className="mt-3 block text-xs font-medium text-dark/75">M-Pesa phone</label>
              <input
                className="field mt-1 max-w-sm"
                placeholder="254712345678"
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
              />
              <button
                type="button"
                className="btn-primary mt-3"
                disabled={paying}
                onClick={payMpesa}
              >
                {paying ? 'Sending…' : 'Pay with M-Pesa'}
              </button>
            </>
          )}
        </div>
      ) : null}

      {/* ── Confirmed state ── */}
      {booking.status === 'confirmed' ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          ✓ Payment confirmed. A receipt has been sent to your email.
        </div>
      ) : null}

      <Link href="/user/bookings" className="btn-ghost inline-flex">
        ← Back to my bookings
      </Link>
    </section>
  );
}