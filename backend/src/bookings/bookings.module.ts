import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { UserBookingsController } from './user-bookings.controller';
import { PropertiesModule } from '../properties/properties.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]),
    PropertiesModule,
    MailModule,
  ],
  providers: [BookingsService],
  controllers: [BookingsController, UserBookingsController],
  exports: [BookingsService],
})
export class BookingsModule {}