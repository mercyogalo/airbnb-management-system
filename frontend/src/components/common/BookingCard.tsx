import { CalendarClock, Users } from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Booking, UserRole } from '@/types';

interface BookingCardProps {
  booking: Booking;
  role?: UserRole;
  onCancel?: () => void;
  onDelete?: () => void;
  onConfirm?: () => void;
  onComplete?: () => void;
  onView?: () => void;
}

export function BookingCard({
  booking,
  role = 'user',
  onCancel,
  onDelete,
  onConfirm,
  onComplete,
  onView,
}: BookingCardProps) {
  return (
    <article className="rounded-2xl border border-secondary/10 bg-white p-5 shadow-soft">
      <div className="mb-3 flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold">{booking.property?.name ?? 'Property Booking'}</h3>
        <StatusBadge status={booking.status} />
      </div>

      <div className="grid gap-3 text-sm text-dark/80 sm:grid-cols-2">
        <p className="inline-flex items-center gap-2">
          <CalendarClock size={16} />
          {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
        </p>
        <p className="inline-flex items-center gap-2">
          <Users size={16} />
          {booking.guests} guests
        </p>
      </div>

      <p className="mt-3 text-sm font-semibold text-secondary">Total: {formatCurrency(booking.totalPrice)}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {onView ? (
          <button type="button" className="btn-ghost" onClick={onView}>
            View
          </button>
        ) : null}

        {role === 'user' && booking.status === 'pending' && onCancel ? (
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        ) : null}

        {(booking.status === 'pending' || booking.status === 'cancelled') && onDelete ? (
          <button type="button" className="btn-ghost" onClick={onDelete}>
            Delete
          </button>
        ) : null}

        {(role === 'owner' || role === 'admin') && booking.status === 'pending' && onConfirm ? (
          <button type="button" className="btn-primary" onClick={onConfirm}>
            Confirm
          </button>
        ) : null}

        {(role === 'owner' || role === 'admin') && booking.status === 'confirmed' && onComplete ? (
          <button type="button" className="btn-primary" onClick={onComplete}>
            Complete
          </button>
        ) : null}
      </div>
    </article>
  );
}
