'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { getReadableError } from '@/lib/utils';

const propertySchema = z.object({
  name: z.string().min(2, 'Property name is required.'),
  description: z.string().min(10, 'Describe your property in at least 10 characters.'),
  maxGuests: z.number().min(1, 'At least 1 guest is required.'),
  pricePerNight: z.number().min(1, 'Price per night must be greater than 0.'),
  address: z.string().min(3, 'Address is required.'),
  city: z.string().min(2, 'City is required.'),
  country: z.string().min(2, 'Country is required.'),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

interface UploadPropertyImagesResponse {
  mainImage: string;
  galleryImages: string[];
  allImages: string[];
}

interface SelectedImage {
  id: string;
  file: File;
  previewUrl: string;
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

export default function NewPropertyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [ruleInput, setRuleInput] = useState('');
  const [rules, setRules] = useState<string[]>([]);
  const [mainImage, setMainImage] = useState<SelectedImage | null>(null);
  const [galleryImages, setGalleryImages] = useState<SelectedImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: '',
      description: '',
      maxGuests: 1,
      pricePerNight: 100,
      address: '',
      city: '',
      country: '',
    },
  });

  const progressClass = step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full';

  const addRule = () => {
    const value = ruleInput.trim();
    if (!value) return;
    setRules((prev) => [...prev, value]);
    setRuleInput('');
  };

  const removeRule = (index: number) => {
    setRules((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const onMainImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const selected = await createSelectedImage(file);
      setMainImage(selected);
    } catch {
      toast.error('Could not load that image preview. Please try another image.');
    }
  };

  const onGalleryImagesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    try {
      const selectedImages = await Promise.all(files.map((file) => createSelectedImage(file)));
      setGalleryImages((prev) => [...prev, ...selectedImages]);
    } catch {
      toast.error('Could not load one or more gallery images. Please try again.');
    }
  };

  const removeGalleryImage = (id: string) => {
    setGalleryImages((prev) => prev.filter((image) => image.id !== id));
  };

  const goNext = async () => {
    if (step === 1) {
      const valid = await trigger(['name', 'description', 'maxGuests', 'pricePerNight']);
      if (!valid) return;
    }

    if (step === 2) {
      const valid = await trigger(['address', 'city', 'country']);
      if (!valid) return;
    }

    setStep((prev) => Math.min(3, prev + 1));
  };

  const onSubmit = async (values: PropertyFormValues) => {
    if (!mainImage) {
      toast.error('Main / cover image is required.');
      return;
    }

    try {
      setUploadingImages(true);

      const formData = new FormData();
      formData.append('mainImage', mainImage.file);
      galleryImages.forEach((image) => formData.append('galleryImages', image.file));

      const uploadResponse = await api.post<UploadPropertyImagesResponse>('/upload/property-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      await api.post('/properties', {
        name: values.name,
        description: values.description,
        maxGuests: values.maxGuests,
        pricePerNight: values.pricePerNight,
        location: {
          address: values.address,
          city: values.city,
          country: values.country,
        },
        rules,
        mainImage: uploadResponse.data.mainImage,
        images: uploadResponse.data.galleryImages,
      });

      toast.success('Property submitted successfully.');
      router.push('/owner/properties');
    } catch (err) {
      toast.error(getReadableError(err, 'Could not create property.'));
    } finally {
      setUploadingImages(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-secondary/10 bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Add New Property</h2>
          <span className="text-sm text-dark/70">Step {step} of 3</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className={`h-full rounded-full bg-secondary transition-all ${progressClass}`} />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl border border-secondary/10 bg-white p-5 shadow-soft">
        {step === 1 ? (
          <div className="grid gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-dark/85">Property Name</label>
              <input className="field" {...register('name')} />
              {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-dark/85">Description</label>
              <textarea className="field min-h-24" {...register('description')} />
              {errors.description ? <p className="mt-1 text-xs text-red-600">{errors.description.message}</p> : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-dark/85">Max Guests</label>
                <input
                  type="number"
                  min={1}
                  className="field"
                  {...register('maxGuests', { valueAsNumber: true })}
                />
                {errors.maxGuests ? <p className="mt-1 text-xs text-red-600">{errors.maxGuests.message}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-dark/85">Price Per Night</label>
                <input
                  type="number"
                  min={1}
                  className="field"
                  {...register('pricePerNight', { valueAsNumber: true })}
                />
                {errors.pricePerNight ? <p className="mt-1 text-xs text-red-600">{errors.pricePerNight.message}</p> : null}
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
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
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-dark/85">House Rules</label>
              <div className="flex gap-2">
                <input
                  className="field"
                  value={ruleInput}
                  onChange={(event) => setRuleInput(event.target.value)}
                  placeholder="No smoking"
                />
                <button type="button" className="btn-ghost" onClick={addRule}>
                  Add
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {rules.map((rule, index) => (
                  <button
                    key={`${rule}-${index}`}
                    type="button"
                    onClick={() => removeRule(index)}
                    className="rounded-full bg-muted px-3 py-1 text-xs text-secondary hover:bg-secondary/10"
                  >
                    {rule} ×
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-dark/85">Main / Cover Photo (required)</label>
              <div className="rounded-xl border border-dashed border-secondary/35 bg-muted/40 p-3">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="field"
                  onChange={onMainImageChange}
                />
                <p className="mt-2 text-xs text-dark/65">Select one image for the listing cover.</p>
              </div>

              {mainImage ? (
                <div className="mt-3 overflow-hidden rounded-xl border border-secondary/15 bg-white">
                  <Image
                    src={mainImage.previewUrl}
                    alt="Main property preview"
                    width={1200}
                    height={800}
                    unoptimized
                    className="h-48 w-full object-cover"
                  />
                  <div className="flex items-center justify-between px-3 py-2 text-xs text-dark/70">
                    <span className="truncate">{mainImage.file.name}</span>
                    <button
                      type="button"
                      className="font-semibold text-red-600 hover:underline"
                      onClick={() => setMainImage(null)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-dark/85">Gallery Photos (optional)</label>
              <div className="rounded-xl border border-dashed border-secondary/35 bg-muted/40 p-3">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  className="field"
                  onChange={onGalleryImagesChange}
                />
                <p className="mt-2 text-xs text-dark/65">You can add more photos multiple times.</p>
              </div>

              <p className="mt-3 text-xs font-medium text-dark/70">{galleryImages.length} photos selected</p>

              <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {galleryImages.map((image) => (
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
                        onClick={() => removeGalleryImage(image.id)}
                        className="font-semibold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex gap-2">
          <button
            type="button"
            className="btn-ghost w-full"
            onClick={() => setStep((prev) => Math.max(1, prev - 1))}
            disabled={step === 1}
          >
            Back
          </button>

          {step < 3 ? (
            <button type="button" className="btn-primary w-full" onClick={goNext}>
              Next Step
            </button>
          ) : (
            <button type="submit" className="btn-primary w-full" disabled={isSubmitting || uploadingImages}>
              {isSubmitting || uploadingImages ? 'Submitting...' : 'Submit Property'}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
