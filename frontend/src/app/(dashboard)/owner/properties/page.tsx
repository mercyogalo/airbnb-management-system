'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PropertyCard } from '@/components/common/PropertyCard';
import api from '@/lib/axios';
import { getReadableError } from '@/lib/utils';
import type { Property } from '@/types';

export default function OwnerPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<Property[]>('/properties/owner/my');
      setProperties(response.data);
    } catch (err) {
      setError(getReadableError(err, 'Could not load your properties.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const deleteProperty = async () => {
    if (!propertyToDelete) return;

    try {
      await api.delete(`/properties/${propertyToDelete._id}`);
      toast.success('Property deleted.');
      setPropertyToDelete(null);
      fetchProperties();
    } catch (err) {
      toast.error(getReadableError(err, 'Could not delete property.'));
    }
  };

  return (
    <section className="space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-secondary/10 bg-white p-5 shadow-soft">
        <div>
          <h2 className="text-2xl font-semibold">My Properties</h2>
          {!loading && !error ? (
            <p className="mt-0.5 text-sm text-dark/60">
              {properties.length === 0
                ? 'No properties yet'
                : `${properties.length} propert${properties.length === 1 ? 'y' : 'ies'} listed`}
            </p>
          ) : null}
        </div>
        <Link href="/owner/properties/new" className="btn-primary shrink-0">
          Add Property
        </Link>
      </div>

      {/* Loading / error states */}
      {loading ? <LoadingSpinner label="Loading your properties..." /> : null}
      {error ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

      {/* Empty state */}
      {!loading && !error && properties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-secondary/20 bg-white p-12 text-center shadow-soft">
          <p className="text-lg font-medium text-dark/60">You have not listed any properties yet.</p>
          <p className="mt-1 text-sm text-dark/40">Click &ldquo;Add Property&rdquo; above to get started.</p>
          <Link href="/owner/properties/new" className="btn-primary mt-5 inline-block">
            Add Your First Property
          </Link>
        </div>
      ) : null}

      {/* Property grid */}
      {!loading && !error && properties.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard
              key={property._id}
              property={property}
              showActions
              actionSlot={
                <div className="mt-3 flex flex-col gap-2">
                  {/* Top row: Edit + View Bookings side by side */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/owner/properties/${property._id}/edit`}
                      className="flex items-center justify-center whitespace-nowrap rounded-xl border border-secondary/20 bg-white py-2 px-3 text-sm font-semibold text-dark/80 transition hover:border-secondary hover:text-secondary"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/owner/bookings?propertyId=${property._id}`}
                      className="flex items-center justify-center whitespace-nowrap rounded-xl border border-secondary/20 bg-white py-2 px-3 text-sm font-semibold text-dark/80 transition hover:border-secondary hover:text-secondary"
                    >
                      View Bookings
                    </Link>
                  </div>

                  {/* Delete full width below */}
                  <button
                    type="button"
                    onClick={() => setPropertyToDelete(property)}
                    className="w-full whitespace-nowrap rounded-xl border border-red-200 bg-white py-2 px-3 text-sm font-semibold text-red-500 transition hover:border-red-400 hover:bg-red-50"
                  >
                    Delete Property
                  </button>
                </div>
              }
            />
          ))}
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(propertyToDelete)}
        message={`Delete "${propertyToDelete?.name}" permanently? This action cannot be undone.`}
        onConfirm={deleteProperty}
        onCancel={() => setPropertyToDelete(null)}
        confirmText="Delete"
      />
    </section>
  );
}