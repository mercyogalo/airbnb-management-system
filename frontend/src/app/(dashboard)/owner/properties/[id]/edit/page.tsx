'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import api from '@/lib/axios';
import { getReadableError } from '@/lib/utils';
import type { Property } from '@/types';

const editSchema = z.object({
  name: z.string().min(2, 'Property name is required.'),
  description: z.string().min(10, 'Description is too short.'),
  address: z.string().min(3, 'Address is required.'),
  city: z.string().min(2, 'City is required.'),
  country: z.string().min(2, 'Country is required.'),
  maxGuests: z.number().min(1, 'Guests must be at least 1.'),
  pricePerNight: z.number().min(1, 'Price must be greater than 0.'),
});

type EditFormValues = z.infer<typeof editSchema>;

export default function EditPropertyPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isLoading, isSubmitting },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: async () => {
      const response = await api.get<Property>(`/properties/${params.id}`);
      return {
        name: response.data.name,
        description: response.data.description,
        address: response.data.location.address,
        city: response.data.location.city,
        country: response.data.location.country,
        maxGuests: response.data.maxGuests,
        pricePerNight: response.data.pricePerNight,
      };
    },
  });

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const response = await api.get<Property>(`/properties/${params.id}`);
        reset({
          name: response.data.name,
          description: response.data.description,
          address: response.data.location.address,
          city: response.data.location.city,
          country: response.data.location.country,
          maxGuests: response.data.maxGuests,
          pricePerNight: response.data.pricePerNight,
        });
      } catch (err) {
        toast.error(getReadableError(err, 'Could not load property details.'));
      }
    };

    bootstrap();
  }, [params.id, reset]);

  const onSubmit = async (values: EditFormValues) => {
    try {
      await api.put(`/properties/${params.id}`, {
        name: values.name,
        description: values.description,
        maxGuests: values.maxGuests,
        pricePerNight: values.pricePerNight,
        location: {
          address: values.address,
          city: values.city,
          country: values.country,
        },
      });

      toast.success('Property updated.');
      router.push('/owner/properties');
    } catch (err) {
      toast.error(getReadableError(err, 'Could not update property.'));
    }
  };

  if (isLoading) return <LoadingSpinner label="Loading property..." />;

  return (
    <section className="rounded-2xl border border-secondary/10 bg-white p-6 shadow-soft">
      <h2 className="text-2xl font-semibold">Edit Property</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-dark/85">Property Name</label>
          <input className="field" {...register('name')} />
          {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-dark/85">Description</label>
          <textarea className="field min-h-24" {...register('description')} />
          {errors.description ? <p className="mt-1 text-xs text-red-600">{errors.description.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-dark/85">Address</label>
          <input className="field" {...register('address')} />
          {errors.address ? <p className="mt-1 text-xs text-red-600">{errors.address.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-dark/85">City</label>
          <input className="field" {...register('city')} />
          {errors.city ? <p className="mt-1 text-xs text-red-600">{errors.city.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-dark/85">Country</label>
          <input className="field" {...register('country')} />
          {errors.country ? <p className="mt-1 text-xs text-red-600">{errors.country.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-dark/85">Max Guests</label>
          <input type="number" className="field" {...register('maxGuests', { valueAsNumber: true })} />
          {errors.maxGuests ? <p className="mt-1 text-xs text-red-600">{errors.maxGuests.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-dark/85">Price Per Night</label>
          <input type="number" className="field" {...register('pricePerNight', { valueAsNumber: true })} />
          {errors.pricePerNight ? <p className="mt-1 text-xs text-red-600">{errors.pricePerNight.message}</p> : null}
        </div>

        <div className="sm:col-span-2 flex gap-2">
          <button type="button" onClick={() => router.back()} className="btn-ghost w-full">
            Cancel
          </button>
          <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </section>
  );
}
