import { StatusBadge } from '@/components/common/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Booking } from '@/types';

interface BookingsTableProps {
  bookings: Booking[];
  actionCell?: (booking: Booking) => React.ReactNode;
}

export function BookingsTable({ bookings, actionCell }: BookingsTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-secondary/10 bg-white shadow-soft">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted text-left text-secondary">
            <tr>
              <th className="px-4 py-3 font-semibold">Property</th>
              <th className="px-4 py-3 font-semibold">Check-In</th>
              <th className="px-4 py-3 font-semibold">Check-Out</th>
              <th className="px-4 py-3 font-semibold">Guests</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking._id} className="border-t border-secondary/10 text-dark/80">
                <td className="px-4 py-3">{booking.property?.name ?? 'Property'}</td>
                <td className="px-4 py-3">{formatDate(booking.checkIn)}</td>
                <td className="px-4 py-3">{formatDate(booking.checkOut)}</td>
                <td className="px-4 py-3">{booking.guests}</td>
                <td className="px-4 py-3">{formatCurrency(booking.totalPrice)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={booking.status} />
                </td>
                <td className="px-4 py-3">{actionCell ? actionCell(booking) : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
