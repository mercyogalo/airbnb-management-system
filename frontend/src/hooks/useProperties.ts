'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/lib/axios';
import type { Property, PropertyFilters } from '@/types';
import { getReadableError } from '@/lib/utils';

export function useProperties(initialFilters: PropertyFilters = {}) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stable ref — never causes re-renders or effect re-runs
  const filtersRef = useRef<PropertyFilters>(initialFilters);

  const fetchProperties = useCallback(async (nextFilters?: PropertyFilters) => {
    if (nextFilters) {
      filtersRef.current = nextFilters;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get<Property[]>('/properties', {
        params: filtersRef.current,
      });
      setProperties(response.data);
    } catch (err) {
      setError(getReadableError(err, 'Could not load properties right now.'));
    } finally {
      setLoading(false);
    }
  }, []); // ✅ no dependencies — never recreated

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]); // ✅ fetchProperties is now stable, runs exactly once

  return {
    properties,
    loading,
    error,
    refetch: fetchProperties,
  };
}