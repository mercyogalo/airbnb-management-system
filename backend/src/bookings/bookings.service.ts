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
    if (property.owner.toString() !== owner._id.toString() && owner.role !== UserRole.ADMIN) {
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

    const isGuest = booking.guest['_id'].toString() === user._id.toString();
    const isOwner = (booking.property as any).owner?.toString() === user._id.toString();
    if (!isGuest && !isOwner && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not authorized');
    }
    return booking;
  }

  async updateStatus(id: string, status: BookingStatus, user: UserDocument): Promise<Booking> {
    const booking = await this.bookingModel.findById(id).populate('property');
    if (!booking) throw new NotFoundException('Booking not found');

    const isGuest = booking.guest.toString() === user._id.toString();
    const isOwner = (booking.property as any).owner?.toString() === user._id.toString();

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