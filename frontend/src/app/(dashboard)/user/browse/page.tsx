'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
  checkIn: z.string().min(1, 'Select check-in date.'),
  checkOut: z.string().min(1, 'Select check-out date.'),
  guests: z.number().min(1, 'Guests must be at least 1.'),
  specialRequests: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingResponse {
  totalPrice: number;
}

export default function UserBrowsePage() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [city, setCity] = useState('');
  const [guests, setGuests] = useState('');
  const [checkInSearch, setCheckInSearch] = useState('');
  const [checkOutSearch, setCheckOutSearch] = useState('');
  const { properties, loading, error, refetch } = useProperties();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      checkIn: '',
      checkOut: '',
      guests: 1,
      specialRequests: '',
    },
  });

  const checkInValue = useWatch({ control, name: 'checkIn' });
  const checkOutValue = useWatch({ control, name: 'checkOut' });

  const totalPrice = useMemo(() => {
    if (!selectedProperty || !checkInValue || !checkOutValue) return 0;
    const nights = getNightCount(checkInValue, checkOutValue);
    return nights * selectedProperty.pricePerNight;
  }, [checkInValue, checkOutValue, selectedProperty]);

  const onSearch = () => {
    refetch({
      city: city || undefined,
      guests: guests ? Number(guests) : undefined,
    });

    if (checkInSearch && checkOutSearch) {
      toast('Tip: choose dates again when booking to confirm availability.', { icon: '🗓️' });
    }
  };

  const onBook = async (values: BookingFormValues) => {
    if (!selectedProperty) return;

    try {
      const response = await api.post<BookingResponse>('/bookings', {
        propertyId: selectedProperty._id,
        checkIn: values.checkIn,
        checkOut: values.checkOut,
        guests: values.guests,
        specialRequests: values.specialRequests,
      });

      toast.success(`Booking created successfully. Total: ${formatCurrency(response.data.totalPrice)}`);
      setSelectedProperty(null);
      reset();
    } catch (err) {
      toast.error(getReadableError(err, 'Unable to create booking.'));
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-secondary/10 bg-white p-4 shadow-soft">
        <div className="grid gap-3 md:grid-cols-5">
          <input
            className="field"
            placeholder="City"
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />
          <input
            className="field"
            type="date"
            value={checkInSearch}
            onChange={(event) => setCheckInSearch(event.target.value)}
          />
          <input
            className="field"
            type="date"
            value={checkOutSearch}
            onChange={(event) => setCheckOutSearch(event.target.value)}
          />
          <input
            className="field"
            type="number"
            min={1}
            placeholder="Guests"
            value={guests}
            onChange={(event) => setGuests(event.target.value)}
          />
          <button type="button" onClick={onSearch} className="btn-primary w-full">
            Search
          </button>
        </div>
      </div>

      {loading ? <LoadingSpinner label="Finding stays for you..." /> : null}
      {error ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

      {!loading && !error ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard key={property._id} property={property} onBook={() => setSelectedProperty(property)} />
          ))}
        </div>
      ) : null}

      <Modal
        isOpen={Boolean(selectedProperty)}
        onClose={() => {
          setSelectedProperty(null);
          reset();
        }}
        title={selectedProperty?.name ?? 'Property Details'}
      >
        {selectedProperty ? (
          <div className="space-y-6">
            <div className="rounded-xl bg-muted p-4 text-sm text-dark/80">
              <p>{selectedProperty.description}</p>
              <p className="mt-2 font-medium text-secondary">
                {selectedProperty.location.address}, {selectedProperty.location.city}, {selectedProperty.location.country}
              </p>
              <p className="mt-1">{formatCurrency(selectedProperty.pricePerNight)} per night</p>
            </div>

            <form onSubmit={handleSubmit(onBook)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="checkIn" className="mb-1 block text-sm font-medium text-dark/85">
                    Check-In
                  </label>
                  <input id="checkIn" type="date" className="field" {...register('checkIn')} />
                  {errors.checkIn ? <p className="mt-1 text-xs text-red-600">{errors.checkIn.message}</p> : null}
                </div>

                <div>
                  <label htmlFor="checkOut" className="mb-1 block text-sm font-medium text-dark/85">
                    Check-Out
                  </label>
                  <input id="checkOut" type="date" className="field" {...register('checkOut')} />
                  {errors.checkOut ? <p className="mt-1 text-xs text-red-600">{errors.checkOut.message}</p> : null}
                </div>
              </div>

              <div>
                <label htmlFor="guests" className="mb-1 block text-sm font-medium text-dark/85">
                  Number of Guests
                </label>
                <input
                  id="guests"
                  type="number"
                  min={1}
                  className="field"
                  {...register('guests', { valueAsNumber: true })}
                />
                {errors.guests ? <p className="mt-1 text-xs text-red-600">{errors.guests.message}</p> : null}
              </div>

              <div>
                <label htmlFor="specialRequests" className="mb-1 block text-sm font-medium text-dark/85">
                  Special Requests
                </label>
                <textarea id="specialRequests" className="field min-h-24" {...register('specialRequests')} />
              </div>

              <p className="text-sm font-semibold text-secondary">Estimated total: {formatCurrency(totalPrice)}</p>

              <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Booking...' : 'Book Now'}
              </button>
            </form>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
