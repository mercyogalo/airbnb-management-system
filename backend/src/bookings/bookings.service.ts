import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument, BookingStatus } from './schemas/booking.schema';
import { PropertyDocument, PropertyStatus } from '../properties/schemas/property.schema';
import { PropertiesService } from '../properties/properties.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UserDocument, UserRole } from '../users/schemas/user.schema';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private propertiesService: PropertiesService,
  ) {}

  private toIdString(value: unknown): string | null {
    if (!value) return null;

    if (typeof value === 'string') {
      return value;
    }

    if (value instanceof Types.ObjectId) {
      return value.toString();
    }

    if (typeof value === 'object' && value !== null) {
      const doc = value as { _id?: unknown; id?: unknown; toString?: () => string };

      if (typeof doc.id === 'string' && doc.id.length > 0) {
        return doc.id;
      }

      if (doc._id && doc._id !== value) {
        return this.toIdString(doc._id);
      }

      if (typeof doc.toString === 'function') {
        const asString = doc.toString();
        if (asString && asString !== '[object Object]') {
          return asString;
        }
      }
    }

    return null;
  }

  async create(dto: CreateBookingDto, guest: UserDocument): Promise<Booking> {
    const { propertyId, checkIn, checkOut, guests } = dto;

    if (checkIn >= checkOut) throw new BadRequestException('checkOut must be after checkIn');
    if (checkIn < new Date()) throw new BadRequestException('checkIn cannot be in the past');

    const property = await this.propertiesService.findOne(propertyId) as PropertyDocument;

    if (property.status !== PropertyStatus.APPROVED) {
      throw new BadRequestException('Property is not available for booking');
    }
    if (guests > property.maxGuests) {
      throw new BadRequestException(`Property supports max ${property.maxGuests} guests`);
    }

    // Check blocked dates
    const blocked = property.blockedDates.some(
      (d) => d >= checkIn && d <= checkOut,
    );
    if (blocked) throw new ConflictException('Selected dates include blocked dates');

    // Prevent double booking — atomic check
    const conflict = await this.bookingModel.findOne({
      property: new Types.ObjectId(propertyId),
      status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      $or: [
        { checkIn: { $lt: checkOut, $gte: checkIn } },
        { checkOut: { $gt: checkIn, $lte: checkOut } },
        { checkIn: { $lte: checkIn }, checkOut: { $gte: checkOut } },
      ],
    });
    if (conflict) throw new ConflictException('Property already booked for selected dates');

    // Calculate total price
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * property.pricePerNight;

    const booking = new this.bookingModel({
      guest: guest._id,
      property: new Types.ObjectId(propertyId),
      checkIn,
      checkOut,
      guests,
      totalPrice,
      specialRequests: dto.specialRequests,
    });

    return booking.save();
  }

  async findAllByGuest(guestId: string) {
    return this.bookingModel
      .find({ guest: new Types.ObjectId(guestId) })
      .populate('property', 'name location pricePerNight images')
      .sort({ createdAt: -1 });
  }

  async findAllByProperty(propertyId: string, owner: UserDocument) {
    const property = await this.propertiesService.findOne(propertyId) as PropertyDocument;

    const propertyOwnerId = this.toIdString(property.owner);
    const requesterId = this.toIdString(owner._id);

    if (!propertyOwnerId || !requesterId) {
      throw new ForbiddenException('Not authorized');
    }

    if (propertyOwnerId !== requesterId && owner.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not authorized');
    }

    return this.bookingModel
      .find({ property: new Types.ObjectId(propertyId) })
      .populate('guest', 'name email')
      .sort({ checkIn: 1 });
  }

  async findOne(id: string, user: UserDocument): Promise<BookingDocument> {
    const booking = await this.bookingModel
      .findById(id)
      .populate('property guest');
    if (!booking) throw new NotFoundException('Booking not found');

    const requesterId = this.toIdString(user._id);
    const guestId = this.toIdString(booking.guest);
    const ownerId = this.toIdString((booking.property as any)?.owner);

    const isGuest = guestId !== null && requesterId !== null && guestId === requesterId;
    const isOwner = ownerId !== null && requesterId !== null && ownerId === requesterId;

    if (!isGuest && !isOwner && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not authorized');
    }

    return booking;
  }

  async updateStatus(id: string, status: BookingStatus, user: UserDocument): Promise<Booking> {
    const booking = await this.bookingModel.findById(id).populate('property');
    if (!booking) throw new NotFoundException('Booking not found');

    const requesterId = this.toIdString(user._id);
    const guestId = this.toIdString(booking.guest);
    const ownerId = this.toIdString((booking.property as any)?.owner);

    const isGuest = guestId !== null && requesterId !== null && guestId === requesterId;
    const isOwner = ownerId !== null && requesterId !== null && ownerId === requesterId;

    // Guests can only cancel their own bookings
    if (status === BookingStatus.CANCELLED && !isGuest && !isOwner && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not authorized');
    }
    // Only owners/admins can confirm/complete
    if ([BookingStatus.CONFIRMED, BookingStatus.COMPLETED].includes(status) && !isOwner && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only property owner can confirm or complete bookings');
    }

    booking.status = status;
    return booking.save();
  }

  async delete(id: string, user: UserDocument): Promise<void> {
    const booking = await this.bookingModel.findById(id);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.guest.toString() !== user._id.toString() && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not authorized');
    }
    if (booking.status === BookingStatus.CONFIRMED) {
      throw new BadRequestException('Cannot delete a confirmed booking — cancel it first');
    }
    await this.bookingModel.findByIdAndDelete(id);
  }
}