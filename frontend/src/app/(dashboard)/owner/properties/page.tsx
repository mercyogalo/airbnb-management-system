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
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">My Properties</h2>
        <Link href="/owner/properties/new" className="btn-primary">
          Add Property
        </Link>
      </div>

      {loading ? <LoadingSpinner label="Loading your properties..." /> : null}
      {error ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

      {!loading && !error ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard
              key={property._id}
              property={property}
              showActions
              actionSlot={
                <div className="mt-2 flex w-full gap-2">
                  <Link href={`/owner/properties/${property._id}/edit`} className="btn-ghost w-full !px-3 !py-2 text-center">
                    Edit
                  </Link>
                  <Link href={`/owner/bookings?propertyId=${property._id}`} className="btn-ghost w-full !px-3 !py-2 text-center">
                    View Bookings
                  </Link>
                  <button
                    type="button"
                    onClick={() => setPropertyToDelete(property)}
                    className="btn-ghost w-full !px-3 !py-2"
                  >
                    Delete
                  </button>
                </div>
              }
            />
          ))}
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(propertyToDelete)}
        message="Delete this property permanently? This action cannot be undone."
        onConfirm={deleteProperty}
        onCancel={() => setPropertyToDelete(null)}
        confirmText="Delete"
      />
    </section>
  );
}
