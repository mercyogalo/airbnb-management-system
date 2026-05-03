'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { PropertyCard } from '@/components/common/PropertyCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getReadableError } from '@/lib/utils';
import type { Property } from '@/types';

export function SampleProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const response = await api.get<Property[]>('/properties');
        setProperties(response.data.slice(0, 6));
      } catch (err) {
        setError(getReadableError(err, 'Could not load sample properties.'));
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  return (
    <section id="properties" className="bg-primary py-20">
      <div className="container-shell">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold sm:text-4xl">Explore Our Properties</h2>
            <p className="mt-2 text-dark/70">Handpicked homes across the most loved cities.</p>
          </div>
        </div>

        {loading ? <LoadingSpinner label="Loading featured properties..." /> : null}
        {error ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

        {!loading && !error ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard key={property._id} property={property} />
            ))}
          </div>
        ) : null}

        <div className="mt-10 text-center">
          <Link href="/properties" className="btn-primary">
            View All Properties
          </Link>
        </div>
      </div>
    </section>
  );
}
