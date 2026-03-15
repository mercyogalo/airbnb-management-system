'use client';

import { useState } from 'react';
import { Navbar } from '@/components/common/Navbar';
import { Footer } from '@/components/common/Footer';
import { PropertyCard } from '@/components/common/PropertyCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useProperties } from '@/hooks/useProperties';

export default function PropertiesPage() {
  const [city, setCity] = useState('');
  const [guests, setGuests] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const { properties, loading, error, refetch } = useProperties();

  const onSearch = () => {
    refetch({
      city: city || undefined,
      guests: guests ? Number(guests) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });
  };

  return (
    <>
      <Navbar />
      <main className="bg-primary py-12">
        <section className="container-shell space-y-6">
          <header className="space-y-2">
            <h1 className="text-3xl font-semibold sm:text-4xl">All Properties</h1>
            <p className="text-sm text-dark/70 sm:text-base">
              Browse all available stays, open full details, and book the one that fits your plans.
            </p>
          </header>

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
                type="number"
                min={1}
                placeholder="Guests"
                value={guests}
                onChange={(event) => setGuests(event.target.value)}
              />
              <input
                className="field"
                type="number"
                min={1}
                placeholder="Min price"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
              />
              <input
                className="field"
                type="number"
                min={1}
                placeholder="Max price"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
              />
              <button type="button" onClick={onSearch} className="btn-primary w-full">
                Search
              </button>
            </div>
          </div>

          {loading ? <LoadingSpinner label="Loading properties..." /> : null}
          {error ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

          {!loading && !error ? (
            properties.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {properties.map((property) => (
                  <PropertyCard key={property._id} property={property} />
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-white p-4 text-sm text-dark/70 shadow-soft">
                No properties found for your filters.
              </p>
            )
          ) : null}
        </section>
      </main>
      <Footer />
    </>
  );
}
