import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document;

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  guest: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Property', required: true })
  property: Types.ObjectId;

  @Prop({ required: true })
  checkIn: Date;

  @Prop({ required: true })
  checkOut: Date;

  @Prop({ required: true, min: 1 })
  guests: number;

  @Prop({ required: true })
  totalPrice: number;

  @Prop({ type: String, enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Prop()
  specialRequests?: string;

  // Guest contact — required so owner can reach them
  @Prop({ required: true })
  guestPhone: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

// Compound index to prevent double bookings efficiently
BookingSchema.index({ property: 1, checkIn: 1, checkOut: 1 });
BookingSchema.index({ guest: 1 });