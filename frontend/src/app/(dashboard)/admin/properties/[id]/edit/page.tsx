'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { BlockedPeriodsPanel } from '@/components/admin/BlockedPeriodsPanel';
import api from '@/lib/axios';
import { getReadableError } from '@/lib/utils';
import type { BlockedPeriod, Property } from '@/types';

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

interface SelectedImage {
  id: string;
  file: File;
  previewUrl: string;
}

interface UploadPropertyImagesResponse {
  mainImage: string;
  galleryImages: string[];
  allImages: string[];
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

async function createSelectedImage(file: File): Promise<SelectedImage> {
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
    file,
    previewUrl: await fileToDataUrl(file),
  };
}

export default function EditPropertyPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  // Existing images loaded from the server
  const [existingMainImage, setExistingMainImage] = useState<string>('');
  const [existingGalleryImages, setExistingGalleryImages] = useState<string[]>([]);

  // New images selected locally (not yet uploaded)
  const [newMainImage, setNewMainImage] = useState<SelectedImage | null>(null);
  const [newGalleryImages, setNewGalleryImages] = useState<SelectedImage[]>([]);

  // Track which existing gallery images the user wants to remove
  const [removedExistingGallery, setRemovedExistingGallery] = useState<Set<string>>(new Set());

  const [uploadingImages, setUploadingImages] = useState(false);
  const [blockedPeriods, setBlockedPeriods] = useState<BlockedPeriod[]>([]);

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
        const property = response.data;

        reset({
          name: property.name,
          description: property.description,
          address: property.location.address,
          city: property.location.city,
          country: property.location.country,
          maxGuests: property.maxGuests,
          pricePerNight: property.pricePerNight,
        });

        setExistingMainImage(property.mainImage ?? '');
        // Gallery = all images except the main cover
        const gallery = (property.images ?? []).filter((img) => img !== property.mainImage);
        setExistingGalleryImages(gallery);
        setBlockedPeriods(property.blockedPeriods ?? []);
      } catch (err) {
        toast.error(getReadableError(err, 'Could not load property details.'));
      }
    };

    bootstrap();
  }, [params.id, reset]);

  const reloadBlockedPeriods = async () => {
    try {
      const response = await api.get<Property>(`/properties/${params.id}`);
      setBlockedPeriods(response.data.blockedPeriods ?? []);
    } catch {
      /* ignore */
    }
  };

  // ── Image handlers ──────────────────────────────────────────────

  const onNewMainImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      setNewMainImage(await createSelectedImage(file));
    } catch {
      toast.error('Could not preview that image. Please try another.');
    }
  };

  const onNewGalleryImagesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;
    try {
      const selected = await Promise.all(files.map(createSelectedImage));
      // Always append so you can add images in batches
      setNewGalleryImages((prev) => [...prev, ...selected]);
    } catch {
      toast.error('Could not preview one or more images. Please try again.');
    }
  };

  const removeExistingGalleryImage = (url: string) => {
    setRemovedExistingGallery((prev) => new Set(prev).add(url));
  };

  const restoreExistingGalleryImage = (url: string) => {
    setRemovedExistingGallery((prev) => {
      const next = new Set(prev);
      next.delete(url);
      return next;
    });
  };

  const removeNewGalleryImage = (id: string) => {
    setNewGalleryImages((prev) => prev.filter((img) => img.id !== id));
  };

  const clearAllNewGallery = () => setNewGalleryImages([]);

  // ── Submit ───────────────────────────────────────────────────────

  const onSubmit = async (values: EditFormValues) => {
    try {
      let resolvedMainImage = existingMainImage;
      let resolvedGalleryImages = existingGalleryImages.filter(
        (url) => !removedExistingGallery.has(url),
      );

      const hasNewMainImage = newMainImage !== null;
      const hasNewGalleryImages = newGalleryImages.length > 0;

      if (hasNewMainImage) {
        // New cover + any new gallery images — use the combined endpoint
        setUploadingImages(true);

        const formData = new FormData();
        formData.append('mainImage', newMainImage.file);
        newGalleryImages.forEach((img) => formData.append('galleryImages', img.file));

        const uploadResponse = await api.post<UploadPropertyImagesResponse>(
          '/upload/property-images',
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } },
        );

        resolvedMainImage = uploadResponse.data.mainImage;
        resolvedGalleryImages = [
          ...resolvedGalleryImages,
          ...uploadResponse.data.galleryImages,
        ];

        setUploadingImages(false);
      } else if (hasNewGalleryImages) {
        // Only new gallery images — use the multi-upload endpoint
        setUploadingImages(true);

        const galleryFormData = new FormData();
        newGalleryImages.forEach((img) => galleryFormData.append('files', img.file));

        const uploadResponse = await api.post<{ urls: string[] }>(
          '/upload/images',
          galleryFormData,
          { headers: { 'Content-Type': 'multipart/form-data' } },
        );

        resolvedGalleryImages = [...resolvedGalleryImages, ...uploadResponse.data.urls];

        setUploadingImages(false);
      }

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
        mainImage: resolvedMainImage,
        images: [resolvedMainImage, ...resolvedGalleryImages].filter(Boolean),
      });

      toast.success('Listing updated.');
      router.push('/admin/properties');
    } catch (err) {
      setUploadingImages(false);
      toast.error(getReadableError(err, 'Could not update property.'));
    }
  };

  const isBusy = isSubmitting || uploadingImages;

  if (isLoading) return <LoadingSpinner label="Loading property..." />;

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-secondary/10 bg-white p-6 shadow-soft">
        <h2 className="text-2xl font-semibold">Edit Listing</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* ── Details ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-secondary/10 bg-white p-6 shadow-soft">
          <h3 className="mb-4 text-base font-semibold text-dark/80">Property Details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
        </div>

        {/* ── Cover Photo ──────────────────────────────────────────── */}
        <div className="rounded-2xl border border-secondary/10 bg-white p-6 shadow-soft">
          <h3 className="mb-4 text-base font-semibold text-dark/80">Cover Photo</h3>

          {/* Current cover — hide when a replacement is staged */}
          {!newMainImage && existingMainImage ? (
            <div className="mb-3 overflow-hidden rounded-xl border border-secondary/15">
              <Image
                src={existingMainImage}
                alt="Current cover photo"
                width={1200}
                height={800}
                className="h-52 w-full object-cover"
              />
              <p className="px-3 py-2 text-xs text-dark/50">Current cover photo</p>
            </div>
          ) : null}

          {/* Preview of newly selected cover */}
          {newMainImage ? (
            <div className="mb-3 overflow-hidden rounded-xl border border-secondary/15">
              <Image
                src={newMainImage.previewUrl}
                alt="New cover preview"
                width={1200}
                height={800}
                unoptimized
                className="h-52 w-full object-cover"
              />
              <div className="flex items-center justify-between px-3 py-2 text-xs text-dark/70">
                <span className="truncate">{newMainImage.file.name}</span>
                <button
                  type="button"
                  className="font-semibold text-red-600 hover:underline"
                  onClick={() => setNewMainImage(null)}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-dashed border-secondary/35 bg-muted/40 p-3">
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="field"
              onChange={onNewMainImageChange}
            />
            <p className="mt-2 text-xs text-dark/60">
              {existingMainImage
                ? 'Upload a new photo to replace the current cover.'
                : 'Select a cover photo. JPG, PNG or WebP, max 5 MB.'}
            </p>
          </div>
        </div>

        {/* ── Gallery Photos ───────────────────────────────────────── */}
        <div className="rounded-2xl border border-secondary/10 bg-white p-6 shadow-soft">
          <h3 className="mb-4 text-base font-semibold text-dark/80">Gallery Photos</h3>

          {/* Existing gallery */}
          {existingGalleryImages.length > 0 ? (
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium text-dark/60">
                Current photos — click Remove to delete on save
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {existingGalleryImages.map((url) => {
                  const isRemoved = removedExistingGallery.has(url);
                  return (
                    <div
                      key={url}
                      className={`overflow-hidden rounded-xl border transition-opacity ${
                        isRemoved ? 'opacity-40 border-red-300' : 'border-secondary/15'
                      } bg-white`}
                    >
                      <Image
                        src={url}
                        alt="Gallery photo"
                        width={900}
                        height={600}
                        className="h-32 w-full object-cover"
                      />
                      <div className="flex items-center justify-between px-2 py-1.5 text-xs text-dark/70">
                        <span className="text-dark/50">{isRemoved ? 'Will be removed' : 'Existing'}</span>
                        {isRemoved ? (
                          <button
                            type="button"
                            className="font-semibold text-secondary hover:underline"
                            onClick={() => restoreExistingGalleryImage(url)}
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="font-semibold text-red-600 hover:underline"
                            onClick={() => removeExistingGalleryImage(url)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* New gallery images staged for upload */}
          {newGalleryImages.length > 0 ? (
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-dark/60">
                  New photos to upload
                  <span className="ml-2 rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-semibold text-secondary">
                    {newGalleryImages.length} selected
                  </span>
                </p>
                <button
                  type="button"
                  onClick={clearAllNewGallery}
                  className="text-xs font-medium text-red-500 hover:underline"
                >
                  Clear all
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {newGalleryImages.map((image) => (
                  <div key={image.id} className="overflow-hidden rounded-xl border border-secondary/15 bg-white">
                    <Image
                      src={image.previewUrl}
                      alt={image.file.name}
                      width={900}
                      height={600}
                      unoptimized
                      className="h-32 w-full object-cover"
                    />
                    <div className="flex items-center justify-between px-2 py-1.5 text-xs text-dark/70">
                      <span className="truncate pr-2">{image.file.name}</span>
                      <button
                        type="button"
                        className="shrink-0 font-semibold text-red-600 hover:underline"
                        onClick={() => removeNewGalleryImage(image.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-dashed border-secondary/35 bg-muted/40 p-3">
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              className="field"
              onChange={onNewGalleryImagesChange}
            />
            <p className="mt-2 text-xs text-dark/60">
              Select multiple at once, or add more batches. No limit.
            </p>
          </div>
        </div>

        <BlockedPeriodsPanel propertyId={params.id} periods={blockedPeriods} onUpdated={reloadBlockedPeriods} />

        {/* ── Actions ─────────────────────────────────────────────── */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push('/admin/properties')}
            className="btn-ghost w-full"
            disabled={isBusy}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary w-full" disabled={isBusy}>
            {uploadingImages ? 'Uploading photos...' : isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </form>
    </section>
  );
}