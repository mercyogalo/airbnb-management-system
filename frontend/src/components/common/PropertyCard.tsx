import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Users } from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatCurrency } from '@/lib/utils';
import type { Property } from '@/types';

interface PropertyCardProps {
  property: Property;
  onBook?: () => void;
  showActions?: boolean;
  actionSlot?: React.ReactNode;
}

const placeholderImage =
  'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80';

export function PropertyCard({ property, onBook, showActions, actionSlot }: PropertyCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-secondary/10 bg-white shadow-soft">
      <div className="relative h-52 w-full">
        <Image
          src={property.mainImage || property.images?.[0] || placeholderImage}
          alt={property.name}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-xl font-semibold">{property.name}</h3>
          {showActions ? <StatusBadge status={property.status} /> : null}
        </div>

        <p className="line-clamp-2 text-sm text-dark/70">{property.description}</p>

        <div className="flex items-center gap-2 text-sm text-dark/70">
          <MapPin size={16} />
          <span>
            {property.location.city}, {property.location.country}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm text-dark/75">
          <span className="inline-flex items-center gap-2">
            <Users size={16} />
            Up to {property.maxGuests} guests
          </span>
          <span className="font-semibold text-secondary">{formatCurrency(property.pricePerNight)}/night</span>
        </div>

        <div className="flex items-center gap-2 pt-2">
          {onBook ? (
            <button type="button" className="btn-primary w-full" onClick={onBook}>
              Book Now
            </button>
          ) : (
            <Link href={`/properties/${property._id}`} className="btn-primary w-full text-center">
              View Details
            </Link>
          )}
          {actionSlot}
        </div>
      </div>
    </article>
  );
}
