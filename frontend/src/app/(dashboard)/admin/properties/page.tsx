'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { StatusBadge } from '@/components/common/StatusBadge';
import api from '@/lib/axios';
import { formatCurrency, getReadableError } from '@/lib/utils';
import type { Property, PropertyListingStatus } from '@/types';

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<Property[]>('/properties/admin/all');
      setProperties(response.data);
    } catch (err) {
      setError(getReadableError(err, 'Could not load listings.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const updateStatus = async (propertyId: string, status: PropertyListingStatus) => {
    try {
      await api.put(`/properties/${propertyId}/status`, { status });
      toast.success(`Listing set to ${status}.`);
      fetchProperties();
    } catch (err) {
      toast.error(getReadableError(err, 'Could not update status.'));
    }
  };

  const deleteProperty = async (propertyId: string, name: string) => {
    if (!window.confirm(`Delete listing "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/properties/${propertyId}`);
      toast.success('Listing deleted.');
      fetchProperties();
    } catch (err) {
      toast.error(getReadableError(err, 'Could not delete listing.'));
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-secondary">Your listings</h2>
          <p className="mt-0.5 text-sm text-dark/65">Add, edit, activate, or block availability for each stay.</p>
        </div>
        <Link href="/admin/properties/new" className="btn-primary inline-flex shrink-0 items-center gap-2">
          <Plus size={18} />
          Add listing
        </Link>
      </div>

      {loading ? <LoadingSpinner label="Loading listings..." /> : null}
      {error ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

      {!loading && !error ? (
        <div className="overflow-hidden rounded-2xl border border-secondary/10 bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted text-left text-secondary">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => (
                  <tr key={property._id} className="border-t border-secondary/10 text-dark/80">
                    <td className="px-4 py-3">{property.name}</td>
                    <td className="px-4 py-3">
                      {property.location.city}, {property.location.country}
                    </td>
                    <td className="px-4 py-3">{formatCurrency(property.pricePerNight)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={property.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/admin/properties/${property._id}/edit`} className="btn-ghost !px-3 !py-1.5">
                          Edit
                        </Link>
                        <Link href="/admin/bookings" className="btn-ghost !px-3 !py-1.5">
                          Bookings
                        </Link>
                        {property.status === 'active' ? (
                          <button
                            type="button"
                            className="btn-ghost !px-3 !py-1.5"
                            onClick={() => updateStatus(property._id, 'inactive')}
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-primary !px-3 !py-1.5"
                            onClick={() => updateStatus(property._id, 'active')}
                          >
                            Activate
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-ghost !px-3 !py-1.5 text-red-700 hover:bg-red-50"
                          onClick={() => deleteProperty(property._id, property.name)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
