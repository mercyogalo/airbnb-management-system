'use client';

import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { formatCurrency, getNightCount, getReadableError } from '@/lib/utils';
import type { Property } from '@/types';

const bookingSchema = z.object({
  checkIn: z.string().min(1, 'Select a check-in date and time.'),
  checkOut: z.string().min(1, 'Select a check-out date and time.'),
  guests: z.number().min(1, 'Guests must be at least 1.'),
  guestPhone: z
    .string()
    .min(7, 'Phone number is too short.')
    .regex(/^\+?[0-9\s\-().]{7,20}$/, 'Please enter a valid phone number.'),
  specialRequests: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface AvailabilityResult {
  available: boolean;
  conflictMessage?: string;
}

interface PropertyBookingFormProps {
  property: Property;
  onSuccess?: () => void;
}

export function PropertyBookingForm({ property, onSuccess }: PropertyBookingFormProps) {
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const availabilityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      checkIn: '',
      checkOut: '',
      guests: 1,
      guestPhone: '',
      specialRequests: '',
    },
  });

  const checkInValue = watch('checkIn');
  const checkOutValue = watch('checkOut');

  const totalPrice = useMemo(() => {
    if (!checkInValue || !checkOutValue) return 0;
    const nights = getNightCount(checkInValue, checkOutValue);
    return nights * property.pricePerNight;
  }, [property.pricePerNight, checkInValue, checkOutValue]);

  const triggerAvailabilityCheck = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) {
      setAvailability(null);
      return;
    }

    if (availabilityTimer.current) clearTimeout(availabilityTimer.current);

    availabilityTimer.current = setTimeout(async () => {
      setCheckingAvailability(true);
      setAvailability(null);

      try {
        const response = await api.get<AvailabilityResult>('/bookings/availability', {
          params: {
            propertyId: property._id,
            checkIn: new Date(checkIn).toISOString(),
            checkOut: new Date(checkOut).toISOString(),
          },
        });
        setAvailability(response.data);
      } catch {
        setAvailability(null);
      } finally {
        setCheckingAvailability(false);
      }
    }, 600);
  };

  const minDateTime = useMemo(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return d.toISOString().slice(0, 16);
  }, []);

  const onBook = async (values: BookingFormValues) => {
    if (availability && !availability.available) {
      toast.error(availability.conflictMessage ?? 'These dates are not available.');
      return;
    }

    try {
      await api.post('/bookings', {
        propertyId: property._id,
        checkIn: new Date(values.checkIn).toISOString(),
        checkOut: new Date(values.checkOut).toISOString(),
        guests: values.guests,
        guestPhone: values.guestPhone,
        specialRequests: values.specialRequests,
      });

      toast.success('Booking created. Complete payment from My Bookings.');
      reset({
        checkIn: '',
        checkOut: '',
        guests: 1,
        guestPhone: '',
        specialRequests: '',
      });
      setAvailability(null);
      onSuccess?.();
    } catch (err) {
      toast.error(getReadableError(err, 'Unable to create booking.'));
    }
  };

  const bookable = property.status === 'active';

  if (!bookable) {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
        This listing is not accepting bookings right now.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onBook)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-dark/85">Check-In</label>
          <input
            type="datetime-local"
            min={minDateTime}
            className="field"
            {...register('checkIn', {
              onChange: (e) => triggerAvailabilityCheck(e.target.value, checkOutValue),
            })}
          />
          {errors.checkIn ? <p className="mt-1 text-xs text-red-600">{errors.checkIn.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-dark/85">Check-Out</label>
          <input
            type="datetime-local"
            min={checkInValue || minDateTime}
            className="field"
            {...register('checkOut', {
              onChange: (e) => triggerAvailabilityCheck(checkInValue, e.target.value),
            })}
          />
          {errors.checkOut ? <p className="mt-1 text-xs text-red-600">{errors.checkOut.message}</p> : null}
        </div>
      </div>

      {checkingAvailability ? (
        <p className="rounded-xl bg-muted px-4 py-2 text-xs text-dark/60">Checking availability...</p>
      ) : null}

      {!checkingAvailability && availability ? (
        <p
          className={`rounded-xl px-4 py-2 text-xs font-medium ${
            availability.available ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {availability.available ? '✓ These dates are available!' : `✗ ${availability.conflictMessage}`}
        </p>
      ) : null}

      <div>
        <label className="mb-1 block text-sm font-medium text-dark/85">Number of Guests</label>
        <input
          type="number"
          min={1}
          max={property.maxGuests}
          className="field"
          {...register('guests', { valueAsNumber: true })}
        />
        {errors.guests ? <p className="mt-1 text-xs text-red-600">{errors.guests.message}</p> : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-dark/85">Phone Number</label>
        <input type="tel" className="field" placeholder="+254 700 000 000" {...register('guestPhone')} />
        <p className="mt-1 text-xs text-dark/50">So the host can reach you if needed.</p>
        {errors.guestPhone ? <p className="mt-1 text-xs text-red-600">{errors.guestPhone.message}</p> : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-dark/85">
          Special Requests <span className="text-dark/40">(optional)</span>
        </label>
        <textarea className="field min-h-20" placeholder="Anything the host should know?" {...register('specialRequests')} />
      </div>

      {totalPrice > 0 ? (
        <div className="rounded-xl bg-secondary/5 px-4 py-3 text-sm">
          <p className="font-semibold text-secondary">Estimated total: {formatCurrency(totalPrice)}</p>
          <p className="mt-0.5 text-xs text-dark/50">
            Based on {getNightCount(checkInValue, checkOutValue)} night(s) at {formatCurrency(property.pricePerNight)}/night
          </p>
        </div>
      ) : null}

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={isSubmitting || checkingAvailability || (availability !== null && !availability.available)}
      >
        {isSubmitting ? 'Booking...' : 'Book now'}
      </button>
    </form>
  );
}
