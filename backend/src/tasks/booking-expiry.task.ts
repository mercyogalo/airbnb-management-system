import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingsService } from '../bookings/bookings.service';

@Injectable()
export class BookingExpiryTask {
  private readonly logger = new Logger(BookingExpiryTask.name);

  constructor(private bookingsService: BookingsService) {}

  @Cron(CronExpression.EVERY_5_MINUTES, { name: 'booking-expiry' })  // ← add name option
  async handleExpiry() {
    const count = await this.bookingsService.expireUnpaidBookings();
    if (count > 0) {
      this.logger.log(`Expired ${count} unpaid booking(s)`);
    }
  }
}