import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { PropertiesModule } from '../properties/properties.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]),
    PropertiesModule,
  ],
  providers: [BookingsService],
  controllers: [BookingsController],
})
export class BookingsModule {}