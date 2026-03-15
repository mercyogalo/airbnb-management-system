'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/axios';
import type { Property, PropertyFilters } from '@/types';
import { getReadableError } from '@/lib/utils';

export function useProperties(initialFilters: PropertyFilters = {}) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filters, setFilters] = useState<PropertyFilters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = useCallback(async (nextFilters?: PropertyFilters) => {
    const activeFilters = nextFilters ?? filters;
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<Property[]>('/properties', {
        params: activeFilters,
      });
      setProperties(response.data);
    } catch (err) {
      setError(getReadableError(err, 'Could not load properties right now.'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProperties(initialFilters);
  }, [fetchProperties, initialFilters]);

  return {
    properties,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchProperties,
  };
}
