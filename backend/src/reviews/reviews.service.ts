import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/reviews.schema';
import { Booking, BookingDocument, BookingStatus } from '../bookings/schemas/booking.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { ReviewsGateway } from './reviews.gateway';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private reviewsGateway: ReviewsGateway,
  ) {}

  // ── Create — only guests with a COMPLETED booking can review ──
  async create(dto: CreateReviewDto, user: UserDocument): Promise<Review> {
    // Check for a completed booking by this guest for this property
    const completedBooking = await this.bookingModel.findOne({
      guest: user._id,
      property: new Types.ObjectId(dto.propertyId),
      status: BookingStatus.COMPLETED,
    });

    if (!completedBooking) {
      throw new ForbiddenException(
        'You can only review a property after completing a stay.',
      );
    }

    // One review per guest per property (enforced by unique index too)
    const existing = await this.reviewModel.findOne({
      guest: user._id,
      property: new Types.ObjectId(dto.propertyId),
    });

    if (existing) {
      throw new ConflictException('You have already reviewed this property.');
    }

    const review = await this.reviewModel.create({
      guest: user._id,
      property: new Types.ObjectId(dto.propertyId),
      rating: dto.rating,
      comment: dto.comment,
      guestName: user.name,
    });

    // Broadcast in real-time to all clients viewing this property
    this.reviewsGateway.broadcastNewReview(dto.propertyId, {
      _id: review._id,
      rating: review.rating,
      comment: review.comment,
      guestName: review.guestName,
      createdAt: (review as any).createdAt,
    });

    return review;
  }

  // ── Get all reviews for a property
  async findByProperty(propertyId: string): Promise<{
    reviews: Review[];
    averageRating: number;
    totalReviews: number;
  }> {
    const reviews = await this.reviewModel
      .find({ property: new Types.ObjectId(propertyId) })
      .sort({ createdAt: -1 });

    const totalReviews   = reviews.length;
    const averageRating  = totalReviews
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
      : 0;

    return { reviews, averageRating, totalReviews };
  }

  // ── Admin: delete a review 
  async delete(id: string): Promise<void> {
    const review = await this.reviewModel.findByIdAndDelete(id);
    if (!review) throw new NotFoundException('Review not found');
  }
}