'use client';

import dynamic from 'next/dynamic';
import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { PropertyCard } from '@/components/common/PropertyCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useProperties } from '@/hooks/useProperties';
import { formatCurrency, getNightCount, getReadableError } from '@/lib/utils';
import type { Property } from '@/types';

const Modal = dynamic(() => import('@/components/common/Modal').then((mod) => mod.Modal), {
  ssr: false,
});

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

export default function UserBrowsePage() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [city, setCity] = useState('');
  const [guests, setGuests] = useState('');
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const availabilityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { properties, loading, error, refetch } = useProperties();

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
    if (!selectedProperty || !checkInValue || !checkOutValue) return 0;
    const nights = getNightCount(checkInValue, checkOutValue);
    return nights * selectedProperty.pricePerNight;
  }, [selectedProperty, checkInValue, checkOutValue]);

  // ── Real-time availability check ──────────────────────────────────
  // Debounced — fires 600ms after the user finishes picking dates
  const triggerAvailabilityCheck = (checkIn: string, checkOut: string) => {
    if (!selectedProperty || !checkIn || !checkOut) {
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
            propertyId: selectedProperty._id,
            checkIn: new Date(checkIn).toISOString(),
            checkOut: new Date(checkOut).toISOString(),
          },
        });
        setAvailability(response.data);
      } catch {
        // Silently fail — the backend will catch it on submit
      } finally {
        setCheckingAvailability(false);
      }
    }, 600);
  };

  const onSearch = () => {
    refetch({
      city: city || undefined,
      guests: guests ? Number(guests) : undefined,
    });
  };

  const openBookingModal = (property: Property) => {
    setSelectedProperty(property);
    setAvailability(null);
    reset({
      checkIn: '',
      checkOut: '',
      guests: 1,
      guestPhone: '',
      specialRequests: '',
    });
  };

  const onBook = async (values: BookingFormValues) => {
    if (!selectedProperty) return;

    // Block submit if we already know there's a conflict
    if (availability && !availability.available) {
      toast.error(availability.conflictMessage ?? 'These dates are not available.');
      return;
    }

    try {
      await api.post('/bookings', {
        propertyId: selectedProperty._id,
        checkIn: new Date(values.checkIn).toISOString(),
        checkOut: new Date(values.checkOut).toISOString(),
        guests: values.guests,
        guestPhone: values.guestPhone,
        specialRequests: values.specialRequests,
      });

      toast.success('Booking created successfully.');
      setSelectedProperty(null);
      setAvailability(null);
      reset();
    } catch (err) {
      toast.error(getReadableError(err, 'Unable to create booking.'));
    }
  };

  // Min datetime for inputs — now rounded to the next hour
  const minDateTime = useMemo(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return d.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
  }, []);

  return (
    <section className="space-y-6">

      {/* Search bar */}
      <div className="rounded-2xl border border-secondary/10 bg-white p-4 shadow-soft">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="field"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <input
            className="field"
            type="number"
            min={1}
            placeholder="Guests"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
          />
          <button type="button" onClick={onSearch} className="btn-primary w-full">
            Search
          </button>
        </div>
      </div>

      {loading ? <LoadingSpinner label="Finding stays for you..." /> : null}
      {error ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

      {!loading && !error && properties.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-secondary/20 bg-white p-10 text-center text-sm text-dark/50 shadow-soft">
          No properties found. Try a different city or guest count.
        </p>
      ) : null}

      {!loading && !error && properties.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard
              key={property._id}
              property={property}
              onBook={() => openBookingModal(property)}
            />
          ))}
        </div>
      ) : null}

      {/* Booking modal */}
      <Modal
        isOpen={Boolean(selectedProperty)}
        onClose={() => {
          setSelectedProperty(null);
          setAvailability(null);
          reset();
        }}
        title={selectedProperty?.name ?? 'Book Property'}
      >
        {selectedProperty ? (
          <div className="space-y-5">

            {/* Property summary */}
            <div className="rounded-xl bg-muted p-4 text-sm text-dark/80">
              <p>{selectedProperty.description}</p>
              <p className="mt-2 font-medium text-secondary">
                {selectedProperty.location.address}, {selectedProperty.location.city},{' '}
                {selectedProperty.location.country}
              </p>
              <p className="mt-1">{formatCurrency(selectedProperty.pricePerNight)} per night · Max {selectedProperty.maxGuests} guests</p>
            </div>

            <form onSubmit={handleSubmit(onBook)} className="space-y-4">

              {/* Check-in / Check-out — datetime-local so time is included */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-dark/85">
                    Check-In
                  </label>
                  <input
                    type="datetime-local"
                    min={minDateTime}
                    className="field"
                    {...register('checkIn', {
                      onChange: (e) => triggerAvailabilityCheck(e.target.value, checkOutValue),
                    })}
                  />
                  {errors.checkIn ? (
                    <p className="mt-1 text-xs text-red-600">{errors.checkIn.message}</p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-dark/85">
                    Check-Out
                  </label>
                  <input
                    type="datetime-local"
                    min={checkInValue || minDateTime}
                    className="field"
                    {...register('checkOut', {
                      onChange: (e) => triggerAvailabilityCheck(checkInValue, e.target.value),
                    })}
                  />
                  {errors.checkOut ? (
                    <p className="mt-1 text-xs text-red-600">{errors.checkOut.message}</p>
                  ) : null}
                </div>
              </div>

              {/* Real-time availability feedback */}
              {checkingAvailability ? (
                <p className="rounded-xl bg-muted px-4 py-2 text-xs text-dark/60">
                  Checking availability...
                </p>
              ) : null}

              {!checkingAvailability && availability ? (
                <p
                  className={`rounded-xl px-4 py-2 text-xs font-medium ${
                    availability.available
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {availability.available
                    ? '✓ These dates are available!'
                    : `✗ ${availability.conflictMessage}`}
                </p>
              ) : null}

              {/* Guests */}
              <div>
                <label className="mb-1 block text-sm font-medium text-dark/85">
                  Number of Guests
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedProperty.maxGuests}
                  className="field"
                  {...register('guests', { valueAsNumber: true })}
                />
                {errors.guests ? (
                  <p className="mt-1 text-xs text-red-600">{errors.guests.message}</p>
                ) : null}
              </div>

              {/* Phone number */}
              <div>
                <label className="mb-1 block text-sm font-medium text-dark/85">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="field"
                  placeholder="+254 700 000 000"
                  {...register('guestPhone')}
                />
                <p className="mt-1 text-xs text-dark/50">
                  So the property owner can reach you if needed.
                </p>
                {errors.guestPhone ? (
                  <p className="mt-1 text-xs text-red-600">{errors.guestPhone.message}</p>
                ) : null}
              </div>

              {/* Special requests */}
              <div>
                <label className="mb-1 block text-sm font-medium text-dark/85">
                  Special Requests <span className="text-dark/40">(optional)</span>
                </label>
                <textarea
                  className="field min-h-20"
                  placeholder="Anything the owner should know?"
                  {...register('specialRequests')}
                />
              </div>

              {/* Price estimate */}
              {totalPrice > 0 ? (
                <div className="rounded-xl bg-secondary/5 px-4 py-3 text-sm">
                  <p className="font-semibold text-secondary">
                    Estimated total: {formatCurrency(totalPrice)}
                  </p>
                  <p className="mt-0.5 text-xs text-dark/50">
                    Based on {getNightCount(checkInValue, checkOutValue)} night(s) at{' '}
                    {formatCurrency(selectedProperty.pricePerNight)}/night
                  </p>
                </div>
              ) : null}

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={
                  isSubmitting ||
                  checkingAvailability ||
                  (availability !== null && !availability.available)
                }
              >
                {isSubmitting ? 'Booking...' : 'Book Now'}
              </button>
            </form>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}