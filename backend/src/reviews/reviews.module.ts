import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Review, ReviewSchema } from './schemas/reviews.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { ReviewsGateway } from './reviews.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Review.name,   schema: ReviewSchema },
      { name: Booking.name,  schema: BookingSchema },
    ]),
  ],
  providers: [ReviewsService, ReviewsGateway],
  controllers: [ReviewsController],
})
export class ReviewsModule {}