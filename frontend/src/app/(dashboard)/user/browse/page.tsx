'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { PropertyBookingForm } from '@/components/booking/PropertyBookingForm';
import { PropertyCard } from '@/components/common/PropertyCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useProperties } from '@/hooks/useProperties';
import { getReadableError } from '@/lib/utils';
import type { Property } from '@/types';

const Modal = dynamic(() => import('@/components/common/Modal').then((mod) => mod.Modal), {
  ssr: false,
});

export default function UserBrowsePage() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [city, setCity] = useState('');
  const [guests, setGuests] = useState('');

  const { properties, loading, error, refetch } = useProperties();

  const onSearch = () => {
    refetch({
      city: city || undefined,
      guests: guests ? Number(guests) : undefined,
    });
  };

  const openBookingModal = (property: Property) => {
    setSelectedProperty(property);
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-secondary/10 bg-white p-4 shadow-soft">
        <div className="grid gap-3 md:grid-cols-3">
          <input className="field" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
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
            <PropertyCard key={property._id} property={property} onBook={() => openBookingModal(property)} />
          ))}
        </div>
      ) : null}

      <Modal
        isOpen={Boolean(selectedProperty)}
        onClose={() => setSelectedProperty(null)}
        title={selectedProperty?.name ?? 'Book Property'}
      >
        {selectedProperty ? (
          <div className="space-y-5">
            <div className="rounded-xl bg-muted p-4 text-sm text-dark/80">
              <p>{selectedProperty.description}</p>
              <p className="mt-2 font-medium text-secondary">
                {selectedProperty.location.address}, {selectedProperty.location.city}, {selectedProperty.location.country}
              </p>
            </div>
            <PropertyBookingForm
              property={selectedProperty}
              onSuccess={() => {
                setSelectedProperty(null);
              }}
            />
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
