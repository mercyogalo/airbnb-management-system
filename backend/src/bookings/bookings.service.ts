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
import { MailService } from '../mail/mail.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UserDocument, UserRole } from '../users/schemas/user.schema';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private propertiesService: PropertiesService,
    private mailService: MailService,
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
        const s = doc.toString();
        if (s && s !== '[object Object]') return s;
      }
    }
    return null;
  }

  // ── Create booking → status AWAITING_PAYMENT ──────────────────
  async create(dto: CreateBookingDto, guest: UserDocument): Promise<Booking> {
    const { propertyId, checkIn, checkOut, guests } = dto;

    // ── Date validation ────────────────────────────────────────
    if (checkIn >= checkOut) {
      throw new BadRequestException('Check-out must be after check-in.');
    }
    if (checkIn < new Date()) {
      throw new BadRequestException('Check-in cannot be in the past.');
    }

    const property = await this.propertiesService.findOne(propertyId) as PropertyDocument;

    if (property.status !== PropertyStatus.ACTIVE) {
      throw new BadRequestException('This property is not currently available for booking.');
    }

    if (guests > property.maxGuests) {
      throw new BadRequestException(
        `This property supports a maximum of ${property.maxGuests} guests.`,
      );
    }

    // ── Blocked periods check ──────────────────────────────────
    const isBlocked = this.propertiesService.isDateRangeBlocked(property, checkIn, checkOut);
    if (isBlocked) {
      throw new ConflictException(
        'Your selected dates overlap with a blocked period (e.g. maintenance or fumigation). Please choose different dates.',
      );
    }

    // ── Overlap check against existing confirmed/pending bookings
    const conflict = await this.bookingModel.findOne({
      property: new Types.ObjectId(propertyId),
      status: { $in: [BookingStatus.AWAITING_PAYMENT, BookingStatus.CONFIRMED] },
      checkIn: { $lt: checkOut },
      checkOut: { $gt: checkIn },
    });

    if (conflict) {
      throw new ConflictException(
        `This property is already booked from ${conflict.checkIn.toISOString()} to ${conflict.checkOut.toISOString()}. Please choose different dates.`,
      );
    }

    // ── Calculate price ────────────────────────────────────────
    const hours  = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
    const nights = Math.ceil(hours / 24);
    const totalPrice = nights * property.pricePerNight;

    const booking = await this.bookingModel.create({
      guest: guest._id,
      property: new Types.ObjectId(propertyId),
      checkIn,
      checkOut,
      guests,
      totalPrice,
      specialRequests: dto.specialRequests,
      guestPhone: dto.guestPhone,
      guestEmail: guest.email,
      guestName: guest.name,
      status: BookingStatus.AWAITING_PAYMENT,
      paymentDeadline: new Date(Date.now() + 30 * 60 * 1000), // 30 min
    });

    // Send "booking received, please pay" email
    await this.mailService.sendBookingAwaitingPayment({
      guestName: guest.name,
      guestEmail: guest.email,
      propertyName: property.name,
      checkIn,
      checkOut,
      totalPrice,
      currency: 'KES',
      bookingId: booking._id.toString(),
      paymentDeadlineMinutes: 30,
    });

    return booking;
  }

  // ── Availability check (called before booking form submit) ─────
  async checkAvailability(
    propertyId: string,
    checkIn: Date,
    checkOut: Date,
  ): Promise<{ available: boolean; conflictMessage?: string; blockedPeriods?: any[] }> {
    if (checkIn >= checkOut) {
      return { available: false, conflictMessage: 'Check-out must be after check-in.' };
    }

    // Check property blocked periods
    const property = await this.propertiesService.findOne(propertyId) as PropertyDocument;

    if (property.status !== PropertyStatus.ACTIVE) {
      return {
        available: false,
        conflictMessage: 'This property is currently unavailable.',
        blockedPeriods: property.blockedPeriods,
      };
    }

    const isBlocked = this.propertiesService.isDateRangeBlocked(property, checkIn, checkOut);
    if (isBlocked) {
      const overlapping = property.blockedPeriods.filter(
        (p) => p.start < checkOut && p.end > checkIn,
      );
      return {
        available: false,
        conflictMessage: `Selected dates overlap a blocked period: "${overlapping[0]?.reason}"`,
        blockedPeriods: overlapping,
      };
    }

    // Check existing bookings
    const conflict = await this.bookingModel.findOne({
      property: new Types.ObjectId(propertyId),
      status: { $in: [BookingStatus.AWAITING_PAYMENT, BookingStatus.CONFIRMED] },
      checkIn: { $lt: checkOut },
      checkOut: { $gt: checkIn },
    });

    if (conflict) {
      return {
        available: false,
        conflictMessage: `Already booked from ${conflict.checkIn.toISOString()} to ${conflict.checkOut.toISOString()}.`,
      };
    }

    return { available: true };
  }

  // ── Guest: my bookings ─────────────────────────────────────────
  async findAllByGuest(guestId: string) {
    return this.bookingModel
      .find({ guest: new Types.ObjectId(guestId) })
      .populate('property', 'name location pricePerNight mainImage')
      .sort({ createdAt: -1 });
  }

  // ── Owner / admin: bookings for a specific property ───────────
  async findAllByProperty(propertyId: string, user: UserDocument) {
    const property = await this.propertiesService.findOne(propertyId) as PropertyDocument;
    const propertyOwnerId = this.toIdString(property.owner);
    const requesterId     = this.toIdString(user._id);

    if (propertyOwnerId !== requesterId && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not authorized');
    }

    return this.bookingModel
      .find({ property: new Types.ObjectId(propertyId) })
      .populate('guest', 'name email')
      .sort({ checkIn: 1 });
  }

  // ── Admin: all bookings ────────────────────────────────────────
  async findAll() {
    return this.bookingModel
      .find()
      .populate('property', 'name location')
      .populate('guest', 'name email')
      .sort({ createdAt: -1 });
  }

  async findOne(id: string, user: UserDocument): Promise<BookingDocument> {
    const booking = await this.bookingModel.findById(id).populate('property guest');
    if (!booking) throw new NotFoundException('Booking not found');

    const requesterId = this.toIdString(user._id);
    const guestId     = this.toIdString(booking.guest);
    const ownerId     = this.toIdString((booking.property as any)?.owner);

    const isGuest = guestId === requesterId;
    const isOwner = ownerId === requesterId;

    if (!isGuest && !isOwner && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not authorized');
    }

    return booking;
  }

  // ── Mark booking as completed (owner/admin only) ───────────────
  async markCompleted(id: string, user: UserDocument): Promise<Booking> {
    const booking = await this.bookingModel.findById(id).populate('property');
    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Only confirmed bookings can be marked as completed.');
    }

    const ownerId = this.toIdString((booking.property as any)?.owner);
    if (ownerId !== this.toIdString(user._id) && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not authorized');
    }

    booking.status = BookingStatus.COMPLETED;
    return booking.save();
  }

  // ── Cancel a booking ───────────────────────────────────────────
  async cancel(id: string, user: UserDocument): Promise<Booking> {
    const booking = await this.bookingModel.findById(id).populate('property');
    if (!booking) throw new NotFoundException('Booking not found');

    const requesterId = this.toIdString(user._id);
    const guestId     = this.toIdString(booking.guest);
    const ownerId     = this.toIdString((booking.property as any)?.owner);

    const isGuest = guestId === requesterId;
    const isOwner = ownerId === requesterId;

    if (!isGuest && !isOwner && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not authorized');
    }

    if ([BookingStatus.COMPLETED, BookingStatus.EXPIRED].includes(booking.status)) {
      throw new BadRequestException(`Cannot cancel a ${booking.status} booking.`);
    }

    booking.status = BookingStatus.CANCELLED;
    return booking.save();
  }

  // ── Expire unpaid bookings (called by a cron job) ─────────────
  async expireUnpaidBookings(): Promise<number> {
    const result = await this.bookingModel.updateMany(
      {
        status: BookingStatus.AWAITING_PAYMENT,
        paymentDeadline: { $lt: new Date() },
      },
      { $set: { status: BookingStatus.EXPIRED } },
    );
    return result.modifiedCount;
  }

  // ── Delete — only AWAITING_PAYMENT or EXPIRED bookings ────────
  async delete(id: string, user: UserDocument): Promise<void> {
    const booking = await this.bookingModel.findById(id);
    if (!booking) throw new NotFoundException('Booking not found');

    const requesterId = this.toIdString(user._id);
    const guestId     = this.toIdString(booking.guest);

    if (guestId !== requesterId && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not authorized');
    }

    if (![BookingStatus.AWAITING_PAYMENT, BookingStatus.EXPIRED, BookingStatus.CANCELLED].includes(booking.status)) {
      throw new BadRequestException('Only unpaid, expired, or cancelled bookings can be deleted.');
    }

    await this.bookingModel.findByIdAndDelete(id);
  }
}