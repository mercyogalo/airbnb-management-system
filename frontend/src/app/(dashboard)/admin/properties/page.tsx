'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { StatusBadge } from '@/components/common/StatusBadge';
import api from '@/lib/axios';
import { formatCurrency, getReadableError } from '@/lib/utils';
import type { Property } from '@/types';

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
      setError(getReadableError(err, 'Could not load properties.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const updateStatus = async (propertyId: string, status: Property['status']) => {
    try {
      await api.put(`/properties/${propertyId}/status`, { status });
      toast.success(`Property ${status}.`);
      fetchProperties();
    } catch (err) {
      toast.error(getReadableError(err, 'Could not update property status.'));
    }
  };

  return (
    <section className="space-y-4">
      {loading ? <LoadingSpinner label="Loading properties..." /> : null}
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
                      {property.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="btn-primary !px-3 !py-1.5"
                            onClick={() => updateStatus(property._id, 'approved')}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="btn-ghost !px-3 !py-1.5"
                            onClick={() => updateStatus(property._id, 'rejected')}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-dark/60">No actions</span>
                      )}
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
