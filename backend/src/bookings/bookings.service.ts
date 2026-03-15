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
    if (typeof value === 'string') return value;
    if (value instanceof Types.ObjectId) return value.toString();

    if (typeof value === 'object' && value !== null) {
      const doc = value as { _id?: unknown; id?: unknown; toString?: () => string };
      if (typeof doc.id === 'string' && doc.id.length > 0) return doc.id;
      if (doc._id && doc._id !== value) return this.toIdString(doc._id);
      if (typeof doc.toString === 'function') {
        const asString = doc.toString();
        if (asString && asString !== '[object Object]') return asString;
      }
    }

    return null;
  }

  async create(dto: CreateBookingDto, guest: UserDocument): Promise<Booking> {
    const { propertyId, checkIn, checkOut, guests } = dto;

    // ── Date/time validation ───────────────────────────────────────
    if (checkIn >= checkOut) {
      throw new BadRequestException('Check-out must be after check-in.');
    }

    const now = new Date();
    if (checkIn < now) {
      throw new BadRequestException('Check-in cannot be in the past.');
    }

    const property = await this.propertiesService.findOne(propertyId) as PropertyDocument;

    if (property.status !== PropertyStatus.APPROVED) {
      throw new BadRequestException('This property is not available for booking.');
    }

    if (guests > property.maxGuests) {
      throw new BadRequestException(`This property supports a maximum of ${property.maxGuests} guests.`);
    }

    // ── Blocked dates check ────────────────────────────────────────
    const blocked = property.blockedDates.some(
      (d) => d >= checkIn && d <= checkOut,
    );
    if (blocked) {
      throw new ConflictException('Your selected dates include dates that have been blocked by the owner.');
    }

    // ── Overlap check — includes same-day time conflicts ──────────
    // A conflict exists when an existing booking's period overlaps with
    // the requested period. Two periods [A, B] and [C, D] overlap when
    // A < D AND C < B (strict less-than so back-to-back bookings are allowed,
    // e.g. checkout at 11:00 and new checkin at 11:00 on the same day is fine).
    const conflict = await this.bookingModel.findOne({
      property: new Types.ObjectId(propertyId),
      status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      checkIn: { $lt: checkOut },   // existing starts before new ends
      checkOut: { $gt: checkIn },   // existing ends after new starts
    });

    if (conflict) {
      throw new ConflictException(
        `This property is already booked from ${conflict.checkIn.toISOString()} to ${conflict.checkOut.toISOString()}. Please choose different dates or times.`,
      );
    }

    // ── Calculate price ────────────────────────────────────────────
    // Use fractional nights based on actual hours for time-based bookings
    const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
    const nights = Math.ceil(hours / 24);
    const totalPrice = nights * property.pricePerNight;

    const booking = new this.bookingModel({
      guest: guest._id,
      property: new Types.ObjectId(propertyId),
      checkIn,
      checkOut,
      guests,
      totalPrice,
      specialRequests: dto.specialRequests,
      guestPhone: dto.guestPhone,
    });

    return booking.save();
  }

  // ── Check availability before submitting (used by frontend) ───────
  async checkAvailability(
    propertyId: string,
    checkIn: Date,
    checkOut: Date,
  ): Promise<{ available: boolean; conflictMessage?: string }> {
    if (checkIn >= checkOut) {
      return { available: false, conflictMessage: 'Check-out must be after check-in.' };
    }

    const conflict = await this.bookingModel.findOne({
      property: new Types.ObjectId(propertyId),
      status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      checkIn: { $lt: checkOut },
      checkOut: { $gt: checkIn },
    });

    if (conflict) {
      return {
        available: false,
        conflictMessage: `Already booked from ${conflict.checkIn.toISOString()} to ${conflict.checkOut.toISOString()}. Please choose different times.`,
      };
    }

    return { available: true };
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

    if (status === BookingStatus.CANCELLED && !isGuest && !isOwner && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not authorized');
    }

    if (
      [BookingStatus.CONFIRMED, BookingStatus.COMPLETED].includes(status) &&
      !isOwner &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Only the property owner can confirm or complete bookings.');
    }

    booking.status = status;
    return booking.save();
  }

  async delete(id: string, user: UserDocument): Promise<void> {
    const booking = await this.bookingModel.findById(id);
    if (!booking) throw new NotFoundException('Booking not found');

    const requesterId = this.toIdString(user._id);
    const guestId = this.toIdString(booking.guest);

    if (guestId !== requesterId && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not authorized');
    }

    if (booking.status === BookingStatus.CONFIRMED) {
      throw new BadRequestException('Cannot delete a confirmed booking — cancel it first.');
    }

    await this.bookingModel.findByIdAndDelete(id);
  }
}