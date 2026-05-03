'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PropertyBookingForm } from '@/components/booking/PropertyBookingForm';
import { Navbar } from '@/components/common/Navbar';
import { Footer } from '@/components/common/Footer';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/axios';
import { formatCurrency, getReadableError } from '@/lib/utils';
import type { Property } from '@/types';

const fallbackImage =
  'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80';

export default function PropertyDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, hydrated } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<Property>(`/properties/${params.id}`);
        setProperty(response.data);
      } catch (err) {
        setError(getReadableError(err, 'Could not load property details.'));
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [params.id]);

  const galleryImages = useMemo(() => {
    if (!property) return [fallbackImage];

    const images = [property.mainImage, ...(property.images ?? [])].filter(Boolean) as string[];
    const unique = Array.from(new Set(images));

    return unique.length > 0 ? unique : [fallbackImage];
  }, [property]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [galleryImages]);

  const loginNext = `/properties/${params.id}`;
  const canBookAsGuest = user?.role === 'user';

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="bg-primary py-16">
          <div className="container-shell">
            <LoadingSpinner label="Loading property details..." />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !property) {
    return (
      <>
        <Navbar />
        <main className="bg-primary py-16">
          <div className="container-shell space-y-4">
            <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error ?? 'Property not found.'}</p>
            <Link href="/properties" className="btn-ghost inline-flex">
              Back to Properties
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="bg-primary py-12">
        <section className="container-shell space-y-6">
          <Link href="/properties" className="btn-ghost inline-flex">
            Back to Properties
          </Link>

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <article className="space-y-4 rounded-2xl border border-secondary/10 bg-white p-5 shadow-soft">
              <header>
                <h1 className="text-3xl font-semibold">{property.name}</h1>
                <p className="mt-1 text-sm text-dark/70">
                  {property.location.address}, {property.location.city}, {property.location.country}
                </p>
              </header>

              <div className="overflow-hidden rounded-xl border border-secondary/10">
                <div className="relative h-72 w-full sm:h-96">
                  <Image
                    src={galleryImages[selectedImageIndex]}
                    alt={property.name}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 66vw, 100vw"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {galleryImages.map((image, index) => (
                  <button
                    type="button"
                    key={`${image}-${index}`}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`overflow-hidden rounded-lg border ${
                      index === selectedImageIndex ? 'border-secondary' : 'border-secondary/15'
                    }`}
                  >
                    <div className="relative h-20 w-full">
                      <Image
                        src={image}
                        alt={`${property.name} image ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="20vw"
                      />
                    </div>
                  </button>
                ))}
              </div>

              <div className="space-y-3 rounded-xl bg-muted p-4 text-sm text-dark/80">
                <p>{property.description}</p>
                <p>
                  <span className="font-semibold text-secondary">Price:</span> {formatCurrency(property.pricePerNight)} per
                  night
                </p>
                <p>
                  <span className="font-semibold text-secondary">Max Guests:</span> {property.maxGuests}
                </p>
                <p>
                  <span className="font-semibold text-secondary">Hosted by:</span> {property.owner?.name ?? 'StayEasy'}
                </p>
              </div>

              {property.rules?.length ? (
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold">House Rules</h2>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-dark/80">
                    {property.rules.map((rule, index) => (
                      <li key={`${rule}-${index}`}>{rule}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>

            <aside className="h-fit rounded-2xl border border-secondary/10 bg-white p-5 shadow-soft">
              <h2 className="text-xl font-semibold">Book this stay</h2>
              <p className="mt-1 text-sm text-dark/70">
                Pick dates and confirm. You can check availability before you sign in; booking requires a guest account.
              </p>

              {!hydrated ? (
                <p className="mt-4 text-sm text-dark/60">Loading...</p>
              ) : canBookAsGuest ? (
                <div className="mt-4">
                  <PropertyBookingForm
                    property={property}
                    onSuccess={() => router.push('/user/bookings')}
                  />
                </div>
              ) : user ? (
                <p className="mt-4 rounded-xl bg-muted px-4 py-3 text-sm text-dark/75">
                  Bookings are for guest accounts. Open the guest dashboard to browse and book, or register as a guest.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  <Link
                    href={`/login?next=${encodeURIComponent(loginNext)}`}
                    className="btn-primary inline-flex w-full justify-center"
                  >
                    Log in to book
                  </Link>
                  <Link
                    href={`/register?next=${encodeURIComponent(loginNext)}`}
                    className="btn-ghost inline-flex w-full justify-center"
                  >
                    Create guest account
                  </Link>
                </div>
              )}
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
